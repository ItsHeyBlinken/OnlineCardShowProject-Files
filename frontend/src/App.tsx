import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import { ProfilePage } from './pages/ProfilePage';
import SellerStorefrontPage from './pages/SellerStorefrontPage';
import { SellerCustomizationPage } from './pages/SellerCustomizationPage';
import BuyerSignupPage from './pages/BuyerSignupPage';
import ListingsPage from './pages/ListingsPage';
import { CartPage } from './pages/CartPage';
import BecomeSellerPage from './pages/BecomeSellerPage';
import LoginPage from './pages/LoginPage';
import { OrderHistoryPage } from './pages/OrderHistoryPage';
import SellerDashboard from './pages/SellerDashboard';
import CreateListingPage from './pages/CreateListingPage';
import SubscriptionTiers from './pages/Subscription-Tiers';
import SubscriptionManagementPage from './pages/SubscriptionManagementPage';
import InboxPage from './pages/InboxPage';
import SearchResultsPage from './pages/SearchResultsPage';
import ListingDetailPage from './pages/ListingDetailPage';

const App = () => {
  return (
    <AuthProvider>
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
                  <ProtectedRoute path="/profile">
                    <ProfilePage />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/order-history"
                render={() => (
                  <ProtectedRoute path="/order-history">
                    <OrderHistoryPage />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/seller/storefront"
                render={() => (
                  <ProtectedRoute path="/seller/storefront">
                    <SellerStorefrontPage />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/seller/customize"
                render={() => (
                  <ProtectedRoute path="/seller/customize">
                    <SellerCustomizationPage />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/listings"
                render={() => (
                  <ProtectedRoute path="/listings">
                    <ListingsPage />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/cart"
                render={() => (
                  <ProtectedRoute path="/cart">
                    <CartPage />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/become-seller"
                render={() => (
                  <ProtectedRoute path="/become-seller">
                    <BecomeSellerPage />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/seller/dashboard"
                render={() => (
                  <ProtectedRoute path="/seller/dashboard">
                    <SellerDashboard />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/seller/create-listing"
                render={() => (
                  <ProtectedRoute path="/seller/create-listing">
                    <CreateListingPage />
                  </ProtectedRoute>
                )}
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
              <Route path="/inbox" component={InboxPage} />
              <Route path="/search" component={SearchResultsPage} />
              <Route path="/listing/:id" component={ListingDetailPage} />
              <Route path="/storefront/:id" component={SellerStorefrontPage} />
              <Route path="*" component={() => <h1>404 Not Found</h1>} />
            </Switch>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;