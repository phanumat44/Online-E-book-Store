import React from 'react';

export default function PriceDisplay({ price, discountPercent, isDiscountActive, size = 'normal' }) {
    
    const numericPrice = Number(price);
    const hasDiscount = isDiscountActive && discountPercent > 0;
    
    let finalPrice = numericPrice;
    if (hasDiscount) {
        finalPrice = numericPrice * (100 - discountPercent) / 100;
    }

    const formatPrice = (p) => `฿${p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const baseStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontWeight: 'bold',
    };
    
    // Size variants
    const fontSize = size === 'large' ? '1.5rem' : size === 'small' ? '0.9rem' : '1.2rem';

    if (hasDiscount) {
        return (
            <div style={{ ...baseStyle, fontSize }}>
                <span style={{ color: '#ef4444' }}>{formatPrice(finalPrice)}</span>
                <span style={{ textDecoration: 'line-through', color: '#9ca3af', fontSize: '0.8em', fontWeight: 'normal' }}>
                    {formatPrice(numericPrice)}
                </span>
            </div>
        );
    }

    return (
        <div style={{ ...baseStyle, fontSize }}>
            <span style={{ color: '#111827'  }}>{formatPrice(numericPrice)}</span>
        </div>
    );
}
