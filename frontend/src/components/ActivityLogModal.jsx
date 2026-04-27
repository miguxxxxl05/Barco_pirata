import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const ActivityLogModal = ({ onClose }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLogs() {
            try {
                // Obtenemos los últimos 100 registros para no sobrecargar
                const { data, error } = await supabase
                    .from('activity_logs')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(100);

                if (error) throw error;
                setLogs(data || []);
            } catch (err) {
                console.error("Error al cargar la bitácora:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchLogs();
    }, []);

    const getActionBadge = (action) => {
        const map = {
            CREATE:  { bg: '#d4edda', color: '#155724', label: 'CREADO' },
            UPDATE:  { bg: '#cce5ff', color: '#004085', label: 'MODIFICADO' },
            DELETE:  { bg: '#f8d7da', color: '#721c24', label: 'ELIMINADO' },
            BACKUP:  { bg: '#d1ecf1', color: '#0c5460', label: 'RESPALDO' },
            RESTORE: { bg: '#fff3cd', color: '#856404', label: 'RESTAURACIÓN' },
        };
        const s = map[action] || { bg: '#e2e3e5', color: '#383d41', label: 'SISTEMA' };
        return <span style={{ padding: '4px 8px', background: s.bg, color: s.color, borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>{s.label}</span>;
    };

    const getSeverityBadge = (severity) => {
        const map = {
            INFO:    { bg: '#e8f4fd', color: '#1a5276', label: 'INFO' },
            WARNING: { bg: '#fff3cd', color: '#856404', label: 'AVISO' },
            ERROR:   { bg: '#f8d7da', color: '#721c24', label: 'ERROR' },
        };
        const s = map[severity] || map.INFO;
        return <span style={{ padding: '3px 7px', background: s.bg, color: s.color, borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>{s.label}</span>;
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: "'Open Sans', sans-serif" }}>
            <div style={{ width: '100%', maxWidth: '1000px', background: '#fff', borderRadius: '12px', padding: '30px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f0ebe0', paddingBottom: '18px', marginBottom: '20px' }}>
                    <div>
                        <h2 style={{ margin: '0 0 4px 0', fontFamily: "'Playfair Display', serif", color: '#2c2c2c', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b59250" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                            Bitácora de Auditoría
                        </h2>
                        <p style={{ margin: 0, color: '#888', fontSize: '0.85rem' }}>Registro de todas las operaciones del sistema.</p>
                    </div>
                    <button onClick={onClose} style={{ background: '#f5f5f5', border: '1px solid #ddd', color: '#444', cursor: 'pointer', padding: '8px 18px', borderRadius: '6px', fontWeight: 'bold' }}>✕ Cerrar</button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>Cargando registros...</div>
                    ) : logs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: '#999', background: '#fafafa', borderRadius: '8px' }}>Sin registros todavía.</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                            <thead style={{ background: '#faf8f4' }}>
                                <tr style={{ borderBottom: '2px solid #ede8da' }}>
                                    {['Fecha y Hora','Usuario','Acción','Nivel','Módulo','Descripción'].map(h => (
                                        <th key={h} style={{ padding: '11px 12px', textAlign: 'left', color: '#b59250', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log, idx) => (
                                    <tr key={log.id} style={{ borderBottom: '1px solid #f0ece0', background: log.severity === 'ERROR' ? '#fff5f5' : log.severity === 'WARNING' ? '#fffcf0' : idx % 2 === 0 ? '#fff' : '#fdfcf8' }}>
                                        <td style={{ padding: '10px 12px', color: '#999', whiteSpace: 'nowrap', fontSize: '0.78rem' }}>{new Date(log.created_at).toLocaleString()}</td>
                                        <td style={{ padding: '10px 12px', fontWeight: '600', color: '#333' }}>{log.user_email}</td>
                                        <td style={{ padding: '10px 12px' }}>{getActionBadge(log.action_type)}</td>
                                        <td style={{ padding: '10px 12px' }}>{getSeverityBadge(log.severity || 'INFO')}</td>
                                        <td style={{ padding: '10px 12px', color: '#b59250', fontWeight: '600', fontSize: '0.78rem' }}>{log.entity_type}</td>
                                        <td style={{ padding: '10px 12px', color: '#444' }}>{log.description}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActivityLogModal;
