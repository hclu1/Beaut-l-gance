
import React from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'

const Cart: React.FC = () => {
  const navigate = useNavigate()
  const { cartItems, updateQuantity, removeFromCart, getTotalPrice, getTotalItems } = useCart()

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-pink-600 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Retour à la boutique</span>
            </button>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="text-6xl mb-6">🛒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Votre panier est vide</h2>
          <p className="text-gray-600 mb-8">Découvrez nos produits et ajoutez-les à votre panier</p>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-3 rounded-full font-semibold hover:from-pink-600 hover:to-rose-600 transition-all"
          >
            Découvrir nos produits
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
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-pink-600 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Continuer mes achats</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Mon Panier</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Articles du panier */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Articles ({getTotalItems()})
            </h2>

            {cartItems.map((item) => (
              <motion.div
                key={item.productId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-lg shadow-sm p-6"
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{item.name}</h3>
                    <p className="text-pink-600 font-bold">{item.price.toFixed(2)}€</p>
                    <p className="text-sm text-gray-500">Stock disponible: {item.stock}</p>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Contrôles de quantité */}
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="p-2 hover:bg-gray-100 transition-colors"
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="px-4 py-2 font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="p-2 hover:bg-gray-100 transition-colors"
                        disabled={item.quantity >= item.stock}
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    {/* Supprimer */}
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="text-red-500 hover:text-red-700 transition-colors p-2"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Sous-total: {(item.price * item.quantity).toFixed(2)}€
                  </span>
                  {item.quantity > item.stock && (
                    <span className="text-red-500 text-sm">
                      ⚠️ Quantité supérieure au stock disponible
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Résumé de commande */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Résumé de commande</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sous-total</span>
                  <span className="font-medium">{getTotalPrice().toFixed(2)}€</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Livraison</span>
                  <span className="font-medium text-green-600">Gratuite</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-pink-600">{getTotalPrice().toFixed(2)}€</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 px-6 rounded-full font-semibold hover:from-pink-600 hover:to-rose-600 transition-all flex items-center justify-center space-x-2"
              >
                <ShoppingBag size={20} />
                <span>Passer commande</span>
              </button>

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500">
                  🔒 Paiement 100% sécurisé
                </p>
                <p className="text-sm text-gray-500">
                  🚚 Livraison gratuite dès 30€
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
