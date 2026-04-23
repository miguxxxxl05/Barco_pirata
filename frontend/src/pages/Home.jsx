import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from '../components/Hero';
import PackagesList from '../components/PackagesList';
import ReservationModal from '../components/ReservationModal';
import { supabase } from '../supabaseClient';

const localImages = {
    1: '',
    2: '',
    3: '/solo-paseo.png',
};

const Home = () => {
    const [packages, setPackages] = useState([]);
    const [loadingPackages, setLoadingPackages] = useState(true);
    const [modalConfig, setModalConfig] = useState({ isOpen: false });
    const navigate = useNavigate();

    // Extracción global en la vista principal
    useEffect(() => {
        async function fetchPackages() {
            try {
                const { data, error } = await supabase.from('packages').select('*').order('id', { ascending: true });
                if (!error && data) {
                    const fullPackages = data.map(pkg => ({
                        ...pkg,
                        // Asignación directa de la foto subida al verdadero bucket
                        image: pkg.image_url || '',
                        details: [
                            { label: 'Estatus', value: 'Disponible' },
                            { label: 'Descuento', value: '-10% (grupos de 5+)' },
                            { label: 'Ideal para', value: pkg.ideal_for || 'Todas las edades' }
                        ]
                    }));
                    setPackages(fullPackages);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingPackages(false);
            }
        }
        fetchPackages();
    }, []);

    const handleOpenModal = async (dateObj, personsCount, pkgId) => {
        // Verificamos identidad, si no existe el pirata es redirigido con cortesia a registrarse
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            alert('⛵ ¡Alto ahí, forastero! Necesitas usar tu cuenta para reservar tu lugar a bordo.');
            navigate('/login');
            return;
        }

        let formattedDate = '';
        // Format JavaScript Date to YYYY-MM-DD
        if (dateObj instanceof Date && !isNaN(dateObj)) {
            formattedDate = dateObj.toISOString().split('T')[0];
        }
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Subimos para que vea el Modal
        document.body.style.overflow = 'hidden'; // Bloquea scroll trasero

        setModalConfig({
            isOpen: true,
            initialDate: formattedDate,
            initialPersons: personsCount || 1,
            initialPackageId: pkgId || ''
        });
    };

    const handleCloseModal = () => {
        document.body.style.overflow = 'auto'; // Restaura el scroll
        setModalConfig({ isOpen: false });
    };

    return (
        <>
            <Hero onReserveNow={(d, p) => handleOpenModal(d, p, null)} />
            <PackagesList
                packages={packages}
                loading={loadingPackages}
                onReservePackage={(pkgId) => handleOpenModal(null, 1, pkgId)}
            />

            {/* Interactive Location Map */}
            <section style={{ padding: '80px 20px', background: '#1a1814', color: 'white', textAlign: 'center' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', marginBottom: '10px', color: '#b59250' }}>Nuestra Estación de Abordaje</h2>
                    <p style={{ marginBottom: '40px', color: '#ccc', fontSize: '1.1rem' }}>
                        Zarpa con nosotros desde el Recinto Portuario de Puerto Peñasco. ¡Te esperamos 30 minutos antes del viaje!
                    </p>
                    <div style={{ width: '100%', height: '500px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', border: '2px solid rgba(181, 146, 80, 0.3)' }}>
                        <iframe
                            src="https://maps.google.com/maps?q=Recinto%20Portuario,%20Puerto%20Peñasco,%20Sonora&t=&z=15&ie=UTF8&iwloc=&output=embed"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy"
                            title="Ubicación Barco Pirata"
                        ></iframe>
                    </div>
                </div>
            </section>

            <ReservationModal
                {...modalConfig}
                packages={packages}
                onClose={handleCloseModal}
            />
        </>
    );
};

export default Home;
