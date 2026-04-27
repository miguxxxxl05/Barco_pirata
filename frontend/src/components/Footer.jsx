import React from 'react';
import { FaFacebook } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer" id="contact">
            <div className="container footer-content">
                <div className="footer-col about">
                    <h3>BARCO PIRATA</h3>
                    <p>La mejor experiencia navegando por Puerto Peñasco. Música, ambiente, shows en vivo y bebidas refrescantes.</p>
                </div>
                <div className="footer-col links">
                    <h4>Servicios</h4>
                    <ul>
                        <li><a href="#packages">Paquete con Comida</a></li>
                        <li><a href="#packages">Paquete Solo Bebidas</a></li>
                        <li><a href="#packages">Paquete Solo Paseo</a></li>
                    </ul>
                </div>
                <div className="footer-col links">
                    <h4>Enlaces Rápidos</h4>
                    <ul>
                        <li><a href="#home">Inicio</a></li>
                        <li><a href="#offers">Reglamento</a></li>
                        <li><a href="#contact">Contacto</a></li>
                    </ul>
                </div>
                <div className="footer-col address">
                    <h4>Dirección</h4>
                    <p>📍 Recinto Portuario,<br />Puerto Peñasco, Sonora, MX</p>
                    <p>📞 638-123-4567</p>
                    <p>✉️ reservas@barcopirata.com</p>
                </div>
            </div>
            <div className="footer-bottom">
                <div className="container">
                    <p>&copy; 2026 Barco Pirata de Puerto Peñasco. Todos los derechos reservados.</p>
                    <div className="social-links">
                        <a href="https://www.facebook.com/PerlaNegraPenasco/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                            <FaFacebook />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
