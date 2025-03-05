import React, { useState, useEffect } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  errorFallbackUrl?: string;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholderClassName = '',
  errorFallbackUrl = '/images/placeholder.jpg'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    // Reset states when src changes
    setIsLoaded(false);
    setError(false);
    setImageSrc(null);

    const img = new Image();
    img.src = src;

    img.onload = () => {
      setIsLoaded(true);
      setImageSrc(src);
    };

    img.onerror = () => {
      setError(true);
      setImageSrc(errorFallbackUrl);
    };

    // Clean up
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, errorFallbackUrl]);

  if (!isLoaded) {
    return (
      <div className={`animate-pulse bg-gray-200 ${placeholderClassName || className}`}>
        <span className="sr-only">Loading image...</span>
      </div>
    );
  }

  return (
    <img
      src={imageSrc || ''}
      alt={error ? `Failed to load image: ${alt}` : alt}
      className={className}
      loading="lazy"
    />
  );
};

export default LazyImage; 