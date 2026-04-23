import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Registra al usuario y le manda el nombre completo como metadato al Trigger
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                }
            }
        });

        if (error) {
            setError(error.message);
        } else {
            // El login automático o requerir verificación de mail depende de tu config de Supabase
            navigate('/');
        }
        setLoading(false);
    };

    return (
        <div className="auth-page">
            <div className="auth-box">
                <h2>Crear Cuenta</h2>
                <p className="auth-subtitle">Sube a bordo como Cliente</p>

                {error && <p className="error-alert">{error}</p>}

                <form onSubmit={handleRegister}>
                    <div className="form-group">
                        <label>Nombre Completo</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Correo Electrónico</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Contraseña</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn-primary auth-btn" disabled={loading}>
                        {loading ? 'Registrando...' : 'Registrarse Ahora'}
                    </button>
                </form>
                <p className="auth-switch">¿Ya tienes cuenta? <Link to="/login">Inicia Sesión</Link></p>
            </div>
        </div>
    );
};

export default Register;
