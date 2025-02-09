import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import { ProfilePage } from './pages/ProfilePage';
import SellerStorefrontPage from './pages/SellerStorefrontPage';
import { SellerCustomizationPage } from './pages/SellerCustomizationPage';
import { BuyerSignupPage } from './pages/BuyerSignupPage';
import ListingsPage from './pages/ListingsPage';
import { CartPage } from './pages/CartPage';
import BecomeSellerPage from './pages/BecomeSellerPage';
import LoginPage from './pages/LoginPage';
import { OrderHistoryPage } from './pages/OrderHistoryPage';
import SellerDashboard from './pages/SellerDashboard';
import CreateListingPage from './pages/CreateListingPage';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Switch>
            <Route path="/" exact component={HomePage} />
            <Route path="/login" component={LoginPage} />
            <Route path="/signup" component={BuyerSignupPage} />
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
            <Route path="*" component={() => <h1>404 Not Found</h1>} />
          </Switch>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;