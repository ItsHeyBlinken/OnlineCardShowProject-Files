import React, { useState, useRef, MouseEvent } from 'react';
import LazyImage from './LazyImage';
import { ZoomIn, ZoomOut, Maximize, Minimize } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
  alt: string;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, alt }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);
  
  const maxZoom = 3;
  const minZoom = 1;
  const zoomStep = 0.5;
  
  if (!images || images.length === 0) {
    return (
      <div className="w-full h-64 bg-gray-200 flex items-center justify-center rounded-lg">
        <p className="text-gray-500">No images available</p>
      </div>
    );
  }
  
  const handleZoomIn = () => {
    if (zoomLevel < maxZoom) {
      setZoomLevel(prev => Math.min(prev + zoomStep, maxZoom));
    }
  };

  const handleZoomOut = () => {
    if (zoomLevel > minZoom) {
      setZoomLevel(prev => Math.max(prev - zoomStep, minZoom));
      // Reset position when zooming out to minimum
      if (zoomLevel - zoomStep <= minZoom) {
        setPosition({ x: 0, y: 0 });
      }
    }
  };

  const handleReset = () => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMaxZoom = () => {
    setZoomLevel(maxZoom);
  };

  const handleMouseDown = (e: MouseEvent) => {
    // Only enable panning when zoomed in
    if (zoomLevel > 1) {
      setIsPanning(true);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isPanning && zoomLevel > 1) {
      // Calculate new position based on mouse movement
      setPosition(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY,
      }));
    }
  };

  const handleMouseLeave = () => {
    setIsPanning(false);
  };

  return (
    <div className="space-y-4">
      {/* Main image display with zoom controls */}
      <div className="relative">
        <div 
          ref={imageContainerRef}
          className="w-full h-96 relative overflow-hidden rounded-lg border border-gray-200"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ cursor: zoomLevel > 1 ? 'grab' : 'default' }}
        >
          <div 
            className="w-full h-full flex items-center justify-center transition-transform duration-150"
            style={{ 
              transform: `scale(${zoomLevel}) translate(${position.x}px, ${position.y}px)`,
              transformOrigin: 'center',
            }}
          >
            <LazyImage
              src={images[selectedIndex]}
              alt={`${alt} - Image ${selectedIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              placeholderClassName="w-full h-full"
            />
          </div>
          
          {/* Zoom status indicator */}
          {zoomLevel > 1 && (
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
              {Math.round(zoomLevel * 100)}%
            </div>
          )}
        </div>
        
        {/* Zoom controls */}
        <div className="absolute top-2 right-2 flex space-x-2">
          <button 
            onClick={handleZoomIn}
            disabled={zoomLevel >= maxZoom}
            className="p-2 bg-white bg-opacity-75 rounded-full shadow hover:bg-opacity-100 transition-all disabled:opacity-50"
            title="Zoom In"
          >
            <ZoomIn size={18} />
          </button>
          <button 
            onClick={handleZoomOut}
            disabled={zoomLevel <= minZoom}
            className="p-2 bg-white bg-opacity-75 rounded-full shadow hover:bg-opacity-100 transition-all disabled:opacity-50"
            title="Zoom Out"
          >
            <ZoomOut size={18} />
          </button>
          <button 
            onClick={handleMaxZoom}
            className="p-2 bg-white bg-opacity-75 rounded-full shadow hover:bg-opacity-100 transition-all"
            title="Maximum Zoom"
          >
            <Maximize size={18} />
          </button>
          <button 
            onClick={handleReset}
            className="p-2 bg-white bg-opacity-75 rounded-full shadow hover:bg-opacity-100 transition-all"
            title="Reset Zoom"
          >
            <Minimize size={18} />
          </button>
        </div>
      </div>
      
      {/* Thumbnail navigation */}
      {images.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => {
                setSelectedIndex(index);
                // Reset zoom when changing images
                setZoomLevel(1);
                setPosition({ x: 0, y: 0 });
              }}
              className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                selectedIndex === index ? 'border-blue-500' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <LazyImage
                src={image}
                alt={`${alt} - Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageGallery; 