import React, { useState, useEffect } from 'react';
import logoBP from '../assets/logobp.png';
import BookingBar from './BookingBar';
import './Hero.css';

const SLIDES = [
    '/hero-1-atardecer.jpg',   // barco pirata al atardecer, luz dorada
    '/hero-2-barco-dia.jpg',   // El Rey del Mar real, foto TripAdvisor
    '/hero-3-cubierta.jpg',    // barco en silueta al atardecer
    '/hero-4-personajes.jpg',  // El Rey del Mar, puesta de sol en Mar de Cortés
    '/hero-5-noche.jpg',       // noche con luces encendidas
];

const Hero = ({ onReserveNow }) => {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent(prev => (prev + 1) % SLIDES.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section className="hero" id="home">
            {SLIDES.map((src, i) => (
                <div
                    key={i}
                    className={`hero-bg-slide${i === current ? ' active' : ''}`}
                    style={{ backgroundImage: `url('${src}')` }}
                />
            ))}
            <div className="hero-overlay" />
            <div className="hero-content">
                <img src={logoBP} alt="Barco Pirata" className="hero-logo" />
                <p className="hero-sub">Vive la aventura en el Recinto Portuario</p>
                <span className="hero-location">⚓ Puerto Peñasco, Sonora</span>
            </div>
            <div className="hero-dots">
                {SLIDES.map((_, i) => (
                    <button
                        key={i}
                        className={`hero-dot${i === current ? ' active' : ''}`}
                        onClick={() => setCurrent(i)}
                        aria-label={`Imagen ${i + 1}`}
                    />
                ))}
            </div>
            <BookingBar onReserveNow={onReserveNow} />
        </section>
    );
};

export default Hero;
