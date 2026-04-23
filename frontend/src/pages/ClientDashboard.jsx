import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './ClientDashboard.css';

const ClientDashboard = () => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchMyData() {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data, error } = await supabase
                    .from('reservations')
                    .select('*, packages(name)')
                    .eq('user_id', session.user.id)
                    .order('created_at', { ascending: false });

                if (!error && data) {
                    setReservations(data);
                }
            }
            setLoading(false);
        }
        fetchMyData();
    }, []);

    return (
        <div className="client-dashboard container">
            <div style={{ marginBottom: '20px' }}>
                <Link to="/" style={{ display: 'inline-block', padding: '10px 15px', backgroundColor: '#333', color: '#fff', textDecoration: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
                    ⬅ Volver al Barco
                </Link>
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem' }}>🔔 Mis Notificaciones</h2>
            <p style={{ color: 'var(--text-light)' }}>Aquí recibirás las alertas en tiempo real cuando el Capitán acepte o rechace tus reservaciones.</p>

            {loading ? <p>Cargando historial...</p> : (
                <div className="reservations-list">
                    {reservations.length === 0 ? (
                        <div className="empty-state" style={{ padding: '50px 20px', textAlign: 'center', background: 'var(--white)' }}>No tienes reservaciones aún. ¡Sube al barco y haz tu primera reserva!</div>
                    ) : (
                        reservations.map(r => (
                            <div key={r.id} className={`res-card status-${r.status}`}>
                                <div className="res-header">
                                    <h3>Paseo: {r.packages?.name}</h3>
                                    <span className={`badge ${r.status}`} style={{ backgroundColor: r.status === 'paid' ? '#cce5ff' : undefined, color: r.status === 'paid' ? '#004085' : undefined }}>{r.status === 'pending' ? '⏳ En Revisión' : r.status === 'confirmed' ? '✅ Aceptada' : r.status === 'paid' ? '💳 Liquidada' : '❌ Rechazada'}</span>
                                </div>
                                <div className="res-body">
                                    <p><strong>Fecha Planificada:</strong> {r.reservation_date}</p>
                                    <p><strong>Personas:</strong> {r.persons_count}</p>
                                    <p><strong>Total:</strong> ${r.total_price}</p>

                                    {/* Este es el motor de notificaciones de rechazo que solicitaste */}
                                    {r.status === 'cancelled' && r.cancellation_reason && (
                                        <div className="notification-alert">
                                            <strong>⚠️ Motivo del Administrador:</strong> {r.cancellation_reason}
                                        </div>
                                    )}
                                    {r.status === 'confirmed' && (
                                        <div className="notification-alert success" style={{ fontSize: '1.1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                                            <strong>✅ Aceptado:</strong> Tu solicitud fue pre-aprobada, falta proceder con el pago. Visita la taquilla para completar.
                                        </div>
                                    )}
                                    {r.status === 'paid' && (
                                        <div className="notification-alert success" style={{ fontSize: '1.2rem', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', backgroundColor: '#f0f8ff', borderColor: '#b8daff' }}>
                                            <strong>💳 ¡Pago Liquidado!</strong> Hemos recibido tu dinero con éxito y tu reserva está garantizada. Tu número de Pase de Abordar oficial es:<br />
                                            <span style={{ display: 'inline-block', marginTop: '10px', padding: '8px 20px', background: '#fff3cd', border: '2px dashed #b59250', fontFamily: 'monospace', color: '#333', fontSize: '1.6rem', fontWeight: 'bold', letterSpacing: '2px' }}>
                                                {r.id.split('-')[0].toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
export default ClientDashboard;
