import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import html2pdf from 'html2pdf.js';
import { logActivity } from '../utils/logger';

const PaymentModal = ({ reservation, onClose, onPaymentSuccess }) => {
    const [method, setMethod] = useState(''); // 'cash' | 'card'
    const [loading, setLoading] = useState(false);
    const [ccData, setCcData] = useState({ number: '', name: '', exp: '', cvv: '' });
    const [receipt, setReceipt] = useState(null);

    const handleProcessPayment = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (method === 'card') {
            await new Promise(res => setTimeout(res, 2500));
            if (ccData.number.length < 15) {
                alert("La transacción fue declinada por el banco (número de tarjeta inválido).");
                setLoading(false);
                return;
            }
        }

        try {
            const { error: resError } = await supabase.from('reservations')
                .update({ status: 'paid' }).eq('id', reservation.id);

            if (resError) throw resError;

            await logActivity('UPDATE', 'RESERVATION', `Liquidó en ${method === 'cash' ? 'efectivo' : 'tarjeta'} el pago de la reserva #${reservation.id} por $${reservation.total_price} MXN`);

            // Safe fallback string conversion to prevent integer substring crash
            const safeId = reservation.id ? String(reservation.id) : String(Math.floor(Math.random() * 1000000));

            setReceipt({
                paymentId: safeId.substring(0, 8).toUpperCase(),
                date: new Date().toISOString(),
                method,
                amount: reservation.total_price,
                client: reservation.contact_name,
                package: reservation.packages?.name || 'Venta General'
            });

        } catch (err) {
            console.error("Crash Processing Payment:", err);
            alert("⚠️ Error técnico al procesar el pago: " + (err.message || String(err)));
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = () => {
        const element = document.getElementById('printable-voucher');
        const opt = {
            margin: 0.5,
            filename: `Voucher_${receipt.paymentId.substring(0, 8)}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    };

    if (receipt) {
        return (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(26, 24, 20, 0.92)', zIndex: 9999, overflowY: 'auto', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: "'Open Sans', sans-serif" }}>
                <style>{`
                  @media print {
                    body * { visibility: hidden; }
                    #printable-voucher, #printable-voucher * { visibility: visible; }
                    #printable-voucher {
                      position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px;
                      box-shadow: none !important;
                    }
                    .no-print { display: none !important; }
                  }
                `}</style>

                {/* --- Top Card: Metadata --- */}
                <div className="no-print" style={{ width: '100%', maxWidth: '850px', background: '#2c2c2c', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #444', paddingBottom: '20px', marginBottom: '20px' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ background: '#b59250', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                </div>
                                <div>
                                    <h2 style={{ color: '#f9f9f9', margin: '0 0 4px 0', fontSize: '1.25rem', fontWeight: '600', fontFamily: "'Playfair Display', serif" }}>Detalles del Recibo</h2>
                                    <span style={{ color: '#b59250', fontSize: '0.875rem', fontFamily: 'monospace' }}>#{receipt.paymentId.split('-')[0].toUpperCase()}</span>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ border: '1px solid #b59250', color: '#b59250', background: 'rgba(181, 146, 80, 0.15)', padding: '6px 12px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 'bold' }}>COMPLETADO</span>
                            <button onClick={() => { onPaymentSuccess(); onClose(); }} style={{ background: 'transparent', border: 'none', color: '#999', cursor: 'pointer', fontSize: '1.25rem', padding: '4px', display: 'flex' }}>✕</button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' }}>
                        <div>
                            <div style={{ color: '#999', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>FECHA DE EMISIÓN</div>
                            <div style={{ color: '#f9f9f9', fontSize: '0.95rem' }}>{new Date(receipt.date).toLocaleDateString()}</div>
                        </div>
                        <div>
                            <div style={{ color: '#999', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>CLIENTE</div>
                            <div style={{ color: '#f9f9f9', fontSize: '0.95rem' }}>{receipt.client}</div>
                        </div>
                        <div>
                            <div style={{ color: '#999', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>MÉTODO DE PAGO</div>
                            <div style={{ color: '#f9f9f9', fontSize: '0.95rem' }}>{receipt.method === 'cash' ? 'Efectivo' : 'Tarjeta'}</div>
                        </div>
                        <div>
                            <div style={{ color: '#999', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>TOTAL PAGADO</div>
                            <div style={{ color: '#f9f9f9', fontSize: '0.95rem', fontWeight: 'bold' }}>${receipt.amount} MXN</div>
                        </div>
                    </div>
                </div>

                {/* --- Bottom Card: Preview --- */}
                <div className="no-print" style={{ width: '100%', maxWidth: '850px', background: '#2c2c2c', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}>
                    <div style={{ background: '#1a1814', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f9f9f9', fontSize: '0.9rem', fontWeight: '500' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b59250" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                            Documento Digitalizado
                        </div>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button onClick={() => window.print()} style={{ background: 'transparent', border: 'none', color: '#b59250', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                                Imprimir Original
                            </button>
                            <button onClick={() => handleDownloadPDF()} style={{ background: 'transparent', border: 'none', color: '#b59250', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                Descargar PDF
                            </button>
                        </div>
                    </div>

                    <div style={{ padding: '40px 20px', background: '#e0e0e0', display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
                        {/* THE ACTUAL VOUCHER DIV */}
                        <div id="printable-voucher" style={{ background: 'white', padding: '40px', borderRadius: '4px', width: '700px', maxWidth: '100%', textAlign: 'left', fontFamily: "'Open Sans', Arial, sans-serif", color: '#2c2c2c', boxShadow: '0 0 15px rgba(0,0,0,0.2)', flexShrink: 0 }}>
                            {/* Header */}
                            <div style={{ border: '1px solid #b59250', borderRadius: '8px', padding: '20px', marginBottom: '30px', textAlign: 'center' }}>
                                <h1 style={{ color: '#2c2c2c', fontSize: '2.5rem', margin: '0 0 10px 0', fontFamily: "'Playfair Display', serif" }}>Barco Pirata</h1>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', color: '#777', fontSize: '0.9rem', flexWrap: 'wrap' }}>
                                    <span>Recinto Portuario, P.P. Sonora</span>
                                    <span>Tel: 638-123-4567</span>
                                    <span>reservas@barcopirata.com</span>
                                </div>
                            </div>

                            {/* Body Two Columns */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '30px', marginBottom: '30px', flexWrap: 'wrap' }}>
                                {/* Left Column */}
                                <div style={{ flex: '1 1 250px' }}>
                                    <h4 style={{ color: '#2c2c2c', marginBottom: '10px', fontSize: '1.1rem', margin: '0 0 10px 0', fontFamily: "'Playfair Display', serif" }}>Detalles de la reserva</h4>
                                    <div style={{ border: '1px solid #e0e0e0', borderRadius: '6px', padding: '15px', marginBottom: '20px' }}>
                                        <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '0.9rem', color: '#b59250' }}>Nombre de la unidad</div>
                                        <div style={{ padding: '8px', border: '1px solid #e0e0e0', borderRadius: '4px', marginBottom: '15px', background: '#f9f9f9' }}>{receipt.package}</div>

                                        <div>
                                            <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '0.9rem', color: '#b59250' }}>Fecha de viaje</div>
                                            <div style={{ padding: '8px', border: '1px solid #e0e0e0', borderRadius: '4px', background: '#f9f9f9' }}>{new Date(receipt.date).toLocaleDateString()}</div>
                                        </div>
                                    </div>

                                    <h4 style={{ color: '#2c2c2c', marginBottom: '10px', fontSize: '1.1rem', margin: '0 0 10px 0', fontFamily: "'Playfair Display', serif" }}>Reservado por</h4>
                                    <div style={{ border: '1px solid #e0e0e0', borderRadius: '6px', padding: '15px' }}>
                                        <div style={{ fontSize: '1.1rem' }}>{receipt.client}</div>
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div style={{ flex: '1 1 250px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                    <h2 style={{ color: '#b59250', fontSize: '2.5rem', letterSpacing: '2px', marginBottom: '30px', marginTop: '0', textAlign: 'right', fontFamily: "'Playfair Display', serif" }}>RESERVA</h2>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px', alignItems: 'center', width: '100%' }}>
                                        <div style={{ width: '120px', fontWeight: 'bold', color: '#2c2c2c', textAlign: 'right', paddingRight: '15px', fontSize: '0.95rem' }}>Reserva #</div>
                                        <div style={{ padding: '8px 12px', border: '1px solid #b59250', borderRadius: '4px', width: '150px', textAlign: 'right', background: 'rgba(181, 146, 80, 0.1)', fontFamily: 'monospace', color: '#b59250', fontWeight: 'bold' }}>{receipt.paymentId.split('-')[0].toUpperCase()}</div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px', alignItems: 'center', width: '100%' }}>
                                        <div style={{ width: '120px', fontWeight: 'bold', color: '#2c2c2c', textAlign: 'right', paddingRight: '15px', fontSize: '0.95rem' }}>Fecha de pago</div>
                                        <div style={{ padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '4px', width: '150px', textAlign: 'right', background: '#f9f9f9' }}>{new Date(receipt.date).toLocaleDateString()}</div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', width: '100%' }}>
                                        <div style={{ width: '120px', fontWeight: 'bold', color: '#2c2c2c', textAlign: 'right', paddingRight: '15px', fontSize: '0.95rem' }}>Método</div>
                                        <div style={{ padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '4px', width: '150px', textAlign: 'right', background: '#f9f9f9' }}>{receipt.method === 'cash' ? 'Efectivo' : 'Tarjeta'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Big Table */}
                            <div style={{ border: '1px solid #2c2c2c', borderRadius: '6px', overflow: 'hidden', marginBottom: '30px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: '#2c2c2c', color: '#b59250' }}>
                                        <tr>
                                            <th style={{ padding: '12px', textAlign: 'center', width: '15%' }}>Cantidad</th>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Descripción</th>
                                            <th style={{ padding: '12px', textAlign: 'right', width: '20%' }}>Precio Unitario</th>
                                            <th style={{ padding: '12px', textAlign: 'right', width: '20%' }}>Importe</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr style={{ background: 'white' }}>
                                            <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e0e0e0' }}>1</td>
                                            <td style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>{receipt.package}</td>
                                            <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e0e0e0' }}>${receipt.amount}</td>
                                            <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e0e0e0' }}>${receipt.amount}</td>
                                        </tr>
                                        <tr style={{ background: 'rgba(181, 146, 80, 0.1)' }}>
                                            <td colSpan="3" style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#2c2c2c', borderTop: '1px solid #2c2c2c' }}>Total</td>
                                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#2c2c2c', borderTop: '1px solid #2c2c2c', fontSize: '1.1rem' }}>${receipt.amount} MXN</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div style={{ marginBottom: '10px' }}>
                                <h4 style={{ color: '#b59250', marginBottom: '10px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 10px 0', fontFamily: "'Playfair Display', serif" }}>
                                    Información adicional
                                </h4>
                                <div style={{ border: '1px solid #e0e0e0', borderRadius: '6px', padding: '15px', color: '#777', fontSize: '0.85rem', lineHeight: '1.5', background: '#f9f9f9' }}>
                                    Favor de llegar al recinto de abordaje 30 minutos antes. Todas las ventas son finales según el reglamento aplicable. Este comprobante asegura la liquidez del paquete contratado previamente. Presente este folio al abordar.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(26, 24, 20, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, fontFamily: "'Open Sans', sans-serif" }}>
            <div style={{ background: 'white', padding: '40px', borderRadius: '16px', width: method ? '850px' : '550px', maxWidth: '95%', position: 'relative', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', transition: 'width 0.3s ease' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '25px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' }}>✕</button>

                {!method ? (
                    <>
                        <h2 style={{ fontFamily: "'Playfair Display', serif", marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '10px', color: '#2c2c2c' }}>Terminal Punto de Venta</h2>
                        <p style={{ color: '#777', borderBottom: '1px solid #e0e0e0', paddingBottom: '15px', marginBottom: '20px' }}>
                            Cobro pendiente para <strong style={{ color: '#b59250' }}>{reservation.contact_name}</strong> - <strong style={{ color: '#b59250' }}>${reservation.total_price} MXN</strong>
                        </p>

                        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', padding: '30px 0' }}>
                            <button onClick={() => setMethod('card')} style={{ flex: 1, padding: '25px', fontSize: '1.1rem', cursor: 'pointer', border: '2px solid #e0e0e0', borderRadius: '8px', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', transition: '0.3s' }}>
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2c2c2c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                                <strong style={{ color: '#2c2c2c' }}>Cobrar con Tarjeta</strong>
                            </button>
                            <button onClick={() => setMethod('cash')} style={{ flex: 1, padding: '25px', fontSize: '1.1rem', cursor: 'pointer', border: '2px solid #b59250', borderRadius: '8px', background: 'rgba(181, 146, 80, 0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', transition: '0.3s' }}>
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#b59250" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M6 12h.01M18 12h.01"></path></svg>
                                <strong style={{ color: '#b59250' }}>Recibir Efectivo</strong>
                            </button>
                        </div>
                    </>
                ) : (
                    <form onSubmit={handleProcessPayment} style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
                        {/* LEFT COLUMN: Input Form */}
                        <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div style={{ marginBottom: '25px' }}>
                                <span style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem', color: '#b59250', fontWeight: 'bold' }}>Reservar</span>
                                <h1 style={{ fontFamily: "'Playfair Display', serif", margin: '5px 0', fontSize: '2rem', color: '#2c2c2c' }}>
                                    {method === 'card' ? 'Pago con tarjeta' : 'Pago en efectivo'}
                                </h1>
                                <p style={{ color: '#777', fontSize: '0.9rem' }}>
                                    {method === 'card' ? `Ingresa los datos de tu tarjeta para completar la reservación.` : `Confirma la recepción del efectivo en mostrador.`}
                                </p>
                            </div>

                            {method === 'card' && (
                                <>
                                    {/* Visual Credit Card */}
                                    <div style={{ background: '#002855', borderRadius: '12px', padding: '25px', color: 'white', marginBottom: '25px', position: 'relative', overflow: 'hidden', boxShadow: '0 8px 20px rgba(0,40,85,0.2)' }}>
                                        <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
                                        <div style={{ position: 'absolute', right: '60px', bottom: '-40px', width: '100px', height: '100px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', position: 'relative' }}>
                                            <svg width="35" height="25" viewBox="0 0 40 30" fill="none"><rect width="40" height="30" rx="4" fill="#E2C17D" /><path d="M10 15h20v2H10z" fill="#002855" opacity="0.3" /></svg>
                                            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#E2C17D' }}>Tarjeta</span>
                                        </div>

                                        <div style={{ fontSize: '1.3rem', letterSpacing: '3px', marginBottom: '20px', fontFamily: 'monospace', textShadow: '1px 1px 2px rgba(0,0,0,0.5)', position: 'relative' }}>
                                            {ccData.number ? ccData.number.replace(/(\d{4})(?=\d)/g, '$1 ') : '•••• •••• •••• ••••'}
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', position: 'relative' }}>
                                            <div>
                                                <div style={{ opacity: 0.6, fontSize: '0.6rem', marginBottom: '3px' }}>Titular</div>
                                                <div style={{ fontWeight: '500' }}>{ccData.name || 'NOMBRE DEL TITULAR'}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ opacity: 0.6, fontSize: '0.6rem', marginBottom: '3px' }}>Vence</div>
                                                <div style={{ fontWeight: '500' }}>{ccData.exp || 'MM/AA'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Inputs */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.75rem', color: '#777', fontWeight: 'bold', marginBottom: '5px' }}>NÚMERO DE TARJETA</label>
                                            <input required maxLength="16" type="text" pattern="\d{15,16}" title="Solo números sin espacios" value={ccData.number} onChange={e => setCcData({ ...ccData, number: e.target.value })} style={{ width: '100%', padding: '12px', border: 'none', borderBottom: '1px solid #ccc', background: '#f9f9f9', outline: 'none', fontSize: '1rem', color: '#2c2c2c', boxSizing: 'border-box' }} />
                                        </div>
                                        <div style={{ display: 'flex', gap: '20px' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', fontSize: '0.75rem', color: '#777', fontWeight: 'bold', marginBottom: '5px' }}>VENCIMIENTO (MM/AA)</label>
                                                <input required maxLength="5" value={ccData.exp} onChange={e => setCcData({ ...ccData, exp: e.target.value })} style={{ width: '100%', padding: '12px', border: 'none', borderBottom: '1px solid #ccc', background: '#f9f9f9', outline: 'none', fontSize: '1rem', color: '#2c2c2c', boxSizing: 'border-box' }} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', fontSize: '0.75rem', color: '#777', fontWeight: 'bold', marginBottom: '5px' }}>CVV</label>
                                                <input required maxLength="4" type="password" value={ccData.cvv} onChange={e => setCcData({ ...ccData, cvv: e.target.value })} style={{ width: '100%', padding: '12px', border: 'none', borderBottom: '1px solid #ccc', background: '#f9f9f9', outline: 'none', fontSize: '1rem', color: '#2c2c2c', boxSizing: 'border-box' }} />
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.75rem', color: '#777', fontWeight: 'bold', marginBottom: '5px' }}>TITULAR DE LA TARJETA</label>
                                            <input required value={ccData.name} onChange={e => setCcData({ ...ccData, name: e.target.value })} style={{ width: '100%', padding: '12px', border: 'none', borderBottom: '1px solid #ccc', background: '#f9f9f9', outline: 'none', fontSize: '1rem', color: '#2c2c2c', boxSizing: 'border-box' }} />
                                        </div>
                                    </div>
                                </>
                            )}

                            {method === 'cash' && (
                                <div style={{ padding: '30px', background: 'rgba(181, 146, 80, 0.05)', border: '1px dashed #b59250', borderRadius: '12px', textAlign: 'center', marginBottom: '20px' }}>
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#b59250" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '15px' }}><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M6 12h.01M18 12h.01"></path></svg>
                                    <h3 style={{ color: '#2c2c2c', marginBottom: '10px' }}>Recepción de Efectivo</h3>
                                    <p style={{ color: '#777', fontSize: '0.95rem' }}>Confirma que has recibido <strong>${reservation.total_price} MXN</strong> en físico por parte de Recepción.</p>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '30px' }}>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: '#777', textTransform: 'uppercase', fontWeight: 'bold' }}>TOTAL A COBRAR</span>
                                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#2c2c2c', lineHeight: '1' }}>${reservation.total_price}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <button type="button" onClick={() => setMethod('')} style={{ background: 'transparent', color: '#777', border: '1px solid #ccc', padding: '12px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Volver</button>
                                    <button type="submit" disabled={loading} style={{ background: '#b59250', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 4px 10px rgba(181, 146, 80, 0.3)' }}>
                                        {loading ? 'Procesando...' : 'Pagar ahora'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Summary Card */}
                        <div style={{ flex: '1 1 280px', background: '#1a1814', borderRadius: '16px', padding: '30px', color: '#f9f9f9', display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{ color: '#b59250', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '30px', fontFamily: "'Playfair Display', serif", fontSize: '1.4rem' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                Tu travesía
                            </h3>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', paddingBottom: '20px', borderBottom: '1px solid #333', marginBottom: '25px' }}>
                                <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#b59250', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', color: 'white', fontSize: '1.2rem', flexShrink: 0 }}>
                                    {reservation.contact_name ? reservation.contact_name.charAt(0).toUpperCase() : 'C'}
                                </div>
                                <div style={{ overflow: 'hidden' }}>
                                    <div style={{ fontWeight: '600', fontSize: '1.05rem', color: 'white', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{reservation.contact_name}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#888' }}>{reservation.phone || 'Sin teléfono'}</div>
                                </div>
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '0.9rem' }}>
                                    <span style={{ color: '#888' }}>Paquete</span>
                                    <span style={{ fontWeight: '500', textAlign: 'right' }}>{reservation.packages?.name || 'Venta general'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '0.9rem' }}>
                                    <span style={{ color: '#888' }}>Fecha del paseo</span>
                                    <span style={{ fontWeight: '500' }}>{new Date(reservation.date).toLocaleDateString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '0.9rem' }}>
                                    <span style={{ color: '#888' }}>Cantidad</span>
                                    <span style={{ fontWeight: '500' }}>{reservation.quantity || 1} Persona(s)</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', fontSize: '0.9rem' }}>
                                    <span style={{ color: '#888' }}>Folio temporal</span>
                                    <span style={{ fontWeight: '500' }}>{String(reservation.id).substring(0, 8).toUpperCase()}</span>
                                </div>
                            </div>

                            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                    <span style={{ color: '#888', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Total a pagar</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                    <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#b59250', lineHeight: 1 }}>${reservation.total_price}</span>
                                    <span style={{ color: '#b59250', fontWeight: 'bold', fontSize: '0.85rem', paddingBottom: '3px' }}>MXN</span>
                                </div>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}

export default PaymentModal;
