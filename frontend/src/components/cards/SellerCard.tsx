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
  return (
    <Link to={`/seller/${id}`} className="block">
      <div className="rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
        <div className="relative mb-3 h-32 w-full">
          <img
            src={image}
            alt={name}
            className="h-full w-full rounded-md object-cover"
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