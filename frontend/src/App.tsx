import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import HomePage from './pages/HomePage';
import { ProfilePage } from './pages/ProfilePage';
import SellerStorefrontPage from './pages/SellerStorefrontPage';
import { SellerCustomizationPage } from './pages/SellerCustomizationPage';
import BuyerSignupPage from './pages/BuyerSignupPage';
import ListingsPage from './pages/ListingsPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import BecomeSellerPage from './pages/BecomeSellerPage';
import LoginPage from './pages/LoginPage';
import { OrderHistoryPage } from './pages/OrderHistoryPage';
import SellerDashboard from './pages/SellerDashboard';
import SellerShippingPage from './pages/SellerShippingPage';
import CreateListingPage from './pages/CreateListingPage';
import ManageListingsPage from './pages/ManageListingsPage';
import SubscriptionTiers from './pages/Subscription-Tiers';
import SubscriptionManagementPage from './pages/SubscriptionManagementPage';
import InboxPage from './pages/InboxPage';
import SearchResultsPage from './pages/SearchResultsPage';
import ListingDetailPage from './pages/ListingDetailPage';
import SellerRegistrationComplete from './pages/SellerRegistrationComplete';
import ForceSellerPage from './pages/ForceSellerPage';
import ManageSubscriptionTest from './pages/ManageSubscriptionTest';

const App = () => {
  console.log("App component rendered - routes should be registered");
  
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">
              <Switch>
                <Route path="/" exact component={HomePage} />
                <Route path="/login" component={LoginPage} />
                <Route path="/signup/buyer" component={BuyerSignupPage} />
                <Route
                  path="/profile"
                  render={() => (
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/order-history"
                  render={() => (
                    <ProtectedRoute>
                      <OrderHistoryPage />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/seller/storefront"
                  render={() => (
                    <ProtectedRoute>
                      <SellerStorefrontPage />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/seller/customize"
                  render={() => (
                    <ProtectedRoute>
                      <SellerCustomizationPage />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/test-seller"
                  render={() => (
                    <ProtectedRoute>
                      <ForceSellerPage />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/manage-subscription-test"
                  component={ManageSubscriptionTest}
                />
                <Route
                  path="/test2"
                  component={ManageSubscriptionTest}
                />
                <Route
                  path="/listings"
                  render={() => (
                    <ProtectedRoute>
                      <ListingsPage />
                    </ProtectedRoute>
                  )}
                />
                <Route path="/cart" component={CartPage} />
                <Route
                  path="/checkout"
                  render={() => (
                    <ProtectedRoute>
                      <CheckoutPage />
                    </ProtectedRoute>
                  )}
                />
                <Route path="/order-confirmation" component={OrderConfirmationPage} />
                <Route
                  path="/become-seller"
                  render={() => (
                    <ProtectedRoute>
                      <BecomeSellerPage />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/become-seller-direct"
                  render={() => (
                    <ProtectedRoute>
                      <BecomeSellerPage directMode={true} />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/become-seller/complete"
                  render={() => (
                    <ProtectedRoute>
                      <SellerRegistrationComplete />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/seller/dashboard"
                  render={() => (
                    <ProtectedRoute>
                      <SellerDashboard />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/seller/create-listing"
                  render={() => (
                    <ProtectedRoute>
                      <CreateListingPage />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/manage-listings"
                  component={ManageListingsPage}
                />
                <Route path="/subscription-tiers" component={SubscriptionTiers} />
                <Route
                  path="/seller/subscription"
                  render={() => (
                    <ProtectedRoute path="/seller/subscription">
                      <SubscriptionManagementPage />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/subscription-management"
                  render={() => (
                    <ProtectedRoute>
                      <SubscriptionManagementPage />
                    </ProtectedRoute>
                  )}
                />
                <Route path="/inbox" component={InboxPage} />
                <Route path="/search" component={SearchResultsPage} />
                <Route path="/listing/:id" component={ListingDetailPage} />
                <Route path="/storefront/:id" component={SellerStorefrontPage} />
                <Route
                  path="/seller/shipping"
                  render={() => (
                    <ProtectedRoute>
                      <SellerShippingPage />
                    </ProtectedRoute>
                  )}
                />
                <Route path="*" component={() => <h1>404 Not Found</h1>} />
              </Switch>
            </main>
            <Footer />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;