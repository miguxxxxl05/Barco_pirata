import React, { useState } from 'react';
import html2pdf from 'html2pdf.js';

const AnnualReportModal = ({ reservations, onClose }) => {
    // Extraer qué años tienen reservaciones en la base de datos
    const yearsAvailable = [...new Set(reservations.map(r => r.reservation_date?.substring(0, 4)).filter(Boolean))].sort((a, b) => b.localeCompare(a));
    const defaultYear = yearsAvailable.length > 0 ? yearsAvailable[0] : new Date().getFullYear().toString();
    const [selectedYear, setSelectedYear] = useState(defaultYear);

    // Filtrar reservaciones por año seleccionado
    const yearReservations = reservations.filter(r => r.reservation_date?.startsWith(selectedYear));
    const validReservations = yearReservations.filter(r => r.status === 'paid' || r.status === 'in_progress' || r.status === 'completed');
    const cancelledReservations = yearReservations.filter(r => r.status === 'cancelled');

    const totalRevenue = validReservations.reduce((sum, r) => sum + Number(r.total_price || 0), 0);
    const totalPassengers = validReservations.reduce((sum, r) => sum + parseInt(r.persons_count || 1, 10), 0);

    // Agrupar por meses
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const monthStats = months.map(m => ({ name: m, revenue: 0, passengers: 0, count: 0 }));

    validReservations.forEach(r => {
        const token = r.reservation_date.substring(5, 7);
        const monthIndex = parseInt(token, 10) - 1;
        if (monthStats[monthIndex]) {
            monthStats[monthIndex].revenue += Number(r.total_price || 0);
            monthStats[monthIndex].passengers += parseInt(r.persons_count || 1, 10);
            monthStats[monthIndex].count += 1;
        }
    });

    // Agrupar por paquetes (Anual)
    const packageStats = {};
    validReservations.forEach(r => {
        const pkgName = r.packages?.name || 'Otro';
        if (!packageStats[pkgName]) packageStats[pkgName] = { revenue: 0, passengers: 0, count: 0 };
        packageStats[pkgName].revenue += Number(r.total_price || 0);
        packageStats[pkgName].passengers += parseInt(r.persons_count || 1, 10);
        packageStats[pkgName].count += 1;
    });

    const handleDownloadPDF = () => {
        const element = document.getElementById('printable-annual-report');
        const opt = {
            margin: 0.5,
            filename: `Reporte_Anual_BarcoPirata_${selectedYear}.pdf`,
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
                  #printable-annual-report, #printable-annual-report * { visibility: visible; }
                  #printable-annual-report {
                    position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px;
                    box-shadow: none !important;
                  }
                  .no-print { display: none !important; }
                }
            `}</style>

            {/* Controles de visor */}
            <div className="no-print" style={{ width: '100%', maxWidth: '850px', background: '#2c2c2c', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ background: '#b59250', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        </div>
                        <div>
                            <h2 style={{ color: '#f9f9f9', margin: '0 0 4px 0', fontSize: '1.25rem', fontWeight: '600', fontFamily: "'Playfair Display', serif" }}>Reporte General Anual</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ color: '#b59250', fontSize: '0.875rem' }}>Año a consultar:</span>
                                <select
                                    value={selectedYear}
                                    onChange={e => setSelectedYear(e.target.value)}
                                    style={{ background: '#1a1814', color: 'white', border: '1px solid #b59250', borderRadius: '4px', padding: '4px 8px', outline: 'none' }}
                                >
                                    {yearsAvailable.length === 0 && <option>{selectedYear}</option>}
                                    {yearsAvailable.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button onClick={handleDownloadPDF} style={{ background: '#b59250', border: 'none', color: 'white', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            Descargar Reporte PDF
                        </button>
                        <button onClick={onClose} style={{ background: 'transparent', border: '1px solid #777', color: '#999', cursor: 'pointer', fontSize: '0.9rem', padding: '10px 15px', borderRadius: '6px', display: 'flex' }}>Cerrar</button>
                    </div>
                </div>
            </div>

            {/* Documento Imprimible */}
            <div style={{ width: '100%', maxWidth: '850px', background: '#e0e0e0', padding: '40px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'center' }}>
                <div id="printable-annual-report" style={{ background: 'white', padding: '40px', borderRadius: '4px', width: '750px', maxWidth: '100%', textAlign: 'left', fontFamily: "'Open Sans', Arial, sans-serif", color: '#2c2c2c', boxShadow: '0 0 15px rgba(0,0,0,0.2)' }}>

                    {/* Header Institucional */}
                    <div style={{ borderBottom: '3px solid #b59250', paddingBottom: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <h1 style={{ color: '#2c2c2c', fontSize: '2.5rem', margin: '0 0 5px 0', fontFamily: "'Playfair Display', serif" }}>Barco Pirata</h1>
                            <div style={{ color: '#777', fontSize: '0.9rem' }}>Reporte de Rendimiento Ejecutivo Anual</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1.4rem', color: '#b59250', fontFamily: "'Playfair Display', serif" }}>Ejercicio {selectedYear}</div>
                            <div style={{ color: '#999', fontSize: '0.8rem' }}>Reimpreso el {new Date().toLocaleDateString()}</div>
                        </div>
                    </div>

                    {/* Resumen General Anual */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
                        <div style={{ background: 'rgba(181, 146, 80, 0.05)', border: '1px solid #e0e0e0', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ color: '#b59250', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Ingreso Anual Bruto</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#2c2c2c' }}>${totalRevenue}</div>
                        </div>
                        <div style={{ background: '#f9f9f9', border: '1px solid #e0e0e0', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ color: '#b59250', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Flujo de Pasajeros</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#2c2c2c' }}>{totalPassengers}</div>
                        </div>
                        <div style={{ background: '#fff5f5', border: '1px solid #e0e0e0', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ color: '#dc3545', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Viajes Cancelados</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#2c2c2c' }}>{cancelledReservations.length}</div>
                        </div>
                    </div>

                    {/* Desglose de Meses */}
                    <h3 style={{ color: '#2c2c2c', marginBottom: '15px', borderBottom: '1px solid #e0e0e0', paddingBottom: '10px', fontFamily: "'Playfair Display', serif" }}>1. Rendimiento y Captación por Meses</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px', fontSize: '0.9rem' }}>
                        <thead style={{ background: '#2c2c2c', color: '#b59250' }}>
                            <tr>
                                <th style={{ padding: '10px', textAlign: 'left' }}>Mes</th>
                                <th style={{ padding: '10px', textAlign: 'center' }}>Folios Pagados</th>
                                <th style={{ padding: '10px', textAlign: 'center' }}>Pasajeros a Bordo</th>
                                <th style={{ padding: '10px', textAlign: 'right' }}>Recaudación Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthStats.map((stat, idx) => {
                                if (stat.count === 0 && stat.revenue === 0) return null; // No mostrar meses vacíos en el PDF
                                return (
                                    <tr key={idx} style={{ background: idx % 2 === 0 ? 'white' : '#f9f9f9', borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{stat.name}</td>
                                        <td style={{ padding: '10px', textAlign: 'center' }}>{stat.count}</td>
                                        <td style={{ padding: '10px', textAlign: 'center' }}>{stat.passengers}</td>
                                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#2c2c2c' }}>${stat.revenue}</td>
                                    </tr>
                                );
                            })}
                            {monthStats.filter(m => m.count > 0).length === 0 && (
                                <tr>
                                    <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Ninguna actividad financiera registrada para {selectedYear}.</td>
                                </tr>
                            )}
                        </tbody>
                        {monthStats.filter(m => m.count > 0).length > 0 && (
                            <tfoot>
                                <tr style={{ background: 'rgba(181, 146, 80, 0.1)', fontWeight: 'bold', fontSize: '1rem' }}>
                                    <td style={{ padding: '10px', color: '#2c2c2c', borderTop: '2px solid #2c2c2c' }}>Cierre Total</td>
                                    <td style={{ padding: '10px', textAlign: 'center', borderTop: '2px solid #2c2c2c' }}>{validReservations.length}</td>
                                    <td style={{ padding: '10px', textAlign: 'center', borderTop: '2px solid #2c2c2c' }}>{totalPassengers}</td>
                                    <td style={{ padding: '10px', textAlign: 'right', color: '#b59250', borderTop: '2px solid #2c2c2c' }}>${totalRevenue} MXN</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>

                    {/* Desglose por Paquetes en el año */}
                    <h3 style={{ color: '#2c2c2c', marginBottom: '15px', borderBottom: '1px solid #e0e0e0', paddingBottom: '10px', fontFamily: "'Playfair Display', serif" }}>2. Desempeño de Paquetes en {selectedYear}</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', fontSize: '0.85rem' }}>
                        <thead style={{ background: '#f0f0f0', color: '#2c2c2c', borderBottom: '2px solid #ccc' }}>
                            <tr>
                                <th style={{ padding: '8px', textAlign: 'left' }}>Nombre del Paseo / Modalidad</th>
                                <th style={{ padding: '8px', textAlign: 'center' }}>Frecuencia de Venta</th>
                                <th style={{ padding: '8px', textAlign: 'center' }}>Aportación de Psj.</th>
                                <th style={{ padding: '8px', textAlign: 'right' }}>Derrama Generada</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.keys(packageStats).length > 0 ? Object.entries(packageStats).map(([pkgName, stats], idx) => (
                                <tr key={idx} style={{ borderBottom: '1px dotted #ccc' }}>
                                    <td style={{ padding: '8px', fontWeight: 'bold' }}>{pkgName}</td>
                                    <td style={{ padding: '8px', textAlign: 'center' }}>{stats.count} reservas</td>
                                    <td style={{ padding: '8px', textAlign: 'center' }}>{stats.passengers} personas</td>
                                    <td style={{ padding: '8px', textAlign: 'right', color: '#b59250' }}>${stats.revenue}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan="4" style={{ padding: '15px', textAlign: 'center' }}>Sin datos de paquetes vendidos.</td></tr>
                            )}
                        </tbody>
                    </table>

                    <div style={{ textAlign: 'center', marginTop: '50px', paddingTop: '20px', borderTop: '1px dashed #ccc', color: '#999', fontSize: '0.8rem' }}>
                        Módulo de Balance Anual Administrativo - Barco Pirata Pto Peñasco. Prohibida su divulgación externa sin consentimiento directivo.
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AnnualReportModal;
