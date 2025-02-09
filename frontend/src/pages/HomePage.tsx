import { SellerCard } from '../components/cards/SellerCard'
import { ProductCard } from '../components/cards/ProductCard'
import { Seller } from '../types/Seller'

export const HomePage = () => {
  // Mock data - replace with real data from your backend
  const featuredSellers: Seller[] = [
    { id: '1', name: 'Card Shop A', listing_count: 150, min_price: 10.00, rating: 4.5, sales: 200, image: 'https://via.placeholder.com/150' },
    { id: '2', name: 'Collector B', listing_count: 75, min_price: 5.00, rating: 4.0, sales: 150, image: 'https://via.placeholder.com/150' },
    { id: '3', name: 'Trading Post C', listing_count: 200, min_price: 8.00, rating: 4.8, sales: 300, image: 'https://via.placeholder.com/150' },
  ]

  const dealsAndSteals = [
    {
      id: '1',
      title: 'Rare Baseball Card Collection',
      price: 299.99,
      discount: 20,
      image: 'https://images.unsplash.com/photo-1584714268709-c3dd9c92b378?auto=format&fit=crop&w=800&q=80',
      seller: 'Premium Cards',
    },
    {
      id: '2',
      title: 'Limited Edition Trading Cards',
      price: 149.99,
      discount: 15,
      image: 'https://images.unsplash.com/photo-1606503153255-59d5e417e3f3?auto=format&fit=crop&w=800&q=80',
      seller: 'Vintage Collections',
    },
  ]

  const topSellers = [
    {
      id: '1',
      title: 'Mint Condition Classic Card',
      price: 499.99,
      image: 'https://images.unsplash.com/photo-1622037022824-0c71d511ef3c?auto=format&fit=crop&w=800&q=80',
      seller: 'Elite Cards',
    },
    {
      id: '2',
      title: 'Special Edition Set',
      price: 299.99,
      image: 'https://images.unsplash.com/photo-1585504198199-20277593b94f?auto=format&fit=crop&w=800&q=80',
      seller: 'Card Masters',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
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
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Top Sellers of the Week</h2>
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