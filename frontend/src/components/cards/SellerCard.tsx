import React from 'react'
import { Star, Store } from 'lucide-react'
import { Link } from 'react-router-dom'

interface SellerCardProps {
  id: string
  name: string
  rating: number
  sales: number
  image: string
  listing_count: number
  min_price: number
}

export const SellerCard: React.FC<SellerCardProps> = ({ id, name, rating, sales, image, listing_count, min_price }) => {
  // Replace placeholder images with our default image
  const imageUrl = image && image.includes('placeholder.com') 
    ? '/images/logo1.jpg' 
    : image || '/images/logo1.jpg';

  return (
    <Link to={`/storefront/${id}`} className="block">
      <div className="rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
        <div className="relative mb-3 h-32 w-full">
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full rounded-md object-cover"
            crossOrigin="anonymous"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              // Try the proxy URL if it's an S3 image, otherwise fall back to default
              if (target.src.includes('amazonaws.com') && !target.src.includes('/api/images/proxy/')) {
                // Extract the S3 key from the full URL
                // Example: https://bucket-name.s3.region.amazonaws.com/listings/123/image0_abc.jpg
                // We need to extract everything after the bucket name: listings/123/image0_abc.jpg
                const urlParts = target.src.split('.amazonaws.com/');
                if (urlParts.length > 1) {
                  const key = urlParts[1];
                  target.src = `/api/images/proxy/${key}`;
                  return;
                }
              }
              // If all else fails, use default image
              target.src = '/images/logo1.jpg';
            }}
          />
        </div>
        <h3 className="font-semibold text-gray-900">{name}</h3>
        <div className="mt-1 flex items-center space-x-1">
          <Star className="h-4 w-4 text-yellow-400 fill-current" />
          <span className="text-sm text-gray-600">{rating.toFixed(1)}</span>
        </div>
        <div className="mt-2 flex items-center text-sm text-gray-500">
          <Store className="mr-1 h-4 w-4" />
          <span>{sales} sales</span>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {listing_count} listings
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Starting at ${min_price.toFixed(2)}
        </p>
      </div>
    </Link>
  )
}