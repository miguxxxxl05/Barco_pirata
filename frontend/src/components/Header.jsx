import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Header.css';

const Header = ({ session, userRole }) => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
        } finally {
            window.location.href = '/'; // Forzar recarga absoluta del navegador para borrar caché
        }
    };

    return (
        <header className="header">
            <div className="header-top">
                <div className="container header-top-content">
                    <div className="contact-info">
                        <span><i className="phone-icon">📞</i> 638-123-4567</span>
                        <span><i className="email-icon">✉️</i> reservas@barcopirata.com</span>
                    </div>
                    <div className="user-actions">
                        <span>ES </span> | <span> MXN </span> |
                        {session ? (
                            <>
                                {userRole === 'admin' ? (
                                    <Link to="/admin" style={{ color: '#b59250', fontWeight: 'bold', marginLeft: '5px', marginRight: '5px' }}>Panel Admin</Link>
                                ) : (
                                    <Link to="/profile" style={{ color: 'inherit', marginLeft: '5px', marginRight: '5px' }}>🔔 Mis Notificaciones</Link>
                                )}
                                | <span className="login" onClick={handleLogout} style={{ cursor: 'pointer', marginLeft: '5px' }}> Salir</span>
                                <br /><span style={{ color: '#ff4444', fontSize: '12px' }}>DEBUG DB: {userRole ? `"${userRole}"` : 'null'}</span>
                            </>
                        ) : (
                            <Link to="/login" style={{ color: 'inherit', marginLeft: '5px' }}> Login</Link>
                        )}
                    </div>
                </div>
            </div>
            <div className="header-main">
                <div className="container header-main-content">
                    <div className="logo">
                        <Link to="/"><h2>BARCO PIRATA</h2></Link>
                    </div>
                    <nav className="nav-menu">
                        <ul>
                            <li><Link to="/">Inicio</Link></li>
                            <li><a href="/#packages">Paquetes</a></li>
                            <li><a href="/#reservation">Reservaciones</a></li>
                            <li><a href="#contact">Contacto</a></li>
                        </ul>
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Header;
