import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import PaymentModal from '../components/PaymentModal';
import DailyReportModal from '../components/DailyReportModal';
import AnnualReportModal from '../components/AnnualReportModal';
import ActivityLogModal from '../components/ActivityLogModal';
import { logActivity } from '../utils/logger';

const AdminDashboard = () => {
    const [reservations, setReservations] = useState([]);
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);

    const [newPackage, setNewPackage] = useState({ name: '', price: '', description: '', ideal_for: '' });
    const [globalBoatCapacity, setGlobalBoatCapacity] = useState(50);
    const [tempCapacity, setTempCapacity] = useState(50);

    const handleSaveGlobalCapacity = async () => {
        try {
            const { error } = await supabase.from('global_settings').upsert({ id: 1, boat_capacity: tempCapacity });
            if (error) throw error;
            setGlobalBoatCapacity(tempCapacity);
            await logActivity('UPDATE', 'SYSTEM', `Modificó el límite global del barco a ${tempCapacity} pasajeros.`);
            alert("¡Límite del barco guardado exitosamente!");
        } catch (err) {
            alert("Error al guardar: " + err.message + "\n\n(Importante: Recuerda ejecutar el comando SQL de la tabla 'global_settings' en Supabase para que comience a funcionar).");
        }
    };
    const [imageFile, setImageFile] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [editingPkg, setEditingPkg] = useState(null);
    const [activePaymentReservation, setActivePaymentReservation] = useState(null);
    const [reportModalDate, setReportModalDate] = useState(null);
    const [showAnnualReport, setShowAnnualReport] = useState(false);
    const [showActivityLog, setShowActivityLog] = useState(false);

    // Filtros
    const [filterDate, setFilterDate] = useState('');
    const [filterPackage, setFilterPackage] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // Warnings de Capacidad
    const dateCapacity = {};
    reservations.forEach(r => {
        if (r.status !== 'cancelled' && r.status !== 'pending') {
            dateCapacity[r.reservation_date] = (dateCapacity[r.reservation_date] || 0) + parseInt(r.persons_count, 10);
        }
    });

    const warnings = [];
    Object.entries(dateCapacity).forEach(([date, used]) => {
        if (used >= globalBoatCapacity) {
            warnings.push(`¡El Barco está LLENO para el día ${date}! (${used}/${globalBoatCapacity} pasajeros en total)`);
        }
    });

    const pendingReservations = reservations.filter(r => r.status === 'pending');

    const filteredReservations = reservations.filter(r => {
        if (filterDate && r.reservation_date !== filterDate) return false;
        if (filterPackage && r.package_id?.toString() !== filterPackage) return false;
        if (filterStatus && r.status !== filterStatus) return false;
        return true;
    });

    const handlePaymentSuccess = () => {
        // Si se realizó el pago con éxito, volvemos a descargar todo
        const reloadReservations = async () => {
            const { data: resData } = await supabase.from('reservations').select('*, packages(name)').order('created_at', { ascending: false });
            if (resData) setReservations(resData);
        }
        reloadReservations();
    };

    useEffect(() => {
        async function fetchData() {
            // 0. Obtiene configuración global
            const { data: gSetting } = await supabase.from('global_settings').select('boat_capacity').eq('id', 1).single();
            if (gSetting) {
                setGlobalBoatCapacity(gSetting.boat_capacity);
                setTempCapacity(gSetting.boat_capacity);
            }

            // 1. Obtiene las reservas
            const { data: resData } = await supabase.from('reservations').select('*, packages(name)').order('created_at', { ascending: false });
            if (resData) setReservations(resData);

            // 2. Obtiene los paquetes (Para poder listarlos y administrarlos)
            const { data: pkgData } = await supabase.from('packages').select('*').order('id', { ascending: true });
            if (pkgData) setPackages(pkgData);

            setLoading(false);
        }
        fetchData();
    }, []);

    const handleStatusChange = async (id, newStatus) => {
        if (newStatus === 'confirmed') {
            const reservation = reservations.find(r => r.id === id);
            const date = reservation.reservation_date;
            const currentCapacity = reservations
                .filter(r => r.reservation_date === date && r.status !== 'cancelled' && r.status !== 'pending' && r.id !== id)
                .reduce((sum, r) => sum + parseInt(r.persons_count, 10), 0);

            if (currentCapacity + parseInt(reservation.persons_count, 10) > globalBoatCapacity) {
                alert(`⚠️ ¡Imposible Aceptar! Esta reservación de ${reservation.persons_count} personas sobrepasaría la capacidad máxima del barco (${globalBoatCapacity}) para el día ${date}.`);
                return;
            }
        }

        let reason = null;
        if (newStatus === 'cancelled') {
            reason = window.prompt("Escribe el motivo del rechazo para notificar al cliente:");
            if (reason === null) return;
        }

        try {
            // Lógica de actualización en bloque para viajes
            if (newStatus === 'in_progress' || newStatus === 'completed') {
                const targetRes = reservations.find(r => r.id === id);
                if (targetRes) {
                    const confirmMsg = newStatus === 'in_progress'
                        ? `¿Deseas iniciar el viaje para TODOS los pasajeros pagados del día ${targetRes.reservation_date} automáticamente?`
                        : `¿Deseas marcar como completado el viaje de TODOS los pasajeros del día ${targetRes.reservation_date} automáticamente?`;

                    if (window.confirm(confirmMsg)) {
                        const previousStatus = newStatus === 'in_progress' ? 'paid' : 'in_progress';
                        const { error } = await supabase.from('reservations')
                            .update({ status: newStatus })
                            .eq('reservation_date', targetRes.reservation_date)
                            .eq('status', previousStatus);

                        if (error) throw error;

                        await logActivity('UPDATE', 'RESERVATION', newStatus === 'in_progress' ? `Inició abordaje masivo de pasajeros (Día ${targetRes.reservation_date})` : `Finalizó viaje masivo de pasajeros (Día ${targetRes.reservation_date})`);

                        const { data: resData } = await supabase.from('reservations').select('*, packages(name)').order('created_at', { ascending: false });
                        if (resData) setReservations(resData);
                        return;
                    }
                }
            }

            const { error } = await supabase.from('reservations').update({ status: newStatus, cancellation_reason: reason }).eq('id', id);
            if (error) throw error;

            await logActivity('UPDATE', 'RESERVATION', `Actualizó reserva #${id} al estatus: ${newStatus}`);
            setReservations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus, cancellation_reason: reason } : r));
        } catch (err) {
            alert("Error al actualizar estado: " + err.message);
        }
    };

    // ----- LOGICA PARA SUBIR IMAGEN AL STORAGE -----
    const handleFileUpload = async (file) => {
        if (!file) return null;
        const fileExt = file.name.split('.').pop();
        // Crea un nombre único para que no choque con otras imágenes
        const fileName = `${Date.now()}_img.${fileExt}`;
        // Sube al bucket 'paquetes'
        const { data, error } = await supabase.storage.from('paquetes').upload(fileName, file);
        if (error) throw error;
        // Extrae la URL de internet (pública) para mostrarla en el React
        const { data: publicData } = supabase.storage.from('paquetes').getPublicUrl(fileName);
        return publicData.publicUrl;
    };

    // ----- CREAR NUVEO PAQUETE -----
    const handleCreatePackage = async (e) => {
        e.preventDefault();
        if (!newPackage.name || !newPackage.price) return;
        setIsCreating(true);

        try {
            let imageUrl = null;
            if (imageFile) {
                imageUrl = await handleFileUpload(imageFile);
            }

            const { data, error } = await supabase.from('packages').insert([{
                ...newPackage,
                image_url: imageUrl
            }]).select();

            if (error) throw error;

            await logActivity('CREATE', 'PACKAGE', `Creó un nuevo paquete comercial: ${newPackage.name}`);
            alert("¡Paseo creado con éxito y foto subida a tu nube!");
            if (data && data.length > 0 && data[0]) {
                setPackages(prev => [...prev, data[0]]);
            } else {
                // Refetch preventivo por si Supabase oculta el ID del insert
                const { data: recData } = await supabase.from('packages').select('*').order('id', { ascending: true });
                if (recData) setPackages(recData);
            }
            setNewPackage({ name: '', price: '', description: '', ideal_for: '' });
            setImageFile(null);

            // Limpia visualmente el texto "archivo_elegido.jpg" del navegador
            let fileInput = document.getElementById('photo-uploader');
            if (fileInput) fileInput.value = '';

        } catch (err) {
            alert("Error técnico al crear paquete: " + (err.message || 'Intente de nuevo'));
        } finally {
            setIsCreating(false);
        }
    };

    // ----- EDITAR Y ELIMINAR PAQUETES EXISTENTES -----
    const handleDeletePackage = async (id) => {
        if (!window.confirm("¿Seguro que deseas ELIMINAR este paquete del catálogo para siempre?")) return;
        try {
            const { error } = await supabase.from('packages').delete().eq('id', id);
            if (error) throw error;
            await logActivity('DELETE', 'PACKAGE', `Eliminó el paquete (ID ${id}) del catálogo`);
            setPackages(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            alert("⚠️ No fue posible eliminarlo. Es posible que existan reservaciones pasadas ligadas a este paquete, para proteger el sistema, Postgres impidió el borrado.");
        }
    };

    const saveEditPackage = async (pkg) => {
        try {
            const { error } = await supabase.from('packages').update({
                name: pkg.name,
                price: pkg.price,
                description: pkg.description,
                ideal_for: pkg.ideal_for
            }).eq('id', pkg.id);

            if (error) throw error;
            setPackages(prev => prev.map(p => p.id === pkg.id ? pkg : p));
            setEditingPkg(null);
            await logActivity('UPDATE', 'PACKAGE', `Ajustó los precios/detalles del paquete: ${pkg.name}`);
            alert("¡Editado correctamente!");
        } catch (err) {
            alert("Error al actualizar la información: " + err.message);
        }
    };

    return (
        <div className="container" style={{ padding: '100px 20px', minHeight: '70vh', backgroundColor: 'var(--white)' }}>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to="/" style={{ display: 'inline-block', padding: '10px 15px', backgroundColor: '#333', color: '#fff', textDecoration: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
                    Volver al Barco
                </Link>
                <button onClick={() => setShowActivityLog(true)} style={{ background: '#b59250', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    Auditoría del Sistema
                </button>
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', marginBottom: '10px' }}>Mando de Control del Barco</h2>
            <p style={{ color: 'var(--text-light)', marginBottom: '40px' }}>Supervisa reservaciones y edita el catálogo directamente (Opción 2 Profesional).</p>

            {/* ----------------- SECCIÓN 0: CONFIGURACIÓN GLOBAL ----------------- */}
            <div style={{ background: '#fff3cd', padding: '15px 25px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #ffeeba', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div>
                    <h3 style={{ margin: 0, color: '#856404' }}>Configuración Única del Barco</h3>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#856404' }}>Ajusta el límite total de pasajeros diarios de la embarcación entera.</p>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ fontWeight: 'bold' }}>Capacidad Diaria (ps):</label>
                    <input type="number" min="1" value={tempCapacity === 0 ? '' : tempCapacity} onChange={e => setTempCapacity(e.target.value === '' ? '' : parseInt(e.target.value))} style={{ padding: '8px', width: '80px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1.1rem', textAlign: 'center' }} />
                    <button className="btn-primary" onClick={handleSaveGlobalCapacity} style={{ padding: '8px 12px', borderRadius: '4px' }}>Guardar</button>
                </div>
            </div>

            {/* ----------------- SECCIÓN 0.5: CENTRO DE NOTIFICACIONES ----------------- */}
            <div style={{ background: '#f0f4f8', padding: '25px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #c9d6df' }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    Centro de Avisos Urgentes
                </h3>

                {pendingReservations.length === 0 && warnings.length === 0 ? (
                    <div style={{ padding: '15px', background: '#d4edda', color: '#155724', borderRadius: '6px', fontWeight: 'bold', border: '1px solid #c3e6cb' }}>
                        El barco opera con normalidad. No tienes notificaciones pendientes.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {pendingReservations.length > 0 && (
                            <div style={{ padding: '15px', background: '#fff', borderLeft: '5px solid #dc3545', borderRadius: '4px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                                Tienes <strong style={{ fontSize: '1.1rem', color: '#dc3545' }}>{pendingReservations.length}</strong> reservación(es) nueva(s) esperando tu aprobación en la Bitácora.
                            </div>
                        )}
                        {warnings.map((w, i) => (
                            <div key={i} style={{ padding: '15px', background: '#fff', borderLeft: '5px solid #ffc107', borderRadius: '4px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', fontWeight: 'bold', color: '#856404' }}>
                                {w}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ----------------- SECCIÓN 1: CREAR PAQUETE NUEVO ----------------- */}
            <div style={{ background: '#f9f9f9', padding: '25px', borderRadius: '8px', marginBottom: '30px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ marginBottom: '10px' }}>Crear Nuevo Tipo de Paseo</h3>
                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>¡Sube tus imágenes a internet! Asegúrate de haber creado tu Bucket en Supabase antes de subir tu primera foto por aquí.</p>
                <form onSubmit={handleCreatePackage} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input type="text" placeholder="Nombre (ej. Paseo Nocturno)" value={newPackage.name} onChange={e => setNewPackage({ ...newPackage, name: e.target.value })} required style={{ padding: '10px', flex: '1', minWidth: '200px' }} />
                    <input type="number" placeholder="Costo ($)" value={newPackage.price} onChange={e => setNewPackage({ ...newPackage, price: e.target.value })} required style={{ padding: '10px', width: '150px' }} />
                    <input type="text" placeholder="Descripción breve" value={newPackage.description} onChange={e => setNewPackage({ ...newPackage, description: e.target.value })} style={{ padding: '10px', flex: '2', minWidth: '250px' }} />
                    <input type="text" placeholder="Ideal para (Ej: Parejas)" value={newPackage.ideal_for} onChange={e => setNewPackage({ ...newPackage, ideal_for: e.target.value })} style={{ padding: '10px', flex: '1', minWidth: '200px' }} />

                    <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Foto para internet (Opcional):</label>
                        <input id="photo-uploader" type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} style={{ fontSize: '0.85rem' }} />
                    </div>

                    <button type="submit" className="btn-primary" style={{ padding: '10px 20px' }} disabled={isCreating}>
                        {isCreating ? 'Subiendo Nube...' : '+ Agregar Paquete'}
                    </button>
                </form>
            </div>

            {/* ----------------- SECCIÓN 2: CONTROL DE PAQUETES (EDITAR/ELIMINAR) ----------------- */}
            <h3 style={{ marginBottom: '15px' }}>Editar Catálogo de Paseos Actual</h3>
            <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '50px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#eeeedd' }}>
                        <tr style={{ borderBottom: '2px solid var(--text-dark)' }}>
                            <th style={{ padding: '12px' }}>ID</th>
                            <th>Nombre del Paseo</th>
                            <th>Costo</th>
                            <th>Descripción Guardada</th>
                            <th>Ideal Para</th>
                            <th style={{ minWidth: '220px', textAlign: 'center' }}>Acciones Mágicas</th>
                        </tr>
                    </thead>
                    <tbody>
                        {packages.map(p => (
                            <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                                {editingPkg?.id === p.id ? (
                                    <>
                                        <td style={{ padding: '12px' }}>{p.id}</td>
                                        <td><input type="text" value={editingPkg.name} onChange={e => setEditingPkg({ ...editingPkg, name: e.target.value })} style={{ width: '90%', padding: '5px' }} /></td>
                                        <td><input type="number" value={editingPkg.price} onChange={e => setEditingPkg({ ...editingPkg, price: e.target.value })} style={{ width: '90%', padding: '5px' }} /></td>
                                        <td><textarea value={editingPkg.description} onChange={e => setEditingPkg({ ...editingPkg, description: e.target.value })} style={{ width: '90%', padding: '5px' }} /></td>
                                        <td><input type="text" value={editingPkg.ideal_for || ''} onChange={e => setEditingPkg({ ...editingPkg, ideal_for: e.target.value })} style={{ width: '90%', padding: '5px' }} /></td>
                                        <td style={{ verticalAlign: 'middle' }}>
                                            <div style={{ display: 'flex', gap: '8px', minWidth: '200px', alignItems: 'center', justifyContent: 'center' }}>
                                                <button className="btn-primary" onClick={() => saveEditPackage(editingPkg)} style={{ padding: '8px 12px', borderRadius: '4px', flex: 1, whiteSpace: 'nowrap' }}>Guardar</button>
                                                <button className="btn-primary" onClick={() => setEditingPkg(null)} style={{ padding: '8px 12px', background: '#333', borderRadius: '4px', flex: 1, whiteSpace: 'nowrap' }}>Cancelar</button>
                                            </div>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td style={{ padding: '12px' }}>{p.id}</td>
                                        <td><strong>{p.name}</strong></td>
                                        <td style={{ color: 'var(--primary-color)' }}>${p.price}</td>
                                        <td>{p.description}</td>
                                        <td>{p.ideal_for || 'Todas las edades'}</td>
                                        <td style={{ verticalAlign: 'middle' }}>
                                            <div style={{ display: 'flex', gap: '8px', minWidth: '200px', alignItems: 'center', justifyContent: 'center' }}>
                                                <button className="btn-primary" onClick={() => setEditingPkg(p)} style={{ padding: '8px 12px', borderRadius: '4px', flex: 1, whiteSpace: 'nowrap' }}>Editar</button>
                                                <button className="btn-primary" onClick={() => handleDeletePackage(p.id)} style={{ padding: '8px 12px', borderRadius: '4px', flex: 1, whiteSpace: 'nowrap' }}>Borrar</button>
                                            </div>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ----------------- SECCIÓN 3: RESERVACIONES REALES ----------------- */}
            <h3 style={{ marginBottom: '20px' }}>Bitácora de Reservaciones Entrantes</h3>

            {/* ----------------- FILTROS ----------------- */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap', backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px' }}>Filtrar por Fecha:</label>
                    <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px' }}>Filtrar por Paquete:</label>
                    <select value={filterPackage} onChange={e => setFilterPackage(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '150px' }}>
                        <option value="">Todos los Paquetes</option>
                        {packages.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px' }}>Filtrar por Estatus:</label>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '150px' }}>
                        <option value="">Cualquier Estatus</option>
                        <option value="pending">Pendiente de Aprob.</option>
                        <option value="confirmed">Confirmado (Falta Cobro)</option>
                        <option value="paid">Pagado (Listo para Abordar)</option>
                        <option value="in_progress">En Curso</option>
                        <option value="completed">Viaje Realizado</option>
                        <option value="cancelled">Cancelado / Rechazado</option>
                    </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
                    <button onClick={() => { setFilterDate(''); setFilterPackage(''); setFilterStatus(''); }} style={{ padding: '8px 15px', background: '#e2e6ea', color: '#333', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Limpiar Filtros</button>
                    {filterDate && (
                        <button onClick={() => setReportModalDate(filterDate)} className="btn-primary" style={{ padding: '8px 15px', borderRadius: '4px', background: '#2c2c2c', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                            Diario
                        </button>
                    )}
                    <button onClick={() => setShowAnnualReport(true)} className="btn-primary" style={{ padding: '8px 15px', borderRadius: '4px', background: '#b59250', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 2px 4px rgba(181,146,80,0.3)' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        Anual
                    </button>
                </div>
            </div>
            {loading ? <p>Cargando bitácora de reservas...</p> : (
                <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--text-dark)', color: 'var(--text-dark)', backgroundColor: '#f9f9f9' }}>
                                <th style={{ padding: '15px' }}>Fecha Viaje</th>
                                <th>Cliente y Teléfono</th>
                                <th>Paquete Deseado</th>
                                <th>Personas</th>
                                <th>Monto ($)</th>
                                <th>Estatus / Razón</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReservations.map(r => (
                                <tr key={r.id} style={{ borderBottom: '1px solid #eee', backgroundColor: r.status === 'cancelled' ? '#fff5f6' : 'white' }}>
                                    <td style={{ padding: '15px', fontWeight: 'bold' }}>{r.reservation_date}</td>
                                    <td>{r.contact_name} <br /><span style={{ fontSize: '0.8rem', color: '#666' }}>{r.contact_phone}</span></td>
                                    <td>{r.packages?.name}</td>
                                    <td>{r.persons_count} ps.</td>
                                    <td style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>${r.total_price}</td>
                                    <td>
                                        {r.status === 'pending' ? (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button className="btn-primary" onClick={() => handleStatusChange(r.id, 'confirmed')} style={{ padding: '10px 15px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>Aceptar</button>
                                                <button className="btn-primary" onClick={() => handleStatusChange(r.id, 'cancelled')} style={{ padding: '10px 15px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>Rechazar</button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                <span style={{
                                                    display: 'inline-block', padding: '8px 15px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.85rem',
                                                    backgroundColor: r.status === 'confirmed' ? '#d4edda' : (r.status === 'paid' ? '#cce5ff' : (r.status === 'in_progress' ? '#d1ecf1' : (r.status === 'completed' ? '#d4edda' : '#f8d7da'))),
                                                    color: r.status === 'confirmed' ? '#155724' : (r.status === 'paid' ? '#004085' : (r.status === 'in_progress' ? '#0c5460' : (r.status === 'completed' ? '#155724' : '#721c24')))
                                                }}>
                                                    {r.status === 'confirmed' ? 'Conf. (Falta Cobro)' :
                                                        r.status === 'paid' ? 'Ya Liquidado' :
                                                            r.status === 'in_progress' ? 'En Curso' :
                                                                r.status === 'completed' ? 'Realizado' :
                                                                    'Ya Rechazado'}
                                                </span>
                                                {r.status === 'confirmed' && (
                                                    <button className="btn-primary" onClick={() => setActivePaymentReservation(r)} style={{ padding: '8px 12px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} title="Abrir Punto de Venta">Cobrar</button>
                                                )}
                                                {r.status === 'paid' && (
                                                    <button className="btn-primary" onClick={() => handleStatusChange(r.id, 'in_progress')} style={{ padding: '8px 12px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>Iniciar Viaje</button>
                                                )}
                                                {r.status === 'in_progress' && (
                                                    <button onClick={() => handleStatusChange(r.id, 'completed')} style={{ padding: '8px 12px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', backgroundColor: '#1a1814', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Completar Viaje</button>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredReservations.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-light)' }}>
                                        {reservations.length === 0 ? "Sin pasajeros a bordo todavía." : "Ninguna reservación coincide con los filtros aplicados."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ----------------- MODAL DE PUNTO DE VENTA (TAQUILLA) ----------------- */}
            {activePaymentReservation && (
                <PaymentModal
                    reservation={activePaymentReservation}
                    onClose={() => setActivePaymentReservation(null)}
                    onPaymentSuccess={handlePaymentSuccess}
                />
            )}

            {/* ----------------- MODAL DE REPORTES DIARIOS ----------------- */}
            {reportModalDate && (
                <DailyReportModal
                    date={reportModalDate}
                    reservations={reservations}
                    packages={packages}
                    onClose={() => setReportModalDate(null)}
                />
            )}

            {/* ----------------- MODAL DE REPORTES ANUALES ----------------- */}
            {showAnnualReport && (
                <AnnualReportModal
                    reservations={reservations}
                    onClose={() => setShowAnnualReport(false)}
                />
            )}

            {/* ----------------- MODAL DE AUDITORÍA LOGS ----------------- */}
            {showActivityLog && (
                <ActivityLogModal onClose={() => setShowActivityLog(false)} />
            )}
        </div>
    );
};
export default AdminDashboard;
