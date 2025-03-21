import React from 'react'
import { MapPin } from 'lucide-react'
import { Formik, Field } from 'formik'
import axios from 'axios'

interface BuyerProfileProps {
  profile: {
    full_name: string;
    shipping_address: {
      street: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
    id: string;
  };
  orders: any[];
  onUpdate: (data: Partial<any>) => Promise<void>;
}

const BuyerProfile: React.FC<BuyerProfileProps> = ({ profile, orders, onUpdate }) => {
  const handleSubmit = async (values: { full_name: string; shipping_address: any }) => {
    try {
      await axios.put(`/api/profiles/${profile.id}`, values)
      onUpdate(values)
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  return (
    <div className="space-y-8">
      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
        <Formik
          initialValues={{
            full_name: profile.full_name || '',
            shipping_address: profile.shipping_address || {
              street: '',
              city: '',
              state: '',
              zip: '',
              country: '',
            },
          }}
          onSubmit={handleSubmit}
        >
          {({ values, handleChange }) => (
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <Field
                  name="full_name"
                  placeholder="Full Name"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Shipping Address
                </label>
                <Field
                  name="shipping_address.street"
                  placeholder="Street Address"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-opacity-50"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    name="shipping_address.city"
                    placeholder="City"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-opacity-50"
                  />
                  <Field
                    name="shipping_address.state"
                    placeholder="State"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-opacity-50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    name="shipping_address.zip"
                    placeholder="ZIP Code"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-opacity-50"
                  />
                  <Field
                    name="shipping_address.country"
                    placeholder="Country"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-opacity-50"
                  />
                </div>
              </div>

              <button type="submit" className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
                Save Changes
              </button>
            </form>
          )}
        </Formik>
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
                <MapPin className="h-8 w-8 text-gray-400" />
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

export default BuyerProfile