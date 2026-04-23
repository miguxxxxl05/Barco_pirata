import React from 'react';
import PackageCard from './PackageCard';
import './Packages.css';

const PackagesList = ({ packages, loading, onReservePackage }) => {
    return (
        <section className="packages-section" id="packages">
            <div className="container">
                {loading ? (
                    <h2 style={{ textAlign: 'center', margin: '100px 0', color: 'var(--text-light)' }}>📡 Extrayendo paquetes desde Supabase...</h2>
                ) : packages.length === 0 ? (
                    <h2 style={{ textAlign: 'center', margin: '50px 0' }}>La conexión funcionó, pero la tabla 'packages' está vacía.</h2>
                ) : (
                    packages.map((pkg, index) => (
                        <PackageCard
                            key={pkg.id}
                            packageData={pkg}
                            reverse={index % 2 !== 0}
                            onReserve={() => onReservePackage(pkg.id)}
                        />
                    ))
                )}
            </div>
        </section>
    );
};

export default PackagesList;
