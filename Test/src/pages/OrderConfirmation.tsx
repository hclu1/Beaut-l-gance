
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, Package, Truck, Home } from 'lucide-react'
import { useOrders } from '../hooks/useOrders'

const OrderConfirmation: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const { orders } = useOrders()
  
  const [order, setOrder] = useState<any>(null)

  useEffect(() => {
    if (orderId && orders.length > 0) {
      const foundOrder = orders.find(o => o.orderId === orderId)
      setOrder(foundOrder)
    }
  }, [orderId, orders])

  if (!order) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de votre commande...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-pink-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="mb-6">
            <CheckCircle size={80} className="text-green-500 mx-auto" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Commande confirmée !
          </h1>
          
          <p className="text-xl text-gray-600 mb-2">
            Merci pour votre commande, {order.customerInfo.name}
          </p>
          
          <p className="text-gray-500">
            Numéro de commande: <span className="font-semibold text-pink-600">{order.orderId}</span>
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Détails de la commande */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Détails de votre commande</h2>
            
            <div className="space-y-4">
              {order.items.map((item: any, index: number) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">{item.name}</h3>
                    <p className="text-sm text-gray-600">Quantité: {item.quantity}</p>
                  </div>
                  <span className="font-semibold text-pink-600">
                    {(item.price * item.quantity).toFixed(2)}€
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t mt-6 pt-6">
              <div className="flex justify-between text-xl font-bold">
                <span>Total payé</span>
                <span className="text-pink-600">{order.totalAmount.toFixed(2)}€</span>
              </div>
            </div>
          </motion.div>

          {/* Informations de livraison */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Informations de livraison</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Adresse de livraison</h3>
                <div className="text-gray-600">
                  <p>{order.customerInfo.name}</p>
                  <p>{order.customerInfo.address.street}</p>
                  <p>{order.customerInfo.address.postalCode} {order.customerInfo.address.city}</p>
                  <p>{order.customerInfo.address.country}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Contact</h3>
                <div className="text-gray-600">
                  <p>📧 {order.customerInfo.email}</p>
                  <p>📞 {order.customerInfo.phone}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Étapes de livraison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-lg p-6 mt-8"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Suivi de votre commande</h2>
          
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white mb-2">
                <CheckCircle size={24} />
              </div>
              <span className="text-sm font-medium text-green-600">Confirmée</span>
              <span className="text-xs text-gray-500">Maintenant</span>
            </div>
            
            <div className="flex-1 h-1 bg-gray-200 mx-4"></div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 mb-2">
                <Package size={24} />
              </div>
              <span className="text-sm font-medium text-gray-400">Préparation</span>
              <span className="text-xs text-gray-500">1-2 jours</span>
            </div>
            
            <div className="flex-1 h-1 bg-gray-200 mx-4"></div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 mb-2">
                <Truck size={24} />
              </div>
              <span className="text-sm font-medium text-gray-400">Expédition</span>
              <span className="text-xs text-gray-500">2-3 jours</span>
            </div>
            
            <div className="flex-1 h-1 bg-gray-200 mx-4"></div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 mb-2">
                <Home size={24} />
              </div>
              <span className="text-sm font-medium text-gray-400">Livraison</span>
              <span className="text-xs text-gray-500">3-4 jours</span>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <p className="text-gray-600 mb-6">
            Vous recevrez un email de confirmation avec tous les détails de votre commande.
          </p>
          
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-3 rounded-full font-semibold hover:from-pink-600 hover:to-rose-600 transition-all"
          >
            Continuer mes achats
          </button>
        </motion.div>
      </div>
    </div>
  )
}

export default OrderConfirmation
