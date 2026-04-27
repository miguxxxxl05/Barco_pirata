import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { logActivity } from '../utils/logger';
import Voucher from './Voucher';

const PaymentModal = ({ reservation, onClose, onPaymentSuccess, mode = 'admin-cobrar' }) => {
    const [method, setMethod] = useState(''); // 'cash' | 'card'
    const [loading, setLoading] = useState(false);
    const [ccData, setCcData] = useState({ number: '', name: '', exp: '', cvv: '' });
    const [receipt, setReceipt] = useState(null);

    useEffect(() => {
        if (mode === 'admin-confirmar-efectivo') setMethod('cash');
    }, [mode]);

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

            const { data: { session } } = await supabase.auth.getSession();
            await supabase.from('payments').insert([{
                reservation_id: reservation.id,
                amount: reservation.total_price,
                payment_method: method,
                card_number_last_4: method === 'card' ? ccData.number.slice(-4) : null,
                payment_status: 'completed',
                processed_by: session?.user?.email || 'admin'
            }]);

            await logActivity('UPDATE', 'RESERVATION', `Liquidó en ${method === 'cash' ? 'efectivo' : 'tarjeta'} el pago de la reserva #${reservation.id} por $${reservation.total_price} MXN`);

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

    if (receipt) {
        return (
            <Voucher
                receipt={receipt}
                reservation={reservation}
                dark={true}
                onClose={() => { onPaymentSuccess(); onClose(); }}
            />
        );
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
                                <span style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem', color: '#b59250', fontWeight: 'bold' }}>
                                    {mode === 'admin-confirmar-efectivo' ? 'Taquilla' : 'Reservar'}
                                </span>
                                <h1 style={{ fontFamily: "'Playfair Display', serif", margin: '5px 0', fontSize: '2rem', color: '#2c2c2c' }}>
                                    {mode === 'admin-confirmar-efectivo' ? 'Confirmar pago en efectivo' : (method === 'card' ? 'Pago con tarjeta' : 'Pago en efectivo')}
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
                                    {mode !== 'admin-confirmar-efectivo' && (
                                        <button type="button" onClick={() => setMethod('')} style={{ background: 'transparent', color: '#777', border: '1px solid #ccc', padding: '12px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Volver</button>
                                    )}
                                    <button type="submit" disabled={loading} style={{ background: '#b59250', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 4px 10px rgba(181, 146, 80, 0.3)' }}>
                                        {loading ? 'Procesando...' : (mode === 'admin-confirmar-efectivo' ? 'Confirmar pago recibido' : 'Pagar ahora')}
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
    );
}

export default PaymentModal;
