import React from 'react';

const PackageCard = ({ packageData, reverse, onReserve }) => {
    return (
        <div className={`package-card ${reverse ? 'reverse' : ''}`}>
            <div
                className="package-image"
                style={packageData.image ? { backgroundImage: `url(${packageData.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
            >
                {!packageData.image && (
                    <div className="image-placeholder">
                        <span>{packageData.name} - Imagen</span>
                    </div>
                )}
            </div>
            <div className="package-content">
                <div className="rating">⭐⭐⭐⭐⭐</div>
                <h2>{packageData.name}</h2>
                <p className="description">{packageData.description}</p>
                <div className="price">
                    <span>Precio: </span>
                    <h3>${packageData.price} <span>/ PERSONA</span></h3>
                </div>
                <ul className="details-list">
                    {packageData.details.map((detail, index) => (
                        <li key={index}><strong>{detail.label}:</strong> {detail.value}</li>
                    ))}
                </ul>
                <div className="package-actions">
                    <button className="btn-primary" onClick={onReserve}>Reservar</button>
                    <button className="btn-secondary">Más Detalles</button>
                </div>
            </div>
        </div>
    );
}

export default PackageCard;
