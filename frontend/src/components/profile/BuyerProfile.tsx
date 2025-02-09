import React from 'react'
import { User, MapPin, CreditCard, Package } from 'lucide-react'
import { Button } from '../../components/ui/Button' // Corrected import path
import { Input } from '../../components/ui/Input' // Corrected import path
import axios from 'axios'

interface BuyerProfileProps {
  profile: any
  orders: any[]
  onUpdate: (data: Partial<any>) => Promise<void>
}

export const BuyerProfile: React.FC<BuyerProfileProps> = ({ profile, orders, onUpdate }) => {
  const [isEditing, setIsEditing] = React.useState(false)
  const [formData, setFormData] = React.useState({
    full_name: profile.full_name || '',
    shipping_address: profile.shipping_address || {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: '',
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.put(`/api/profiles/${profile.id}`, formData)
      setIsEditing(false)
      onUpdate(formData) // Call onUpdate with the updated data
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  return (
    <div className="space-y-8">
      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
          <Button
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </Button>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="mt-1 relative">
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="pl-10"
                />
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Shipping Address
              </label>
              <Input
                placeholder="Street Address"
                value={formData.shipping_address.street}
                onChange={(e) => setFormData({
                  ...formData,
                  shipping_address: {
                    ...formData.shipping_address,
                    street: e.target.value,
                  },
                })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="City"
                  value={formData.shipping_address.city}
                  onChange={(e) => setFormData({
                    ...formData,
                    shipping_address: {
                      ...formData.shipping_address,
                      city: e.target.value,
                    },
                  })}
                />
                <Input
                  placeholder="State"
                  value={formData.shipping_address.state}
                  onChange={(e) => setFormData({
                    ...formData,
                    shipping_address: {
                      ...formData.shipping_address,
                      state: e.target.value,
                    },
                  })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="ZIP Code"
                  value={formData.shipping_address.zip}
                  onChange={(e) => setFormData({
                    ...formData,
                    shipping_address: {
                      ...formData.shipping_address,
                      zip: e.target.value,
                    },
                  })}
                />
                <Input
                  placeholder="Country"
                  value={formData.shipping_address.country}
                  onChange={(e) => setFormData({
                    ...formData,
                    shipping_address: {
                      ...formData.shipping_address,
                      country: e.target.value,
                    },
                  })}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Full Name</p>
                <p className="text-lg text-gray-900">{profile.full_name}</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <MapPin className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Shipping Address</p>
                <p className="text-lg text-gray-900">
                  {profile.shipping_address?.street}<br />
                  {profile.shipping_address?.city}, {profile.shipping_address?.state} {profile.shipping_address?.zip}<br />
                  {profile.shipping_address?.country}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <CreditCard className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500">Payment Information</p>
                <p className="text-lg text-gray-900">•••• •••• •••• 1234</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order History */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Order History</h2>
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between border-b border-gray-200 pb-4"
            >
              <div className="flex items-center space-x-4">
                <Package className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">
                  ${order.total_amount}
                </p>
                <p className="text-sm text-gray-500 capitalize">{order.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default BuyerProfile // Ensure default export