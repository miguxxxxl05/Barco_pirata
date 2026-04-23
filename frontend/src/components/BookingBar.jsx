import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale/es';
import 'react-datepicker/dist/react-datepicker.css';
import './BookingBar.css';

registerLocale('es', es);

const BookingBar = ({ onReserveNow }) => {
    const [selectedDate, setSelectedDate] = useState(null);
    const [persons, setPersons] = useState(1);
    const [globalCapacity, setGlobalCapacity] = useState(50);
    const [dateCapacity, setDateCapacity] = useState({});

    useEffect(() => {
        async function fetchCapacityData() {
            const { data: settings } = await supabase.from('global_settings').select('boat_capacity').eq('id', 1).single();
            if (settings) setGlobalCapacity(settings.boat_capacity);

            const { data: reservations } = await supabase.from('reservations').select('reservation_date, persons_count').neq('status', 'cancelled').neq('status', 'pending');
            if (reservations) {
                const usage = {};
                reservations.forEach(r => {
                    usage[r.reservation_date] = (usage[r.reservation_date] || 0) + parseInt(r.persons_count, 10);
                });
                setDateCapacity(usage);
            }
        }
        fetchCapacityData();
    }, []);

    const isDateFull = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        return (dateCapacity[dateStr] || 0) + persons > globalCapacity;
    };

    const increment = () => setPersons(prev => prev + 1);
    const decrement = () => setPersons(prev => (prev > 1 ? prev - 1 : 1));

    return (
        <div className="booking-bar">
            <div className="booking-fields">
                <div className="booking-field">
                    <label>FECHA DEL PASEO</label>
                    <DatePicker
                        selected={selectedDate}
                        onChange={(date) => setSelectedDate(date)}
                        locale="es"
                        dateFormat="dd 'de' MMMM, yyyy"
                        placeholderText="Seleccionar fecha"
                        className="custom-datepicker"
                        minDate={new Date()}
                        filterDate={(date) => !isDateFull(date)}
                        dayClassName={(date) => isDateFull(date) ? 'full-day-red' : undefined}
                    />
                    <div className="sold-out-legend">Días en ROJO = Sin lugares suficientes.</div>
                </div>
                <div className="booking-field">
                    <label>PERSONAS {persons >= 5 ? '(10% DESC)' : ''}</label>
                    <div className="counter">
                        <button className="counter-btn" onClick={decrement}>-</button>
                        <input
                            type="number"
                            value={persons}
                            onChange={(e) => setPersons(Math.max(1, parseInt(e.target.value) || 1))}
                            className="counter-input"
                        />
                        <button className="counter-btn" onClick={increment}>+</button>
                    </div>
                </div>
            </div>
            <button
                className="btn-primary booking-btn"
                onClick={() => onReserveNow(selectedDate, persons)}
            >
                RESERVAR AHORA
            </button>
        </div>
    );
};

export default BookingBar;
