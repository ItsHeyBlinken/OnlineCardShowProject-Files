import React from 'react';

interface LazyImageProps {
    src: string;
    alt: string;
    className?: string;
}

const LazyImage: React.FC<LazyImageProps> = ({ src, alt, className }) => {
    return <img src={src} alt={alt} className={className} loading="lazy" />;
};

export default LazyImage; 