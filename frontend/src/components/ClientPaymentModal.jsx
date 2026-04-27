import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { logActivity } from '../utils/logger';
import Voucher from './Voucher';

const overlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.65)', zIndex: 9999,
    overflowY: 'auto', padding: '40px 20px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    fontFamily: "'Open Sans', sans-serif",
};

const ClientPaymentModal = ({ reservation, onClose, onPaymentSuccess, initialReceipt = null }) => {
    const [method, setMethod] = useState('');
    const [loading, setLoading] = useState(false);
    const [ccData, setCcData] = useState({ number: '', name: '', exp: '', cvv: '' });
    const [receipt, setReceipt] = useState(initialReceipt);
    const [cashConfirmed, setCashConfirmed] = useState(false);

    const handleCardPayment = async (e) => {
        e.preventDefault();
        if (ccData.number.length < 15) {
            alert('La transacción fue declinada (número de tarjeta inválido).');
            return;
        }
        setLoading(true);
        await new Promise(res => setTimeout(res, 2500));
        try {
            const { data: { session } } = await supabase.auth.getSession();

            const { error } = await supabase.from('reservations')
                .update({ status: 'paid' }).eq('id', reservation.id);
            if (error) throw error;

            await supabase.from('payments').insert([{
                reservation_id: reservation.id,
                amount: reservation.total_price,
                payment_method: 'card',
                card_number_last_4: ccData.number.slice(-4),
                payment_status: 'completed',
                processed_by: session?.user?.email || 'cliente',
            }]);

            await logActivity('UPDATE', 'RESERVATION',
                `Cliente realizó pago con tarjeta para reserva #${reservation.id} por $${reservation.total_price} MXN`);

            onPaymentSuccess();

            setReceipt({
                paymentId: String(reservation.id).substring(0, 8).toUpperCase(),
                date: new Date().toISOString(),
                method: 'card',
                amount: reservation.total_price,
                client: reservation.contact_name,
                package: reservation.packages?.name || 'Venta General',
            });
        } catch (err) {
            alert('Error al procesar el pago: ' + (err.message || String(err)));
        } finally {
            setLoading(false);
        }
    };

    const handleCashRequest = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.from('reservations')
                .update({ status: 'awaiting_cash' }).eq('id', reservation.id);
            if (error) throw error;

            await logActivity('UPDATE', 'RESERVATION',
                `Cliente eligió pago en efectivo para reserva #${reservation.id}. Esperando confirmación del admin.`);

            onPaymentSuccess();
            setCashConfirmed(true);
        } catch (err) {
            alert('Error: ' + (err.message || String(err)));
        } finally {
            setLoading(false);
        }
    };

    // ---- VOUCHER VIEW ----
    if (receipt) {
        return <Voucher receipt={receipt} reservation={reservation} onClose={onClose} />;
    }

    // ---- CASH CONFIRMED VIEW ----
    if (cashConfirmed) {
        return (
            <div style={{ ...overlayStyle, justifyContent: 'center' }}>
                <div style={{ background: 'white', borderRadius: '16px', padding: '50px 40px', maxWidth: '500px', width: '100%', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⚓</div>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#2c2c2c', marginBottom: '15px' }}>¡Reserva Apartada!</h2>
                    <p style={{ color: '#777', lineHeight: '1.6', marginBottom: '10px' }}>
                        Tu reserva de <strong style={{ color: '#b59250' }}>${reservation.total_price} MXN</strong> ha sido apartada.
                    </p>
                    <p style={{ color: '#777', lineHeight: '1.6', marginBottom: '25px' }}>
                        Acude a la taquilla del Recinto Portuario y presenta este folio para completar tu pago en efectivo:
                    </p>
                    <div style={{ background: '#fff3cd', border: '2px dashed #b59250', borderRadius: '8px', padding: '15px 30px', fontFamily: 'monospace', fontSize: '1.8rem', fontWeight: 'bold', color: '#2c2c2c', letterSpacing: '2px', marginBottom: '30px' }}>
                        {String(reservation.id).substring(0, 8).toUpperCase()}
                    </div>
                    <button onClick={onClose} style={{ background: '#b59250', color: 'white', border: 'none', padding: '14px 30px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
                        Entendido
                    </button>
                </div>
            </div>
        );
    }

    // ---- METHOD PICKER ----
    if (!method) {
        return (
            <div style={{ ...overlayStyle, justifyContent: 'center' }}>
                <div style={{ background: 'white', borderRadius: '16px', padding: '40px', maxWidth: '550px', width: '100%', position: 'relative', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
                    <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '25px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' }}>✕</button>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", marginBottom: '5px', color: '#2c2c2c' }}>Realizar Pago</h2>
                    <p style={{ color: '#777', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '25px' }}>
                        Total: <strong style={{ color: '#b59250', fontSize: '1.2rem' }}>${reservation.total_price} MXN</strong> — {reservation.packages?.name}
                    </p>
                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                        <button onClick={() => setMethod('card')} style={{ flex: 1, padding: '25px', cursor: 'pointer', border: '2px solid #e0e0e0', borderRadius: '12px', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2c2c2c" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                            <div><strong style={{ color: '#2c2c2c', display: 'block', marginBottom: '4px' }}>Pagar con Tarjeta</strong><span style={{ color: '#888', fontSize: '0.8rem' }}>Pago inmediato</span></div>
                        </button>
                        <button onClick={() => setMethod('cash')} style={{ flex: 1, padding: '25px', cursor: 'pointer', border: '2px solid #b59250', borderRadius: '12px', background: 'rgba(181,146,80,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#b59250" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M6 12h.01M18 12h.01"></path></svg>
                            <div><strong style={{ color: '#b59250', display: 'block', marginBottom: '4px' }}>Pagar en Efectivo</strong><span style={{ color: '#888', fontSize: '0.8rem' }}>Acudes a taquilla</span></div>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ---- CASH SELECTION ----
    if (method === 'cash') {
        return (
            <div style={{ ...overlayStyle, justifyContent: 'center' }}>
                <div style={{ background: 'white', borderRadius: '16px', padding: '40px', maxWidth: '500px', width: '100%', position: 'relative', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', textAlign: 'center' }}>
                    <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '25px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' }}>✕</button>
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#b59250" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '20px' }}><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M6 12h.01M18 12h.01"></path></svg>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#2c2c2c', marginBottom: '15px' }}>Pago en Efectivo</h2>
                    <p style={{ color: '#555', lineHeight: '1.7', marginBottom: '30px' }}>
                        Al confirmar, tu reserva quedará <strong>apartada</strong>. Preséntate en la taquilla del Recinto Portuario para pagar <strong style={{ color: '#b59250' }}>${reservation.total_price} MXN</strong>. El administrador confirmará tu pago.
                    </p>
                    <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                        <button onClick={() => setMethod('')} style={{ flex: 1, padding: '14px', background: 'none', border: '1px solid #ccc', borderRadius: '8px', cursor: 'pointer', color: '#555', fontWeight: '600' }}>Volver</button>
                        <button onClick={handleCashRequest} disabled={loading} style={{ flex: 1, padding: '14px', background: '#b59250', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                            {loading ? 'Procesando...' : 'Apartar mi lugar'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ---- CARD PAYMENT FORM ----
    return (
        <div style={{ ...overlayStyle, justifyContent: 'center' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '40px', width: '850px', maxWidth: '95%', position: 'relative', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '25px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' }}>✕</button>
                <form onSubmit={handleCardPayment} style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
                    {/* Left: form */}
                    <div style={{ flex: '1 1 380px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <span style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem', color: '#b59250', fontWeight: 'bold' }}>Pago Seguro</span>
                            <h2 style={{ fontFamily: "'Playfair Display', serif", margin: '5px 0', color: '#2c2c2c', fontSize: '1.8rem' }}>Pagar con Tarjeta</h2>
                            <p style={{ color: '#777', fontSize: '0.9rem', margin: 0 }}>Total: <strong style={{ color: '#2c2c2c' }}>${reservation.total_price} MXN</strong></p>
                        </div>
                        {/* Visual card */}
                        <div style={{ background: '#002855', borderRadius: '12px', padding: '25px', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 8px 20px rgba(0,40,85,0.2)' }}>
                            <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', position: 'relative' }}>
                                <svg width="35" height="25" viewBox="0 0 40 30" fill="none"><rect width="40" height="30" rx="4" fill="#E2C17D" /><path d="M10 15h20v2H10z" fill="#002855" opacity="0.3" /></svg>
                                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#E2C17D' }}>Tarjeta</span>
                            </div>
                            <div style={{ fontSize: '1.3rem', letterSpacing: '3px', marginBottom: '20px', fontFamily: 'monospace', position: 'relative' }}>
                                {ccData.number ? ccData.number.replace(/(\d{4})(?=\d)/g, '$1 ') : '•••• •••• •••• ••••'}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', position: 'relative' }}>
                                <div><div style={{ opacity: 0.6, fontSize: '0.6rem', marginBottom: '3px' }}>Titular</div><div>{ccData.name || 'NOMBRE DEL TITULAR'}</div></div>
                                <div style={{ textAlign: 'right' }}><div style={{ opacity: 0.6, fontSize: '0.6rem', marginBottom: '3px' }}>Vence</div><div>{ccData.exp || 'MM/AA'}</div></div>
                            </div>
                        </div>
                        {/* Inputs */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: '#777', fontWeight: 'bold', marginBottom: '5px' }}>NÚMERO DE TARJETA</label>
                                <input required maxLength="16" type="text" pattern="\d{15,16}" value={ccData.number} onChange={e => setCcData({ ...ccData, number: e.target.value })} style={{ width: '100%', padding: '12px', border: 'none', borderBottom: '2px solid #eee', background: '#f9f9f9', outline: 'none', fontSize: '1rem', color: '#2c2c2c', boxSizing: 'border-box', borderRadius: '4px' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#777', fontWeight: 'bold', marginBottom: '5px' }}>VENCIMIENTO</label>
                                    <input required maxLength="5" placeholder="MM/AA" value={ccData.exp} onChange={e => setCcData({ ...ccData, exp: e.target.value })} style={{ width: '100%', padding: '12px', border: 'none', borderBottom: '2px solid #eee', background: '#f9f9f9', outline: 'none', fontSize: '1rem', color: '#2c2c2c', boxSizing: 'border-box', borderRadius: '4px' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#777', fontWeight: 'bold', marginBottom: '5px' }}>CVV</label>
                                    <input required maxLength="4" type="password" value={ccData.cvv} onChange={e => setCcData({ ...ccData, cvv: e.target.value })} style={{ width: '100%', padding: '12px', border: 'none', borderBottom: '2px solid #eee', background: '#f9f9f9', outline: 'none', fontSize: '1rem', color: '#2c2c2c', boxSizing: 'border-box', borderRadius: '4px' }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: '#777', fontWeight: 'bold', marginBottom: '5px' }}>TITULAR DE LA TARJETA</label>
                                <input required value={ccData.name} onChange={e => setCcData({ ...ccData, name: e.target.value })} style={{ width: '100%', padding: '12px', border: 'none', borderBottom: '2px solid #eee', background: '#f9f9f9', outline: 'none', fontSize: '1rem', color: '#2c2c2c', boxSizing: 'border-box', borderRadius: '4px' }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button type="button" onClick={() => setMethod('')} style={{ flex: 1, padding: '14px', background: 'none', border: '1px solid #ccc', borderRadius: '8px', cursor: 'pointer', color: '#555', fontWeight: '600' }}>Volver</button>
                            <button type="submit" disabled={loading} style={{ flex: 2, padding: '14px', background: '#b59250', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 4px 10px rgba(181,146,80,0.3)' }}>
                                {loading ? 'Procesando...' : `Pagar $${reservation.total_price} MXN`}
                            </button>
                        </div>
                    </div>
                    {/* Right: summary */}
                    <div style={{ flex: '1 1 240px', background: '#f9f9f9', borderRadius: '12px', padding: '25px', border: '1px solid #eee' }}>
                        <h3 style={{ color: '#2c2c2c', fontFamily: "'Playfair Display', serif", margin: '0 0 20px', fontSize: '1.2rem' }}>Tu reserva</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '25px' }}>
                            {[['Paquete', reservation.packages?.name], ['Fecha', reservation.reservation_date], ['Personas', reservation.persons_count]].map(([lbl, val]) => (
                                <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                    <span style={{ color: '#888' }}>{lbl}</span>
                                    <span style={{ fontWeight: '600', color: '#2c2c2c', textAlign: 'right', maxWidth: '60%' }}>{val}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ background: 'white', borderRadius: '8px', padding: '20px', border: '1px solid #eee', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '8px' }}>Total a pagar</div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#b59250' }}>${reservation.total_price}</div>
                            <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '4px' }}>MXN</div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClientPaymentModal;
