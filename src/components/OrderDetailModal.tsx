// components/OrderDetailModal.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Order } from '../types';
import { getStatusColor, getStatusLabel } from '../utils';

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: string) => void;
  onToggleItemPrepared: (orderId: string, itemId: string) => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ 
  order, 
  onClose, 
  onUpdateStatus, 
  onToggleItemPrepared 
}) => {
  const isItemPrepared = (itemId: string) => {
    return order.preparedItems?.[itemId] || false;
  };

  const preparedCount = order.items.reduce((count, item) => {
    return count + (isItemPrepared(item.id) ? item.quantite_achat : 0);
  }, 0);

  const totalItems = order.items.reduce((sum, item) => sum + item.quantite_achat, 0);

  return (
    <motion.div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-auto"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-blue-800 text-center flex-1">Détail Commande #{order.id}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl ml-4"
          >
            ✕
          </button>
        </div>

        {/* Informations générales */}
        <div className="bg-blue-50 p-4 rounded-xl mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-center">
            <div>
              <div className="text-sm text-gray-600">Date de commande</div>
              <div className="font-semibold">{order.date}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Statut</div>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {getStatusLabel(order.status)}
              </span>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total commande</div>
              <div className="font-bold text-lg text-blue-700">{order.total.toFixed(2)}€</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Mode de paiement</div>
              <div className="font-semibold">{order.paymentMode}</div>
            </div>
          </div>
        </div>

        {/* Coordonnées client */}
        {order.customerInfo && (
          <div className="bg-green-50 p-4 rounded-xl mb-6 border-l-4 border-green-400">
            <h4 className="font-semibold text-green-800 mb-3 flex items-center justify-center gap-2">
              👤 Informations Client
            </h4>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-center gap-3">
                <span className="text-green-600">👤</span>
                <div className="text-center">
                  <span className="font-medium text-sm">Nom:</span>
                  <span className="ml-2">
                    {order.customerInfo.nom && order.customerInfo.prenom 
                      ? `${order.customerInfo.prenom} ${order.customerInfo.nom}`
                      : order.customerInfo.nom || order.customerInfo.prenom || 'Non renseigné'
                    }
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-3">
                <span className="text-green-600">📧</span>
                <div className="text-center">
                  <span className="font-medium text-sm">Email:</span>
                  <span className="ml-2">{order.customerInfo.email || 'Non renseigné'}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-3">
                <span className="text-green-600">📱</span>
                <div className="text-center">
                  <span className="font-medium text-sm">Téléphone:</span>
                  <span className="ml-2">{order.customerInfo.phone || 'Non renseigné'}</span>
                </div>
              </div>
              
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-green-600">📍</span>
                  <span className="font-medium text-sm">Adresse de livraison:</span>
                </div>
                <div className="p-2 bg-white rounded border text-sm text-center max-w-xs">
                  {order.customerInfo.address || 'Non renseignée'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progression de préparation */}
        <div className="bg-orange-50 p-4 rounded-xl mb-6 border-l-4 border-orange-400">
          <h4 className="font-semibold text-orange-800 mb-3 flex items-center justify-center gap-2">
            📋 Progression de préparation
          </h4>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-700 mb-2">
              {preparedCount} / {totalItems}
            </div>
            <div className="text-sm text-orange-600">
              articles préparés
            </div>
            <div className="w-full bg-orange-200 rounded-full h-3 mt-3">
              <div 
                className="bg-orange-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${totalItems > 0 ? (preparedCount / totalItems) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Produits de la commande */}
        <div className="bg-purple-50 p-4 rounded-xl mb-6">
          <h4 className="font-semibold text-purple-800 mb-4 flex items-center justify-center gap-2">
            📦 Produits à préparer ({totalItems} articles)
          </h4>
          <div className="space-y-3">
            {order.items.map((item, index) => {
              const isPrepared = isItemPrepared(item.id);
              return (
                <div key={index} className={`bg-white p-4 rounded-lg border-2 transition-all duration-300 ${
                  isPrepared ? 'border-green-400 bg-green-50' : 'border-gray-200'
                }`}>
                  <div className="flex items-center gap-4">
                    <motion.button
                      onClick={() => onToggleItemPrepared(order.id, item.id)}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                        isPrepared 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
                      }`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title={isPrepared ? 'Marquer comme non préparé' : 'Marquer comme préparé'}
                    >
                      {isPrepared && <span className="text-lg">✓</span>}
                    </motion.button>

                    <img 
                      src={item.image} 
                      alt={item.nom}
                      className={`w-16 h-16 object-cover rounded-lg transition-all duration-300 ${
                        isPrepared ? 'opacity-75' : ''
                      }`}
                    />
                    
                    <div className="flex-1 text-center">
                      <h5 className={`font-semibold transition-all duration-300 ${
                        isPrepared ? 'text-green-700 line-through' : 'text-gray-800'
                      }`}>
                        {item.nom}
                      </h5>
                      <p className="text-sm text-gray-600">{item.marque} - {item.categorie}</p>
                      <div className="flex flex-col items-center gap-2 mt-2 text-sm">
                        <span>Quantité: <strong className="text-purple-600">{item.quantite_achat}</strong></span>
                        <span>Emplacement: <strong className="text-red-600 bg-red-100 px-2 py-1 rounded">{item.emplacement}</strong></span>
                      </div>
                    </div>

                    <div className="text-center">
                      {isPrepared ? (
                        <div className="text-green-600 font-semibold text-sm">
                          ✅ Préparé
                        </div>
                      ) : (
                        <div className="text-orange-600 font-semibold text-sm">
                          ⏳ À préparer
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions de gestion */}
        <div className="bg-gray-50 p-4 rounded-xl">
          <h4 className="font-semibold text-gray-800 mb-3 text-center">Actions de gestion</h4>
          <div className="flex flex-col gap-3">
            {order.status === 'pending' && (
              <button
                onClick={() => onUpdateStatus(order.id, 'preparing')}
                className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                🔄 Commencer préparation
              </button>
            )}
            {order.status === 'preparing' && (
              <button
                onClick={() => onUpdateStatus(order.id, 'ready')}
                className="w-full bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                disabled={preparedCount < totalItems}
                title={preparedCount < totalItems ? 'Tous les produits doivent être préparés' : 'Marquer comme prêt'}
              >
                ✅ Marquer comme prêt {preparedCount < totalItems && `(${preparedCount}/${totalItems})`}
              </button>
            )}
            {order.status === 'ready' && (
              <button
                onClick={() => onUpdateStatus(order.id, 'delivered')}
                className="w-full bg-purple-500 text-white px-4 py-3 rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
              >
                🚚 Marquer comme livré
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full bg-gray-500 text-white px-4 py-3 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default OrderDetailModal;