import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import ClientPaymentModal from '../components/ClientPaymentModal';
import './ClientDashboard.css';

const STATUS_CONFIG = {
    pending:       { label: '⏳ En Revisión',                  bg: '#fff3cd', color: '#856404' },
    confirmed:     { label: '✅ Aceptada — Pendiente de Pago', bg: '#d4edda', color: '#155724' },
    awaiting_cash: { label: '💵 Esperando Pago en Efectivo',   bg: '#fff3e0', color: '#e65100' },
    paid:          { label: '💳 Pagada',                       bg: '#cce5ff', color: '#004085' },
    in_progress:   { label: '🚢 En Curso',                     bg: '#d1ecf1', color: '#0c5460' },
    completed:     { label: '✅ Viaje Realizado',              bg: '#d4edda', color: '#155724' },
    cancelled:     { label: '❌ Rechazada',                    bg: '#f8d7da', color: '#721c24' },
};

const ClientDashboard = () => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [payingReservation, setPayingReservation] = useState(null);
    const [viewReceiptData, setViewReceiptData] = useState(null);

    const fetchMyReservations = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const { data, error } = await supabase
                .from('reservations')
                .select('*, packages(name)')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });
            if (!error && data) setReservations(data);
        }
        setLoading(false);
    };

    useEffect(() => { fetchMyReservations(); }, []);

    const handleViewReceipt = async (r) => {
        const { data: payment } = await supabase
            .from('payments')
            .select('*')
            .eq('reservation_id', r.id)
            .order('payment_date', { ascending: false })
            .limit(1)
            .maybeSingle();

        setViewReceiptData({
            reservation: r,
            receipt: {
                paymentId: String(r.id).substring(0, 8).toUpperCase(),
                date: payment?.payment_date || r.created_at || new Date().toISOString(),
                method: payment?.payment_method || 'card',
                amount: r.total_price,
                client: r.contact_name,
                package: r.packages?.name || 'Venta General',
            },
        });
    };

    return (
        <div className="client-dashboard container">
            <div style={{ marginBottom: '20px' }}>
                <Link to="/" style={{ display: 'inline-block', padding: '10px 15px', backgroundColor: '#333', color: '#fff', textDecoration: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
                    ⬅ Volver al Barco
                </Link>
            </div>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem' }}>🔔 Mis Notificaciones</h2>
            <p style={{ color: 'var(--text-light)', marginBottom: '30px' }}>Aquí verás el estado de tus reservaciones y podrás realizar tu pago cuando el Capitán las apruebe.</p>

            {loading ? <p>Cargando historial...</p> : (
                <div className="reservations-list">
                    {reservations.length === 0 ? (
                        <div className="empty-state" style={{ padding: '50px 20px', textAlign: 'center', background: 'var(--white)' }}>
                            No tienes reservaciones aún. ¡Sube al barco y haz tu primera reserva!
                        </div>
                    ) : (
                        reservations.map(r => {
                            const cfg = STATUS_CONFIG[r.status] || { label: r.status, bg: '#eee', color: '#333' };
                            return (
                                <div key={r.id} className={`res-card status-${r.status}`}>
                                    <div className="res-header">
                                        <h3>Paseo: {r.packages?.name}</h3>
                                        <span style={{ display: 'inline-block', padding: '6px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.8rem', backgroundColor: cfg.bg, color: cfg.color }}>
                                            {cfg.label}
                                        </span>
                                    </div>
                                    <div className="res-body">
                                        <p><strong>Fecha Planificada:</strong> {r.reservation_date}</p>
                                        <p><strong>Personas:</strong> {r.persons_count}</p>
                                        <p><strong>Total:</strong> ${r.total_price} MXN</p>

                                        {/* Rechazada */}
                                        {r.status === 'cancelled' && (
                                            <div className="notification-alert">
                                                {r.cancellation_reason
                                                    ? <><strong>⚠️ Motivo:</strong> {r.cancellation_reason}</>
                                                    : 'Tu reservación no fue aprobada por el administrador.'}
                                            </div>
                                        )}

                                        {/* Aceptada — invita a pagar */}
                                        {r.status === 'confirmed' && (
                                            <div className="notification-alert success">
                                                <strong>✅ ¡Aceptada!</strong> El Capitán aprobó tu solicitud. Procede con el pago para garantizar tu lugar:
                                                <br /><br />
                                                <button
                                                    onClick={() => setPayingReservation(r)}
                                                    style={{ background: '#b59250', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem' }}
                                                >
                                                    💳 Pagar Ahora
                                                </button>
                                            </div>
                                        )}

                                        {/* Esperando efectivo */}
                                        {r.status === 'awaiting_cash' && (
                                            <div className="notification-alert" style={{ background: '#fff3e0', borderColor: '#e65100' }}>
                                                <strong>💵 Pago en efectivo pendiente:</strong> Acude a la taquilla del Recinto Portuario con <strong>${r.total_price} MXN</strong>. Presenta este folio:
                                                <br />
                                                <span style={{ display: 'inline-block', marginTop: '10px', padding: '8px 20px', background: '#fff3cd', border: '2px dashed #b59250', fontFamily: 'monospace', color: '#333', fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '2px', borderRadius: '4px' }}>
                                                    {String(r.id).substring(0, 8).toUpperCase()}
                                                </span>
                                            </div>
                                        )}

                                        {/* Pagada */}
                                        {r.status === 'paid' && (
                                            <div className="notification-alert success" style={{ backgroundColor: '#f0f8ff', borderColor: '#b8daff' }}>
                                                <strong>💳 ¡Pago Liquidado!</strong> Tu reserva está garantizada. Pase de abordar:
                                                <br />
                                                <span style={{ display: 'inline-block', marginTop: '10px', padding: '8px 20px', background: '#fff3cd', border: '2px dashed #b59250', fontFamily: 'monospace', color: '#333', fontSize: '1.6rem', fontWeight: 'bold', letterSpacing: '2px', borderRadius: '4px' }}>
                                                    {String(r.id).split('-')[0].toUpperCase()}
                                                </span>
                                                <br /><br />
                                                <button
                                                    onClick={() => handleViewReceipt(r)}
                                                    style={{ background: 'white', color: '#2c2c2c', border: '1px solid #ccc', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}
                                                >
                                                    📄 Ver Comprobante
                                                </button>
                                            </div>
                                        )}

                                        {/* En curso */}
                                        {r.status === 'in_progress' && (
                                            <div className="notification-alert success" style={{ background: '#e3f2fd', borderColor: '#90caf9' }}>
                                                <strong>🚢 ¡Tu viaje está en curso!</strong> Que disfrutes la travesía.
                                                <br /><br />
                                                <button
                                                    onClick={() => handleViewReceipt(r)}
                                                    style={{ background: 'white', color: '#2c2c2c', border: '1px solid #ccc', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}
                                                >
                                                    📄 Ver Comprobante
                                                </button>
                                            </div>
                                        )}

                                        {/* Completado */}
                                        {r.status === 'completed' && (
                                            <div className="notification-alert success">
                                                <strong>✅ Viaje completado.</strong> ¡Gracias por navegar con Barco Pirata! Esperamos verte de nuevo.
                                                <br /><br />
                                                <button
                                                    onClick={() => handleViewReceipt(r)}
                                                    style={{ background: 'white', color: '#2c2c2c', border: '1px solid #ccc', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}
                                                >
                                                    📄 Ver Comprobante
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Modal de pago para el cliente */}
            {payingReservation && (
                <ClientPaymentModal
                    reservation={payingReservation}
                    onClose={() => setPayingReservation(null)}
                    onPaymentSuccess={fetchMyReservations}
                />
            )}

            {/* Modal para ver comprobante */}
            {viewReceiptData && (
                <ClientPaymentModal
                    reservation={viewReceiptData.reservation}
                    onClose={() => setViewReceiptData(null)}
                    onPaymentSuccess={() => {}}
                    initialReceipt={viewReceiptData.receipt}
                />
            )}
        </div>
    );
};

export default ClientDashboard;
