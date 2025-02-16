import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { SellerCard } from '../components/cards/SellerCard'
import { ProductCard } from '../components/cards/ProductCard'
import { Seller } from '../types/Seller'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export const HomePage = () => {
  const { user } = useAuth()
  const [featuredSellers, setFeaturedSellers] = useState<Seller[]>([])
  const [dealsAndSteals, setDealsAndSteals] = useState<any[]>([])
  const [topSellers, setTopSellers] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sellersResponse, dealsResponse, topSellersResponse] = await Promise.all([
          axios.get('/api/sellers/featured'),
          axios.get('/api/deals'),
          axios.get('/api/sellers/top'),
        ]);

        setFeaturedSellers(sellersResponse.data);
        setDealsAndSteals(dealsResponse.data);
        setTopSellers(topSellersResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        {/* Only show signup CTA to unauthenticated users */}
        {!user && (
          <div className="bg-indigo-600 text-white rounded-lg p-6 mb-8 text-center shadow-xl transition-shadow hover:shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">New to Card Show?</h2>
            <p className="mb-4">Sign up to access exclusive deals and start building your collection</p>
            <Link 
              to="/signup"
              className="inline-block bg-white text-indigo-600 px-6 py-3 rounded-md font-medium hover:bg-indigo-50 transition-colors"
            >
              Get Started
            </Link>
          </div>
        )}

        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Featured Sellers */}
          <div className="col-span-3 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Featured Sellers</h2>
            <div className="space-y-4">
              {featuredSellers.map((seller: Seller) => (
                <SellerCard
                    key={seller.id}
                    id={seller.id}
                    name={seller.name}
                    listing_count={seller.listing_count}
                    min_price={seller.min_price}
                    rating={seller.rating}
                    sales={seller.sales}
                    image={seller.image}
                />
              ))}
            </div>
          </div>

          {/* Main Content - Top Sellers */}
          <div className="col-span-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Top Sales of the Week</h2>
            <div className="grid grid-cols-2 gap-6">
              {topSellers.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          </div>

          {/* Right Sidebar - Deals and Steals */}
          <div className="col-span-3 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Deals & Steals</h2>
            <div className="space-y-4">
              {dealsAndSteals.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default HomePage;