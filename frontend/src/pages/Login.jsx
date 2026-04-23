import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            setError(error.message);
        } else {
            navigate('/'); // Volver a la página principal con la sesión activada
        }
        setLoading(false);
    };

    return (
        <div className="auth-page">
            <div className="auth-box">
                <h2>Iniciar Sesión</h2>
                <p className="auth-subtitle">Accede a tu cuenta en el Barco Pirata</p>

                {error && <p className="error-alert">{error}</p>}

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>Correo Electrónico</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Contraseña</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn-primary auth-btn" disabled={loading}>
                        {loading ? 'Ingresando...' : 'Entrar'}
                    </button>
                </form>
                <p className="auth-switch">¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link></p>
            </div>
        </div>
    );
};

export default Login;
