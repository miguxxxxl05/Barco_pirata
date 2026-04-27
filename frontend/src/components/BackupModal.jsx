import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../supabaseClient';
import { logActivity } from '../utils/logger';

const BackupModal = ({ onClose }) => {
    const [backupLogs, setBackupLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [working, setWorking] = useState(false);
    const [restorePreview, setRestorePreview] = useState(null);
    const [activeTab, setActiveTab] = useState('backup');
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        const { data } = await supabase.from('backup_logs').select('*').order('created_at', { ascending: false }).limit(50);
        setBackupLogs(data || []);
        setLoading(false);
    };

    const registerBackupLog = async (type, fileName, recordsCount, status, errorMsg = null) => {
        const { data: { session } } = await supabase.auth.getSession();
        const email = session?.user?.email || 'Admin';
        await supabase.from('backup_logs').insert([{
            user_email: email,
            backup_type: type,
            tables_included: 'reservations, packages, payments, activity_logs',
            status,
            file_name: fileName,
            records_count: recordsCount,
            error_message: errorMsg
        }]);
    };

    const handleCreateBackup = async () => {
        setWorking(true);
        try {
            const [{ data: reservations }, { data: packages }, { data: payments }, { data: logs }] = await Promise.all([
                supabase.from('reservations').select('*').order('created_at', { ascending: false }),
                supabase.from('packages').select('*'),
                supabase.from('payments').select('*').order('payment_date', { ascending: false }),
                supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(500),
            ]);

            const snapshot = {
                metadata: {
                    created_at: new Date().toISOString(),
                    version: '1.0',
                    project: 'Barco Pirata de Puerto Peñasco',
                    tables: ['reservations', 'packages', 'payments', 'activity_logs']
                },
                reservations: reservations || [],
                packages: packages || [],
                payments: payments || [],
                activity_logs: logs || []
            };

            const totalRecords = (reservations?.length || 0) + (packages?.length || 0) + (payments?.length || 0) + (logs?.length || 0);
            const dateStr = new Date().toISOString().slice(0, 10);
            const fileName = `respaldo_barco_pirata_${dateStr}.json`;

            const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(url);

            await registerBackupLog('MANUAL', fileName, totalRecords, 'SUCCESS');
            await logActivity('BACKUP', 'SYSTEM', `Respaldo manual creado: ${fileName} (${totalRecords} registros)`, 'INFO');
            await fetchLogs();
            alert(`✅ Respaldo creado exitosamente.\n📁 Archivo: ${fileName}\n📊 Total de registros: ${totalRecords}`);
        } catch (err) {
            await registerBackupLog('MANUAL', null, 0, 'FAILED', err.message);
            alert('❌ Error al crear respaldo: ' + err.message);
        } finally {
            setWorking(false);
        }
    };

    const handleCreateExcelBackup = async () => {
        setWorking(true);
        try {
            const [{ data: reservations }, { data: packages }, { data: payments }, { data: logs }] = await Promise.all([
                supabase.from('reservations').select('*, packages(name)').order('created_at', { ascending: false }),
                supabase.from('packages').select('*').order('id', { ascending: true }),
                supabase.from('payments').select('*').order('payment_date', { ascending: false }),
                supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(500),
            ]);

            const fmtDate = (d) => d ? new Date(d).toLocaleString('es-MX') : '';

            const reservationsSheet = (reservations || []).map(r => ({
                'Folio': String(r.id).substring(0, 8).toUpperCase(),
                'ID Completo': r.id,
                'Paquete': r.packages?.name || '—',
                'Fecha del Paseo': r.reservation_date,
                'Personas': r.persons_count,
                'Contacto': r.contact_name,
                'Teléfono': r.contact_phone,
                'Total (MXN)': Number(r.total_price) || 0,
                'Estado': r.status,
                'Motivo de Cancelación': r.cancellation_reason || '',
                'Fecha de Solicitud': fmtDate(r.created_at),
            }));

            const packagesSheet = (packages || []).map(p => ({
                'ID': p.id,
                'Nombre': p.name,
                'Precio (MXN)': Number(p.price) || 0,
                'Descripción': p.description || '',
                'Ideal para': p.ideal_for || '',
                'URL Imagen': p.image_url || '',
                'Creado': fmtDate(p.created_at),
            }));

            const paymentsSheet = (payments || []).map(pay => ({
                'ID Pago': pay.id,
                'Reserva': String(pay.reservation_id).substring(0, 8).toUpperCase(),
                'Monto (MXN)': Number(pay.amount) || 0,
                'Método': pay.payment_method === 'cash' ? 'Efectivo' : 'Tarjeta',
                'Últimos 4': pay.card_number_last_4 || '',
                'Estado': pay.payment_status,
                'Procesado por': pay.processed_by || '',
                'Fecha': fmtDate(pay.payment_date),
            }));

            const logsSheet = (logs || []).map(l => ({
                'Fecha': fmtDate(l.created_at),
                'Usuario': l.user_email,
                'Acción': l.action_type,
                'Entidad': l.entity_type,
                'Descripción': l.description,
                'Severidad': l.severity,
            }));

            const wb = XLSX.utils.book_new();

            const addSheet = (name, rows) => {
                const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ Aviso: 'Sin registros' }]);
                if (rows.length > 0) {
                    const headers = Object.keys(rows[0]);
                    ws['!cols'] = headers.map(h => {
                        const maxLen = Math.max(h.length, ...rows.map(r => String(r[h] ?? '').length));
                        return { wch: Math.min(Math.max(maxLen + 2, 10), 50) };
                    });
                }
                XLSX.utils.book_append_sheet(wb, ws, name);
            };

            addSheet('Reservaciones', reservationsSheet);
            addSheet('Paquetes', packagesSheet);
            addSheet('Pagos', paymentsSheet);
            addSheet('Bitácora', logsSheet);

            const summarySheet = [
                { Métrica: 'Generado', Valor: new Date().toLocaleString('es-MX') },
                { Métrica: 'Proyecto', Valor: 'Barco Pirata - El Rey del Mar' },
                { Métrica: 'Reservaciones', Valor: reservationsSheet.length },
                { Métrica: 'Paquetes', Valor: packagesSheet.length },
                { Métrica: 'Pagos', Valor: paymentsSheet.length },
                { Métrica: 'Eventos en Bitácora', Valor: logsSheet.length },
                { Métrica: 'Ingresos Totales (MXN)', Valor: paymentsSheet.reduce((sum, p) => sum + (p['Monto (MXN)'] || 0), 0) },
            ];
            const summaryWs = XLSX.utils.json_to_sheet(summarySheet);
            summaryWs['!cols'] = [{ wch: 28 }, { wch: 35 }];
            XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen');
            wb.SheetNames.unshift(wb.SheetNames.pop());

            const totalRecords = reservationsSheet.length + packagesSheet.length + paymentsSheet.length + logsSheet.length;
            const dateStr = new Date().toISOString().slice(0, 10);
            const fileName = `respaldo_barco_pirata_${dateStr}.xlsx`;

            XLSX.writeFile(wb, fileName);

            await registerBackupLog('EXCEL', fileName, totalRecords, 'SUCCESS');
            await logActivity('BACKUP', 'SYSTEM', `Respaldo Excel creado: ${fileName} (${totalRecords} registros)`, 'INFO');
            await fetchLogs();
            alert(`✅ Respaldo Excel creado.\n📁 Archivo: ${fileName}\n📊 Total de registros: ${totalRecords}\n📑 Hojas: Resumen, Reservaciones, Paquetes, Pagos, Bitácora`);
        } catch (err) {
            await registerBackupLog('EXCEL', null, 0, 'FAILED', err.message);
            alert('❌ Error al crear respaldo Excel: ' + err.message);
        } finally {
            setWorking(false);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                if (!data.metadata || !data.reservations) {
                    alert('❌ Archivo inválido. Selecciona un respaldo generado por este sistema.');
                    return;
                }
                setRestorePreview({ data, fileName: file.name });
            } catch {
                alert('❌ El archivo no es un JSON válido.');
            }
        };
        reader.readAsText(file);
    };

    const handleRestore = async () => {
        if (!restorePreview) return;
        const { data: snap, fileName } = restorePreview;

        const confirmed = window.confirm(
            `⚠️ RESTAURACIÓN DE RESPALDO\n\n` +
            `Archivo: ${fileName}\n` +
            `Fecha del respaldo: ${new Date(snap.metadata.created_at).toLocaleString()}\n` +
            `Reservaciones: ${snap.reservations.length}\n` +
            `Paquetes: ${snap.packages.length}\n` +
            `Pagos: ${snap.payments.length}\n\n` +
            `Esta operación recuperará todos los registros del respaldo que ya no existan (paquetes borrados, reservaciones perdidas, etc.).\n` +
            `¿Deseas continuar?`
        );
        if (!confirmed) return;

        setWorking(true);
        let totalRestored = 0;
        try {
            // Paquetes: upsert por id (inserta los que no existen, ignora los que ya están)
            if (snap.packages?.length > 0) {
                const { error } = await supabase
                    .from('packages')
                    .upsert(snap.packages, { onConflict: 'id', ignoreDuplicates: true });
                if (error) throw new Error('packages: ' + error.message);
                // Resetea la secuencia para que el próximo INSERT no choque con IDs restaurados
                await supabase.rpc('reset_packages_sequence');
                totalRestored += snap.packages.length;
            }

            // Reservaciones: upsert por id
            if (snap.reservations?.length > 0) {
                const { error } = await supabase
                    .from('reservations')
                    .upsert(snap.reservations, { onConflict: 'id', ignoreDuplicates: true });
                if (error) throw new Error('reservations: ' + error.message);
                totalRestored += snap.reservations.length;
            }

            // Pagos: upsert por id
            if (snap.payments?.length > 0) {
                const { error } = await supabase
                    .from('payments')
                    .upsert(snap.payments, { onConflict: 'id', ignoreDuplicates: true });
                if (error) throw new Error('payments: ' + error.message);
                totalRestored += snap.payments.length;
            }

            await registerBackupLog('RESTORE', fileName, totalRestored, 'SUCCESS');
            await logActivity('RESTORE', 'SYSTEM', `Restauración desde: ${fileName} (${totalRestored} registros recuperados)`, 'WARNING');
            await fetchLogs();
            setRestorePreview(null);
            alert(`✅ Restauración completada.\n📊 Registros recuperados: ${totalRestored}`);
        } catch (err) {
            await registerBackupLog('RESTORE', fileName, totalRestored, 'FAILED', err.message);
            alert('❌ Error durante la restauración: ' + err.message);
        } finally {
            setWorking(false);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            SUCCESS: { bg: '#d4edda', color: '#155724', label: 'EXITOSO' },
            FAILED: { bg: '#f8d7da', color: '#721c24', label: 'FALLIDO' },
            IN_PROGRESS: { bg: '#fff3cd', color: '#856404', label: 'EN PROCESO' }
        };
        const s = styles[status] || styles.SUCCESS;
        return <span style={{ padding: '3px 8px', background: s.bg, color: s.color, borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>{s.label}</span>;
    };

    const getTypeBadge = (type) => {
        const labels = { MANUAL: 'Manual (JSON)', AUTO: 'Automático', RESTORE: 'Restauración', EXCEL: 'Excel' };
        const colors = { EXCEL: { bg: '#d4edda', color: '#155724' }, RESTORE: { bg: '#fff3cd', color: '#856404' } };
        const c = colors[type] || { bg: '#e2e3e5', color: '#383d41' };
        return <span style={{ padding: '3px 8px', background: c.bg, color: c.color, borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>{labels[type] || type}</span>;
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: "'Open Sans', sans-serif", overflowY: 'auto' }}>
            <div style={{ width: '100%', maxWidth: '900px', background: '#fff', borderRadius: '12px', padding: '30px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f0ebe0', paddingBottom: '18px', marginBottom: '25px' }}>
                    <div>
                        <h2 style={{ margin: '0 0 4px 0', fontFamily: "'Playfair Display', serif", color: '#2c2c2c', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b59250" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            Respaldos y Restauración
                        </h2>
                        <p style={{ margin: 0, color: '#888', fontSize: '0.85rem' }}>Copias de seguridad y recuperación de datos del sistema.</p>
                    </div>
                    <button onClick={onClose} style={{ background: '#f5f5f5', border: '1px solid #ddd', color: '#444', cursor: 'pointer', padding: '8px 18px', borderRadius: '6px', fontWeight: 'bold' }}>✕ Cerrar</button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '25px', borderBottom: '2px solid #f0ebe0', paddingBottom: '15px' }}>
                    {['backup', 'restore', 'history'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.88rem', background: activeTab === tab ? '#b59250' : '#f5f0e8', color: activeTab === tab ? '#fff' : '#7a6030', transition: 'all 0.2s' }}>
                            {tab === 'backup' ? '💾 Crear Respaldo' : tab === 'restore' ? '🔄 Restaurar' : '📋 Historial'}
                        </button>
                    ))}
                </div>

                {/* TAB: CREAR RESPALDO */}
                {activeTab === 'backup' && (
                    <div>
                        <div style={{ background: '#faf8f4', border: '1px solid #ede8da', borderRadius: '8px', padding: '25px', marginBottom: '20px' }}>
                            <h3 style={{ margin: '0 0 8px 0', color: '#2c2c2c' }}>Respaldo Completo del Sistema</h3>
                            <p style={{ color: '#666', marginBottom: '20px', lineHeight: '1.6', fontSize: '0.9rem' }}>
                                Descarga todos los datos del sistema en el formato que prefieras. Incluye reservaciones, paquetes, pagos y bitácora.
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '22px' }}>
                                {[
                                    { icon: '📅', label: 'Reservaciones', desc: 'Todos los registros de viajes' },
                                    { icon: '🎒', label: 'Paquetes', desc: 'Catálogo de servicios' },
                                    { icon: '💳', label: 'Pagos', desc: 'Historial de transacciones' },
                                    { icon: '📝', label: 'Bitácora', desc: 'Últimos 500 eventos del sistema' },
                                ].map(item => (
                                    <div key={item.label} style={{ background: '#fff', padding: '12px 15px', borderRadius: '6px', border: '1px solid #e8e0d0', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '1.4rem' }}>{item.icon}</span>
                                        <div>
                                            <div style={{ fontWeight: '700', color: '#333', fontSize: '0.88rem' }}>{item.label}</div>
                                            <div style={{ fontSize: '0.77rem', color: '#888' }}>{item.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                <button onClick={handleCreateExcelBackup} disabled={working} style={{ background: working ? '#ccc' : '#1d6f42', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '8px', cursor: working ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>
                                    {working ? 'Generando...' : 'Descargar como Excel (.xlsx)'}
                                </button>
                                <button onClick={handleCreateBackup} disabled={working} style={{ background: working ? '#ccc' : '#b59250', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '8px', cursor: working ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                    {working ? 'Generando...' : 'Descargar como JSON'}
                                </button>
                            </div>
                            <p style={{ margin: '14px 0 0 0', color: '#888', fontSize: '0.8rem' }}>
                                <strong style={{ color: '#1d6f42' }}>Excel:</strong> Para abrir en Microsoft Excel, Google Sheets o Numbers — incluye una hoja por tabla con encabezados en español. <strong style={{ color: '#b59250' }}>JSON:</strong> Para restaurar el sistema desde el panel "Restaurar".
                            </p>
                        </div>
                        <div style={{ background: '#fffbf0', border: '1px solid #ffeeba', borderRadius: '8px', padding: '15px' }}>
                            <strong style={{ color: '#856404' }}>📌 Recomendaciones de seguridad:</strong>
                            <ul style={{ margin: '8px 0 0 0', color: '#6d5000', lineHeight: '1.9', paddingLeft: '20px', fontSize: '0.87rem' }}>
                                <li>Realiza un respaldo <strong>al menos una vez al día</strong> al término de operaciones.</li>
                                <li>Guarda los archivos en <strong>3 ubicaciones distintas</strong>: USB, nube y computadora.</li>
                                <li>Conserva los últimos <strong>30 respaldos</strong> antes de eliminar los más antiguos.</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* TAB: RESTAURAR */}
                {activeTab === 'restore' && (
                    <div>
                        <div style={{ background: '#fff5f5', border: '1px solid #ffc9c9', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
                            <strong style={{ color: '#c0392b' }}>⚠️ Zona de Recuperación de Emergencia</strong>
                            <p style={{ margin: '6px 0 0 0', color: '#922b21', fontSize: '0.87rem' }}>
                                Restaurar <strong>NO elimina datos actuales</strong>. Solo recupera registros que ya no existen. Úsalo únicamente si perdiste información.
                            </p>
                        </div>

                        {!restorePreview ? (
                            <div style={{ border: '2px dashed #d4c9a8', borderRadius: '8px', padding: '50px 40px', textAlign: 'center', background: '#faf8f4' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📂</div>
                                <p style={{ color: '#888', marginBottom: '20px', fontSize: '0.9rem' }}>Selecciona un archivo <strong>.json</strong> generado por este sistema.</p>
                                <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} style={{ display: 'none' }} />
                                <button onClick={() => fileInputRef.current?.click()} style={{ background: '#2c2c2c', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    Seleccionar Archivo de Respaldo
                                </button>
                            </div>
                        ) : (
                            <div>
                                <div style={{ background: '#f0fff4', border: '1px solid #b2dfdb', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
                                    <h4 style={{ margin: '0 0 12px 0', color: '#155724' }}>✅ Archivo válido cargado</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '0.87rem', color: '#333' }}>
                                        <div><strong style={{ color: '#b59250' }}>Archivo:</strong> {restorePreview.fileName}</div>
                                        <div><strong style={{ color: '#b59250' }}>Fecha:</strong> {new Date(restorePreview.data.metadata.created_at).toLocaleString()}</div>
                                        <div><strong style={{ color: '#b59250' }}>Reservaciones:</strong> {restorePreview.data.reservations.length}</div>
                                        <div><strong style={{ color: '#b59250' }}>Paquetes:</strong> {restorePreview.data.packages.length}</div>
                                        <div><strong style={{ color: '#b59250' }}>Pagos:</strong> {restorePreview.data.payments.length}</div>
                                        <div><strong style={{ color: '#b59250' }}>Bitácora:</strong> {restorePreview.data.activity_logs.length} eventos</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button onClick={handleRestore} disabled={working} style={{ background: working ? '#ccc' : '#dc3545', color: '#fff', border: 'none', padding: '11px 24px', borderRadius: '8px', cursor: working ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                                        {working ? 'Restaurando...' : '🔄 Iniciar Restauración'}
                                    </button>
                                    <button onClick={() => { setRestorePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} style={{ background: '#f5f5f5', border: '1px solid #ddd', color: '#444', padding: '11px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB: HISTORIAL */}
                {activeTab === 'history' && (
                    <div style={{ overflowX: 'auto' }}>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>Cargando historial...</div>
                        ) : backupLogs.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: '#aaa', background: '#fafafa', borderRadius: '8px', fontSize: '0.9rem' }}>
                                Sin respaldos registrados todavía.
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                                <thead style={{ background: '#faf8f4' }}>
                                    <tr style={{ borderBottom: '2px solid #ede8da' }}>
                                        {['Fecha y Hora','Usuario','Tipo','Archivo','Registros','Estado'].map(h => (
                                            <th key={h} style={{ padding: '11px 12px', textAlign: 'left', color: '#b59250', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {backupLogs.map((log, idx) => (
                                        <tr key={log.id} style={{ borderBottom: '1px solid #f0ece0', background: idx % 2 === 0 ? '#fff' : '#fdfcf8' }}>
                                            <td style={{ padding: '10px 12px', color: '#999', whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString()}</td>
                                            <td style={{ padding: '10px 12px', fontWeight: '600', color: '#333' }}>{log.user_email}</td>
                                            <td style={{ padding: '10px 12px' }}>{getTypeBadge(log.backup_type)}</td>
                                            <td style={{ padding: '10px 12px', color: '#555', fontSize: '0.78rem' }}>{log.file_name || '—'}</td>
                                            <td style={{ padding: '10px 12px', color: '#b59250', fontWeight: '700' }}>{log.records_count}</td>
                                            <td style={{ padding: '10px 12px' }}>{getStatusBadge(log.status)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BackupModal;
