import { FC } from 'react'

interface Feature {
  name: string;
  price: string;
  description: string;
  features: string[];
}

const tiers: Feature[] = [
  {
    name: "Basic",
    price: "Free",
    description: "Perfect for seller who want to explore the platform",
    features: ["25 Listings", "Basic Store Front", "Basic Analytics", "Standard Search"],
  },
  {
    name: "Starter",
    price: "$50*",
    description: "Best for casual sellers, small-scale sellers, and collectors",
    features: ["100 Listings", "Basic Store Front Customization", "Basic Analytics", "Standard Search"],
  },
  {
    name: "Pro",
    price: "$100*",
    description: "Ideal for growing sellers or hobbyists",
    features: [
      "250 Listings",
      "Advanced Store Front Customization",
      "Advanced Analytics",
      "Priority Search Placement",
      "Access to Marketing Tools",
    ],
  },
  {
    name: "Premium",
    price: "$300*",
    description: "For professional sellers or high volume sellers",
    features: [
      "Unlimited Listings",
      "Unlimited Store Front Customization",
      "Advanced Analytics",
      "Priority Search Placement",
      "Access to Marketing Tools",
      "Dedicated Support",
      "Custom Features",
    ],
  },
]

const SubscriptionTiers: FC = () => {
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Choose Your Plan</h2>
          <p className="mt-4 text-xl text-gray-600">Select the perfect tier for your needs</p>
        </div>
        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:grid-cols-4">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`flex flex-col justify-between rounded-lg border ${
                tier.name === "Pro" ? 'border-blue-600 relative' : 'border-gray-200'
              } p-6 transition-shadow duration-300 hover:shadow-lg`}
            >
              {tier.name === "Pro" && (
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4">
                  <span className="inline-flex rounded-full bg-blue-600 px-4 py-1 text-sm font-semibold text-white">
                    Popular
                  </span>
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{tier.name}</h3>
                <p className="mt-2 text-sm text-gray-500">{tier.description}</p>
                {tier.name === "Basic" && (
                  <p className="mt-2 text-sm text-blue-600 italic">
                    *Default tier for all new sellers
                  </p>
                )}
              </div>
              <div className="mt-4">
                <div className="text-center">
                  <span className="text-2xl font-bold text-gray-900">{tier.price}</span>
                  {tier.name !== "Enterprise" && <span className="text-gray-500">/month</span>}
                </div>
                <ul className="mt-4 space-y-2">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <svg
                        className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6">
                <button
                  className={`w-full rounded-md px-4 py-2 text-sm font-medium ${
                    tier.name === "Pro"
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "border border-blue-600 text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  {tier.name === "Enterprise" ? "Contact Sales" : "Get Started"}
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* New footer section */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p className="mb-1">*Pricing Subject to Change</p>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionTiers

