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

    // Try to load the image directly first
    tryLoadImage(src);
  }, [src, errorFallbackUrl]);

  const tryLoadImage = (imageUrl: string) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;

    img.onload = () => {
      setIsLoaded(true);
      setImageSrc(imageUrl);
    };

    img.onerror = () => {
      // If direct S3 URL fails, try using the proxy URL
      if (imageUrl.includes('amazonaws.com') && !imageUrl.includes('/api/images/proxy/')) {
        // Extract the S3 key from the full URL
        // Example: https://bucket-name.s3.region.amazonaws.com/listings/123/image0_abc.jpg
        // We need to extract everything after the bucket name: listings/123/image0_abc.jpg
        const urlParts = imageUrl.split('.amazonaws.com/');
        if (urlParts.length > 1) {
          const key = urlParts[1];
          const proxyUrl = `/api/images/proxy/${key}`;
          // Try loading with proxy URL
          tryLoadImage(proxyUrl);
          return;
        }
      }
      
      // If all attempts fail, use the fallback image
      setError(true);
      setImageSrc(errorFallbackUrl);
    };
  };

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
      alt={error ? `Failed to load: ${alt}` : alt}
      className={className}
      loading="lazy"
      crossOrigin="anonymous"
    />
  );
};

export default LazyImage; 