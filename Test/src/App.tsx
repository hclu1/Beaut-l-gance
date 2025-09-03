
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import CustomerStore from './pages/CustomerStore'
import AdminDashboard from './pages/AdminDashboard'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderConfirmation from './pages/OrderConfirmation'
import OwnerLogin from './pages/OwnerLogin'

function App() {
  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { 
            background: '#1f2937', 
            color: '#fff',
            borderRadius: '12px'
          },
          success: { 
            style: { background: '#10b981' } 
          },
          error: { 
            style: { background: '#ef4444' } 
          }
        }}
      />
      
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
          <Routes>
            {/* Mode Client - Boutique publique accessible par lien */}
            <Route path="/" element={<CustomerStore />} />
            <Route path="/boutique" element={<CustomerStore />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
            
            {/* Mode Propriétaire - Interface de gestion */}
            <Route path="/owner" element={<OwnerLogin />} />
            <Route path="/owner/dashboard" element={<AdminDashboard />} />
          </Routes>
        </div>
      </Router>
    </>
  )
}

export default App
