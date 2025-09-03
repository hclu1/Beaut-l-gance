
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, CreditCard, Truck, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useOrders } from '../hooks/useOrders'
import { useProducts } from '../hooks/useProducts'
import toast from 'react-hot-toast'

const Checkout: React.FC = () => {
  const navigate = useNavigate()
  const { cartItems, getTotalPrice, clearCart } = useCart()
  const { createOrder } = useOrders()
  const { updateStock } = useProducts()
  
  const [loading, setLoading] = useState(false)
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      postalCode: '',
      country: 'France'
    }
  })

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1]
      setCustomerInfo(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }))
    } else {
      setCustomerInfo(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const validateForm = () => {
    const { name, email, phone, address } = customerInfo
    
    if (!name.trim()) {
      toast.error('Veuillez saisir votre nom')
      return false
    }
    
    if (!email.trim() || !email.includes('@')) {
      toast.error('Veuillez saisir un email valide')
      return false
    }
    
    if (!phone.trim()) {
      toast.error('Veuillez saisir votre téléphone')
      return false
    }
    
    if (!address.street.trim() || !address.city.trim() || !address.postalCode.trim()) {
      toast.error('Veuillez compléter votre adresse')
      return false
    }
    
    return true
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    if (cartItems.length === 0) {
      toast.error('Votre panier est vide')
      return
    }

    setLoading(true)
    
    try {
      // Créer la commande
      const order = await createOrder({
        customerInfo,
        items: cartItems.map(item => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          imageUrl: item.imageUrl
        })),
        totalAmount: getTotalPrice(),
        status: 'pending',
        notes: ''
      })

      // Mettre à jour les stocks
      for (const item of cartItems) {
        // Note: Dans une vraie application, cette logique devrait être côté serveur
        // pour éviter les conditions de course
        await updateStock(item.productId, item.stock - item.quantity)
      }

      // Vider le panier
      clearCart()
      
      // Rediriger vers la confirmation
      navigate(`/order-confirmation/${order.orderId}`)
      
    } catch (error) {
      console.error('Erreur lors de la commande:', error)
      toast.error('Erreur lors de la validation de votre commande')
    } finally {
      setLoading(false)
    }
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Votre panier est vide</h2>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-3 rounded-full hover:from-pink-600 hover:to-rose-600 transition-all"
          >
            Retour à la boutique
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/cart')}
            className="flex items-center space-x-2 text-gray-600 hover:text-pink-600 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Retour au panier</span>
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulaire */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Informations de livraison</h2>
            
            <form onSubmit={handleSubmitOrder} className="space-y-6">
              {/* Informations personnelles */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Coordonnées</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="Votre nom complet"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="votre@email.com"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="06 12 34 56 78"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Adresse de livraison */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Adresse de livraison</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse *
                    </label>
                    <input
                      type="text"
                      value={customerInfo.address.street}
                      onChange={(e) => handleInputChange('address.street', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="123 Rue de la Paix"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ville *
                      </label>
                      <input
                        type="text"
                        value={customerInfo.address.city}
                        onChange={(e) => handleInputChange('address.city', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="Paris"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Code postal *
                      </label>
                      <input
                        type="text"
                        value={customerInfo.address.postalCode}
                        onChange={(e) => handleInputChange('address.postalCode', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="75001"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bouton de validation */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-4 px-6 rounded-lg font-semibold hover:from-pink-600 hover:to-rose-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Validation en cours...</span>
                  </>
                ) : (
                  <>
                    <CreditCard size={20} />
                    <span>Valider ma commande</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Résumé de commande */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Récapitulatif</h2>
            
            {/* Articles */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Vos articles</h3>
              
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.productId} className="flex items-center space-x-4">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">{item.name}</h4>
                      <p className="text-sm text-gray-600">Quantité: {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-pink-600">
                      {(item.price * item.quantity).toFixed(2)}€
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sous-total</span>
                  <span className="font-medium">{getTotalPrice().toFixed(2)}€</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Livraison</span>
                  <span className="font-medium text-green-600">Gratuite</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span className="text-pink-600">{getTotalPrice().toFixed(2)}€</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Garanties */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Nos garanties</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Shield className="text-green-600" size={20} />
                  <span className="text-sm">Paiement 100% sécurisé</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Truck className="text-blue-600" size={20} />
                  <span className="text-sm">Livraison rapide 2-3 jours</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CreditCard className="text-purple-600" size={20} />
                  <span className="text-sm">Retour gratuit 14 jours</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout
