import React from 'react'
import { Store, Image, DollarSign, Package, BarChart } from 'lucide-react'
import { Button } from '../../components/ui/Button' // Corrected import path
import { Input } from '../../components/ui/Input'  //corrected import path
import axios from 'axios'

interface SellerProfileProps {
  profile: any
  store: any
  onUpdateStore: (data: Partial<any>) => Promise<void>;
}

export const SellerProfile: React.FC<SellerProfileProps> = ({ profile, store, onUpdateStore }) => {
  const [isEditing, setIsEditing] = React.useState(false)
  const [formData, setFormData] = React.useState({
    name: store.name || '',
    description: store.description || '',
    logo_url: store.logo_url || '',
    banner_url: store.banner_url || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.put(`/api/stores/${store.id}`, formData)
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating store:', error)
    }
  }

  // Mock data for dashboard stats
  const stats = {
    totalSales: 1234,
    monthlyRevenue: 5678.90,
    activeListings: 45,
    pendingOrders: 3,
  }

  return (
    <div className="space-y-8">
      {/* Store Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Store Information</h2>
          <Button
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel' : 'Edit Store'}
          </Button>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Store Name
              </label>
              <div className="mt-1 relative">
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-10"
                />
                <Store className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Store Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Logo URL
              </label>
              <div className="mt-1 relative">
                <Input
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  className="pl-10"
                />
                <Image className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Banner URL
              </label>
              <div className="mt-1 relative">
                <Input
                  value={formData.banner_url}
                  onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })}
                  className="pl-10"
                />
                <Image className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Store className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Store Name</p>
                <p className="text-lg text-gray-900">{store.name}</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <Store className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Description</p>
                <p className="text-lg text-gray-900">{store.description}</p>
              </div>
            </div>

            {store.logo_url && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500 mb-2">Store Logo</p>
                <img
                  src={store.logo_url}
                  alt="Store Logo"
                  className="h-24 w-24 rounded-lg object-cover"
                />
              </div>
            )}

            {store.banner_url && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500 mb-2">Store Banner</p>
                <img
                  src={store.banner_url}
                  alt="Store Banner"
                  className="h-32 w-full rounded-lg object-cover"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSales}</p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${stats.monthlyRevenue}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Listings</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeListings}</p>
            </div>
            <Store className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
            </div>
            <BarChart className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SellerProfile