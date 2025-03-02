import React from 'react'
import { Link } from 'react-router-dom'
import { Tag } from 'lucide-react'

interface ProductCardProps {
  id: string
  title: string
  price: number
  image: string
  discount?: number
  seller: string
  year?: string
  brand?: string
  playerName?: string
  cardNumber?: string
}

export const ProductCard = ({ 
  id, 
  title, 
  price, 
  image, 
  discount, 
  seller,
  year,
  brand,
  playerName,
  cardNumber
}: ProductCardProps) => {
  const discountedPrice = discount ? price - (price * discount) / 100 : price

  return (
    <Link to={`/product/${id}`} className="block">
      <div className="rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md">
        <div className="relative">
          <img
            src={image}
            alt={title}
            className="h-48 w-full rounded-t-lg object-cover"
          />
          {discount && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-medium">
              {discount}% OFF
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-medium text-gray-900 line-clamp-2">{title}</h3>
          
          <div className="mt-1 text-sm text-gray-500">
            {playerName && <div>{playerName}</div>}
            {brand && year && <div>{brand} ({year})</div>}
            {brand && !year && <div>{brand}</div>}
            {!brand && year && <div>Year: {year}</div>}
            {cardNumber && <div>Card #: {cardNumber}</div>}
          </div>
          
          <div className="mt-2 flex items-center justify-between">
            <div>
              {discount ? (
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-gray-900">
                    ${discountedPrice.toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-500 line-through">
                    ${price.toFixed(2)}
                  </span>
                </div>
              ) : (
                <span className="text-lg font-bold text-gray-900">
                  ${price.toFixed(2)}
                </span>
              )}
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Tag className="mr-1 h-4 w-4" />
              <span>{seller}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}