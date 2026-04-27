import React from 'react';
import html2pdf from 'html2pdf.js';

const Voucher = ({ receipt, reservation, onClose, dark = false }) => {
    const handleDownloadPDF = () => {
        const element = document.getElementById('printable-voucher');
        html2pdf().set({
            margin: 0.5,
            filename: `Voucher_${receipt.paymentId}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
        }).from(element).save();
    };

    const overlayStyle = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: dark ? 'rgba(26,24,20,0.92)' : 'rgba(0,0,0,0.65)',
        zIndex: 9999,
        overflowY: 'auto',
        padding: '40px 20px',
        fontFamily: "'Open Sans', sans-serif",
    };

    const controlsBg = dark ? '#2c2c2c' : 'white';
    const controlsText = dark ? '#f9f9f9' : '#2c2c2c';
    const controlsMuted = dark ? '#999' : '#888';
    const controlsBorder = dark ? '#444' : '#eee';

    return (
        <div style={overlayStyle}>
            <style>{`
              @media print {
                body * { visibility: hidden; }
                #printable-voucher, #printable-voucher * { visibility: visible; }
                #printable-voucher { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; box-shadow: none !important; }
                .voucher-no-print { display: none !important; }
              }
            `}</style>

            <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* --- Panel de controles --- */}
                <div className="voucher-no-print" style={{ background: controlsBg, borderRadius: '12px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', border: dark ? 'none' : '1px solid #e0e0e0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', paddingBottom: '20px', borderBottom: `1px solid ${controlsBorder}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ background: '#b59250', padding: '10px', borderRadius: '8px' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            </div>
                            <div>
                                <h2 style={{ margin: '0 0 4px', color: controlsText, fontFamily: "'Playfair Display', serif", fontSize: '1.2rem' }}>
                                    {dark ? 'Detalles del Recibo' : 'Tu Comprobante de Pago'}
                                </h2>
                                <span style={{ color: '#b59250', fontFamily: 'monospace', fontSize: '0.9rem' }}>#{receipt.paymentId}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <span style={{ background: dark ? 'rgba(181,146,80,0.15)' : '#d4edda', color: dark ? '#b59250' : '#155724', border: dark ? '1px solid #b59250' : 'none', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                {dark ? 'COMPLETADO' : 'PAGO COMPLETADO'}
                            </span>
                            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' }}>✕</button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                        {[
                            ['Fecha', new Date(receipt.date).toLocaleDateString()],
                            ['Cliente', receipt.client],
                            ['Método', receipt.method === 'card' ? 'Tarjeta' : 'Efectivo'],
                            ['Total', `$${receipt.amount} MXN`],
                        ].map(([label, val]) => (
                            <div key={label}>
                                <div style={{ color: controlsMuted, fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>{label}</div>
                                <div style={{ color: controlsText, fontWeight: label === 'Total' ? 'bold' : 'normal' }}>{val}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button onClick={() => window.print()} style={{ background: 'none', border: `1px solid ${dark ? '#555' : '#ccc'}`, color: dark ? '#b59250' : '#555', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Imprimir</button>
                        <button onClick={handleDownloadPDF} style={{ background: '#b59250', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Descargar PDF</button>
                    </div>
                </div>

                {/* --- Voucher imprimible --- */}
                <div style={{ background: dark ? '#2c2c2c' : 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                    <div style={{ padding: 'clamp(20px,4vw,40px) 20px', background: '#e0e0e0', display: 'flex', justifyContent: 'center' }}>
                        <div id="printable-voucher" style={{ background: 'white', padding: 'clamp(20px,4vw,40px)', borderRadius: '4px', width: '100%', maxWidth: '700px', fontFamily: "'Open Sans', Arial, sans-serif", color: '#2c2c2c', boxShadow: '0 0 15px rgba(0,0,0,0.1)' }}>

                            {/* Header empresa */}
                            <div style={{ border: '1px solid #b59250', borderRadius: '8px', padding: '20px', marginBottom: '30px', textAlign: 'center' }}>
                                <h1 style={{ color: '#2c2c2c', fontSize: '2.5rem', margin: '0 0 10px', fontFamily: "'Playfair Display', serif" }}>Barco Pirata</h1>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', color: '#777', fontSize: '0.9rem', flexWrap: 'wrap' }}>
                                    <span>Recinto Portuario, P.P. Sonora</span>
                                    <span>Tel: 638-123-4567</span>
                                    <span>reservas@barcopirata.com</span>
                                </div>
                            </div>

                            {/* Dos columnas */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '30px', marginBottom: '30px', flexWrap: 'wrap' }}>
                                {/* Columna izquierda */}
                                <div style={{ flex: '1 1 220px' }}>
                                    <h4 style={{ color: '#2c2c2c', margin: '0 0 10px', fontFamily: "'Playfair Display', serif" }}>Detalles de la reserva</h4>
                                    <div style={{ border: '1px solid #e0e0e0', borderRadius: '6px', padding: '15px', marginBottom: '20px' }}>
                                        <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '0.9rem', color: '#b59250' }}>Paquete</div>
                                        <div style={{ padding: '8px', border: '1px solid #e0e0e0', borderRadius: '4px', marginBottom: '15px', background: '#f9f9f9' }}>{receipt.package}</div>
                                        <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '0.9rem', color: '#b59250' }}>Fecha de viaje</div>
                                        <div style={{ padding: '8px', border: '1px solid #e0e0e0', borderRadius: '4px', background: '#f9f9f9' }}>
                                            {reservation?.reservation_date || new Date(receipt.date).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <h4 style={{ color: '#2c2c2c', margin: '0 0 10px', fontFamily: "'Playfair Display', serif" }}>Reservado por</h4>
                                    <div style={{ border: '1px solid #e0e0e0', borderRadius: '6px', padding: '15px' }}>
                                        <div style={{ fontSize: '1.1rem' }}>{receipt.client}</div>
                                    </div>
                                </div>

                                {/* Columna derecha */}
                                <div style={{ flex: '1 1 220px' }}>
                                    <h2 style={{ color: '#b59250', fontSize: '2rem', letterSpacing: '2px', margin: '0 0 20px', fontFamily: "'Playfair Display', serif", textAlign: 'right' }}>RESERVA</h2>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', alignItems: 'center' }}>
                                        {[
                                            ['Reserva #', receipt.paymentId, true],
                                            ['Fecha de pago', new Date(receipt.date).toLocaleDateString(), false],
                                            ['Método', receipt.method === 'card' ? 'Tarjeta' : 'Efectivo', false],
                                        ].map(([lbl, val, gold]) => (
                                            <React.Fragment key={lbl}>
                                                <div style={{ fontWeight: 'bold', color: '#2c2c2c', fontSize: '0.9rem', textAlign: 'right', paddingRight: '10px' }}>{lbl}</div>
                                                <div style={{ padding: '8px 10px', border: `1px solid ${gold ? '#b59250' : '#e0e0e0'}`, borderRadius: '4px', textAlign: 'right', background: gold ? 'rgba(181,146,80,0.1)' : '#f9f9f9', fontFamily: gold ? 'monospace' : 'inherit', color: gold ? '#b59250' : 'inherit', fontWeight: gold ? 'bold' : 'normal', wordBreak: 'break-all' }}>{val}</div>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Tabla de items */}
                            <div style={{ overflowX: 'auto', marginBottom: '25px' }}>
                                <div style={{ border: '1px solid #2c2c2c', borderRadius: '6px', overflow: 'hidden', minWidth: '400px' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead style={{ background: '#2c2c2c', color: '#b59250' }}>
                                            <tr>
                                                <th style={{ padding: '12px', textAlign: 'center', width: '15%' }}>Cantidad</th>
                                                <th style={{ padding: '12px', textAlign: 'left' }}>Descripción</th>
                                                <th style={{ padding: '12px', textAlign: 'right', width: '20%' }}>Precio</th>
                                                <th style={{ padding: '12px', textAlign: 'right', width: '20%' }}>Importe</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e0e0e0' }}>1</td>
                                                <td style={{ padding: '12px', borderBottom: '1px solid #e0e0e0' }}>{receipt.package}</td>
                                                <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e0e0e0' }}>${receipt.amount}</td>
                                                <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e0e0e0' }}>${receipt.amount}</td>
                                            </tr>
                                            <tr style={{ background: 'rgba(181,146,80,0.1)' }}>
                                                <td colSpan="3" style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', borderTop: '1px solid #2c2c2c' }}>Total</td>
                                                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', borderTop: '1px solid #2c2c2c', fontSize: '1.1rem' }}>${receipt.amount} MXN</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Nota legal */}
                            <div style={{ border: '1px solid #e0e0e0', borderRadius: '6px', padding: '15px', color: '#777', fontSize: '0.85rem', lineHeight: '1.5', background: '#f9f9f9' }}>
                                Favor de llegar al recinto de abordaje 30 minutos antes. Todas las ventas son finales. Presente este folio al abordar.
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Voucher;
