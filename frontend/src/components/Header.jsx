import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Header.css';

const Header = ({ session, userRole }) => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try { await supabase.auth.signOut(); }
        finally { window.location.href = '/'; }
    };

    return (
        <header className="header">
            {/* Barra superior */}
            <div className="header-top">
                <div className="container header-top-content">
                    <div className="contact-info">
                        <span>📞 638-123-4567</span>
                        <span>✉️ reservas@barcopirata.com</span>
                        <span>📍 Recinto Portuario, Puerto Peñasco</span>
                    </div>
                    <div className="user-actions">
                        {session ? (
                            <>
                                {userRole === 'admin' ? (
                                    <Link to="/admin" className="ua-badge ua-badge-admin">⚙️ Panel Admin</Link>
                                ) : (
                                    <Link to="/profile" className="ua-badge">🔔 Mis Reservaciones</Link>
                                )}
                                <span className="ua-divider">|</span>
                                <button className="ua-btn" onClick={handleLogout}>Cerrar sesión</button>
                            </>
                        ) : (
                            <Link to="/login" className="ua-badge">Iniciar sesión</Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Logo y navegación */}
            <div className="header-main">
                <div className="container header-main-content">
                    <div className="logo">
                        <Link to="/" className="logo-wrap">
                            <div className="logo-text">
                                <span className="logo-title">BARCO PIRATA</span>
                            </div>
                        </Link>
                    </div>
                    <nav className="nav-menu">
                        <ul>
                            <li><Link to="/">Inicio</Link></li>
                            <li><a href="/#packages">Paquetes</a></li>
                            <li><a href="/#reservation">Reservar</a></li>
                            <li><a href="#contact">Contacto</a></li>
                        </ul>
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Header;
