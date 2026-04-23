import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import './ReservationModal.css';

const ReservationModal = ({ isOpen, onClose, initialDate, initialPersons, initialPackageId, packages }) => {
    if (!isOpen) return null;

    const [date, setDate] = useState(initialDate || '');
    const [persons, setPersons] = useState(initialPersons || 1);
    const [packageId, setPackageId] = useState(initialPackageId || '');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const selectedPackage = packages?.find(p => p.id === parseInt(packageId));

    const calculateTotal = () => {
        if (!selectedPackage) return 0;
        let total = selectedPackage.price * persons;
        if (persons >= 5) total = total * 0.90; // Descuento en grupo
        return total;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Pequeña validación
        if (!packageId || !date) {
            setError("Por favor completa el paquete y la fecha.");
            setLoading(false);
            return;
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id || null;

            const { error } = await supabase.from('reservations').insert([
                {
                    user_id: userId,
                    package_id: packageId,
                    reservation_date: date,
                    persons_count: persons,
                    contact_name: name,
                    contact_phone: phone,
                    total_price: calculateTotal(),
                    status: 'pending'
                }
            ]);

            if (error) throw error;
            setSuccess(true);
        } catch (err) {
            console.error("Error capturado:", err);
            setError("Fallo en la base de datos: " + (err.message || 'Verifica tu conexión.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-btn" onClick={onClose}>X</button>
                {success ? (
                    <div className="success-message">
                        <h2>¡Reservación Solicitada! 🚢</h2>
                        <p>Hemos guardado tu intención de reserva con éxito. Un administrador la validará a la brevedad y nos contactaremos al {phone} para procesar el pago.</p>
                        <button className="btn-primary" onClick={onClose}>Aceptar y Cerrar</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="reservation-form">
                        <h2>Completar Reservación</h2>
                        {error && <p className="error-alert">{error}</p>}

                        <div className="form-group">
                            <label>Paquete de Paseo</label>
                            <select value={packageId} onChange={(e) => setPackageId(e.target.value)} required>
                                <option value="">Selecciona un tipo de paquete</option>
                                {packages?.map(pkg => (
                                    <option key={pkg.id} value={pkg.id}>{pkg.name} - ${pkg.price} c/u</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Fecha de Abordaje</label>
                                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Cant. de Personas</label>
                                <input type="number" min="1" value={persons} onChange={(e) => setPersons(e.target.value)} required />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Nombre del Contacto</label>
                            <input type="text" placeholder="Ej. Juan Pérez" value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>

                        <div className="form-group">
                            <label>Número de Celular</label>
                            <input type="tel" placeholder="Ej. 638 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                        </div>

                        <div className="total-box">
                            <p>Total a pagar en taquilla:</p>
                            <h3>${calculateTotal().toFixed(2)} MXN</h3>
                            {persons >= 5 && <span className="discount-badge">¡10% de descuento grupal aplicado!</span>}
                        </div>

                        <button type="submit" className="btn-primary submit-btn" disabled={loading}>
                            {loading ? 'Procesando en BD...' : 'Confirmar Datos y Enviar'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ReservationModal;
