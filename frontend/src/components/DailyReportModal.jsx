import React, { useState } from 'react';
import html2pdf from 'html2pdf.js';

const DailyReportModal = ({ date, reservations, packages, onClose }) => {
    const defaultDate = date || new Date().toISOString().split('T')[0];

    // Filtramos las válidas para este día: ignore pending/cancelled for revenue, include completed, paid, in_progress
    const validReservations = reservations.filter(r =>
        r.reservation_date === defaultDate &&
        (r.status === 'paid' || r.status === 'in_progress' || r.status === 'completed')
    );

    const unchargedReservations = reservations.filter(r =>
        r.reservation_date === defaultDate && r.status === 'confirmed'
    );

    const cancelledReservations = reservations.filter(r =>
        r.reservation_date === defaultDate && r.status === 'cancelled'
    );

    const totalRevenue = validReservations.reduce((sum, r) => sum + Number(r.total_price || 0), 0);
    const totalPassengers = validReservations.reduce((sum, r) => sum + parseInt(r.persons_count || 1, 10), 0);

    const unchargedRevenue = unchargedReservations.reduce((sum, r) => sum + Number(r.total_price || 0), 0);
    const unchargedPassengers = unchargedReservations.reduce((sum, r) => sum + parseInt(r.persons_count || 1, 10), 0);

    // Breakdown by package
    const packageStats = {};
    validReservations.forEach(r => {
        const pkgName = r.packages?.name || 'Otro';
        if (!packageStats[pkgName]) packageStats[pkgName] = { revenue: 0, passengers: 0, count: 0 };
        packageStats[pkgName].revenue += Number(r.total_price || 0);
        packageStats[pkgName].passengers += parseInt(r.persons_count || 1, 10);
        packageStats[pkgName].count += 1;
    });

    const handleDownloadPDF = () => {
        const element = document.getElementById('printable-report');
        const opt = {
            margin: 0.5,
            filename: `Reporte_BarcoPirata_${defaultDate}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(26, 24, 20, 0.92)', zIndex: 9999, overflowY: 'auto', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: "'Open Sans', sans-serif" }}>
            <style>{`
                @media print {
                  body * { visibility: hidden; }
                  #printable-report, #printable-report * { visibility: visible; }
                  #printable-report {
                    position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px;
                    box-shadow: none !important;
                  }
                  .no-print { display: none !important; }
                }
            `}</style>

            {/* Header / Controls */}
            <div className="no-print" style={{ width: '100%', maxWidth: '850px', background: '#2c2c2c', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ background: '#b59250', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        </div>
                        <div>
                            <h2 style={{ color: '#f9f9f9', margin: '0 0 4px 0', fontSize: '1.25rem', fontWeight: '600', fontFamily: "'Playfair Display', serif" }}>Visor de Reportes</h2>
                            <span style={{ color: '#b59250', fontSize: '0.875rem' }}>Día Operativo: {defaultDate}</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button onClick={handleDownloadPDF} style={{ background: '#b59250', border: 'none', color: 'white', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            Descargar Reporte PDF
                        </button>
                        <button onClick={onClose} style={{ background: 'transparent', border: '1px solid #777', color: '#999', cursor: 'pointer', fontSize: '0.9rem', padding: '10px 15px', borderRadius: '6px', display: 'flex' }}>Cerrar Visor</button>
                    </div>
                </div>
            </div>

            {/* Printable Document */}
            <div style={{ width: '100%', maxWidth: '850px', background: '#e0e0e0', padding: '40px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'center' }}>
                <div id="printable-report" style={{ background: 'white', padding: '40px', borderRadius: '4px', width: '750px', maxWidth: '100%', textAlign: 'left', fontFamily: "'Open Sans', Arial, sans-serif", color: '#2c2c2c', boxShadow: '0 0 15px rgba(0,0,0,0.2)' }}>

                    {/* Header Institucional */}
                    <div style={{ borderBottom: '3px solid #b59250', paddingBottom: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <h1 style={{ color: '#2c2c2c', fontSize: '2.5rem', margin: '0 0 5px 0', fontFamily: "'Playfair Display', serif" }}>Barco Pirata</h1>
                            <div style={{ color: '#777', fontSize: '0.9rem' }}>Reporte Operativo de Recaudación y Embarque</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#b59250', fontFamily: "'Playfair Display', serif" }}>{defaultDate}</div>
                            <div style={{ color: '#999', fontSize: '0.8rem' }}>Impreso el {new Date().toLocaleDateString()} a las {new Date().toLocaleTimeString()}</div>
                        </div>
                    </div>

                    {/* Dashboard Metrics */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
                        <div style={{ background: 'rgba(181, 146, 80, 0.05)', border: '1px solid #e0e0e0', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ color: '#b59250', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Ingresos Liquidados</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#2c2c2c' }}>${totalRevenue}</div>
                            <div style={{ fontSize: '0.75rem', color: '#777' }}>MXN Netos</div>
                        </div>
                        <div style={{ background: '#f9f9f9', border: '1px solid #e0e0e0', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ color: '#b59250', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Pasajeros Confirmados</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#2c2c2c' }}>{totalPassengers}</div>
                            <div style={{ fontSize: '0.75rem', color: '#777' }}>Listos para zarpe</div>
                        </div>
                        <div style={{ background: '#fff5f5', border: '1px solid #e0e0e0', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ color: '#dc3545', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Reservas Canceladas</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#2c2c2c' }}>{cancelledReservations.length}</div>
                            <div style={{ fontSize: '0.75rem', color: '#777' }}>Por el usuario o admin</div>
                        </div>
                    </div>

                    {/* Desglose por paquete */}
                    <h3 style={{ color: '#2c2c2c', marginBottom: '15px', borderBottom: '1px solid #e0e0e0', paddingBottom: '10px', fontFamily: "'Playfair Display', serif" }}>1. Desglose de Ventas por Paquete</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px', fontSize: '0.9rem' }}>
                        <thead style={{ background: '#2c2c2c', color: '#b59250' }}>
                            <tr>
                                <th style={{ padding: '10px', textAlign: 'left' }}>Nombre del Paquete</th>
                                <th style={{ padding: '10px', textAlign: 'center' }}>Cantidad Reservas</th>
                                <th style={{ padding: '10px', textAlign: 'center' }}>Total Pasajeros</th>
                                <th style={{ padding: '10px', textAlign: 'right' }}>Ingreso Generado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.keys(packageStats).length > 0 ? Object.entries(packageStats).map(([pkgName, stats], idx) => (
                                <tr key={idx} style={{ background: idx % 2 === 0 ? 'white' : '#f9f9f9', borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '10px', fontWeight: '600' }}>{pkgName}</td>
                                    <td style={{ padding: '10px', textAlign: 'center' }}>{stats.count}</td>
                                    <td style={{ padding: '10px', textAlign: 'center' }}>{stats.passengers}</td>
                                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#b59250' }}>${stats.revenue}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Ningún boleto pagado registrado para hoy.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Tabla detallada de pasajeros liquidados */}
                    <h3 style={{ color: '#2c2c2c', marginBottom: '15px', borderBottom: '1px solid #e0e0e0', paddingBottom: '10px', fontFamily: "'Playfair Display', serif" }}>2. Registro de Abordaje (Pasajeros Pagados)</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px', fontSize: '0.85rem' }}>
                        <thead style={{ background: '#f0f0f0', color: '#2c2c2c', borderBottom: '2px solid #ccc' }}>
                            <tr>
                                <th style={{ padding: '8px', textAlign: 'left' }}>Folio Pago</th>
                                <th style={{ padding: '8px', textAlign: 'left' }}>Nombre Titular</th>
                                <th style={{ padding: '8px', textAlign: 'center' }}>Ps.</th>
                                <th style={{ padding: '8px', textAlign: 'left' }}>Paquete</th>
                                <th style={{ padding: '8px', textAlign: 'right' }}>Monto Pagado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {validReservations.length > 0 ? validReservations.map((r, idx) => (
                                <tr key={r.id} style={{ borderBottom: '1px dotted #ccc' }}>
                                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>{String(r.id).substring(0, 8).toUpperCase()}</td>
                                    <td style={{ padding: '8px', fontWeight: '600' }}>{r.contact_name}</td>
                                    <td style={{ padding: '8px', textAlign: 'center' }}>{r.persons_count}</td>
                                    <td style={{ padding: '8px' }}>{r.packages?.name || 'Venta General'}</td>
                                    <td style={{ padding: '8px', textAlign: 'right', color: '#b59250' }}>${r.total_price}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Lista de abordaje vacía.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Cuentas por cobrar */}
                    {unchargedReservations.length > 0 && (
                        <>
                            <h3 style={{ color: '#2c2c2c', marginBottom: '15px', borderBottom: '1px solid #e0e0e0', paddingBottom: '10px', fontFamily: "'Playfair Display', serif" }}>3. Cuentas por Cobrar (Esperando en Taquilla)</h3>
                            <div style={{ background: '#fff9e6', border: '1px solid #ffeeba', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ color: '#856404', fontWeight: 'bold' }}>Existen {unchargedReservations.length} reservas confirmadas que aún NO han sido pagadas.</div>
                                    <div style={{ fontSize: '0.85rem', color: '#666' }}>Potencial ingreso adicional de <strong style={{ color: '#2c2c2c' }}>${unchargedRevenue} MXN</strong> repartido en {unchargedPassengers} pasajeros temporales.</div>
                                </div>
                            </div>
                        </>
                    )}

                    <div style={{ textAlign: 'center', marginTop: '50px', paddingTop: '20px', borderTop: '1px dashed #ccc', color: '#999', fontSize: '0.8rem' }}>
                        Generado por el Sistema de Administración Módulo "Barco Pirata Pto Peñasco" - Documento de Uso Interno - Prohibida su distribución.
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DailyReportModal;
