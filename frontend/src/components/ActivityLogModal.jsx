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
        switch (action) {
            case 'CREATE': return <span style={{ padding: '4px 8px', background: '#d4edda', color: '#155724', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>CREADO</span>;
            case 'UPDATE': return <span style={{ padding: '4px 8px', background: '#cce5ff', color: '#004085', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>MODIFICADO</span>;
            case 'DELETE': return <span style={{ padding: '4px 8px', background: '#f8d7da', color: '#721c24', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>ELIMINADO</span>;
            default: return <span style={{ padding: '4px 8px', background: '#e2e3e5', color: '#383d41', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>SISTEMA</span>;
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(26, 24, 20, 0.92)', zIndex: 9999, padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: "'Open Sans', sans-serif" }}>
            <div style={{ width: '100%', maxWidth: '900px', background: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f0f0f0', paddingBottom: '20px', marginBottom: '20px' }}>
                    <div>
                        <h2 style={{ margin: '0 0 5px 0', fontFamily: "'Playfair Display', serif", color: '#2c2c2c', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b59250" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                            Bitácora de Auditoría (Logs)
                        </h2>
                        <div style={{ color: '#777', fontSize: '0.9rem' }}>Registro inmutable de creación, edición y eliminación en el sistema.</div>
                    </div>
                    <button onClick={onClose} style={{ background: '#f5f5f5', border: '1px solid #ccc', color: '#333', cursor: 'pointer', padding: '8px 15px', borderRadius: '6px', fontWeight: 'bold' }}>✕ Cerrar</button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>Cargando registros de actividad...</div>
                    ) : logs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: '#999', background: '#f9f9f9', borderRadius: '8px' }}>No hay registros de actividad todavía o falta crear la tabla <strong>activity_logs</strong>.</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead style={{ background: '#f9f9f9', color: '#666' }}>
                                <tr>
                                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #eee' }}>Fecha y Hora</th>
                                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #eee' }}>Usuario Responsable</th>
                                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #eee' }}>Acción</th>
                                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #eee' }}>Módulo</th>
                                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #eee' }}>Descripción de la Modificación</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '12px', color: '#777', whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString()}</td>
                                        <td style={{ padding: '12px', fontWeight: 'bold', color: '#2c2c2c' }}>{log.user_email}</td>
                                        <td style={{ padding: '12px' }}>{getActionBadge(log.action_type)}</td>
                                        <td style={{ padding: '12px', color: '#b59250', fontWeight: '600' }}>{log.entity_type}</td>
                                        <td style={{ padding: '12px', color: '#444' }}>{log.description}</td>
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
