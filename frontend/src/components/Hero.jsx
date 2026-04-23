import React from 'react';
import BookingBar from './BookingBar';
import './Hero.css';

const Hero = ({ onReserveNow }) => {
    return (
        <section className="hero" id="home">
            <div className="hero-overlay"></div>
            <div className="hero-content">
                <h1>Nuestros Paseos</h1>
                <p>Vive la experiencia en el Recinto Portuario</p>
            </div>
            <BookingBar onReserveNow={onReserveNow} />
        </section>
    );
};

export default Hero;
