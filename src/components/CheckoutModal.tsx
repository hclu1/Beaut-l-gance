// components/CheckoutModal.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CartItem } from '../types';

interface CheckoutModalProps {
  cart: CartItem[];
  onClose: () => void;
  onConfirm: (customerInfo: any) => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ cart, onClose, onConfirm }) => {
  const [customerInfo, setCustomerInfo] = useState({
    nom: '',
    prenom: '',
    email: '',
    phone: '',
    address: ''
  });

  const total = cart.reduce((sum, item) => 
    sum + (item.prix_reference * (1 - item.reduction / 100) * item.quantite_achat), 0
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(customerInfo);
  };

  return (
    <motion.div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-purple-800">Finaliser la commande</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Résumé commande */}
        <div className="bg-purple-50 p-4 rounded-xl mb-6">
          <h4 className="font-semibold text-purple-800 mb-3">Votre commande</h4>
          <div className="space-y-2 mb-4">
            {cart.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span>{item.nom} × {item.quantite_achat}</span>
                <span className="font-semibold">
                  {(item.prix_reference * (1 - item.reduction / 100) * item.quantite_achat).toFixed(2)}€
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-purple-200 pt-2">
            <div className="flex justify-between items-center font-bold text-lg">
              <span>Total:</span>
              <span className="text-purple-700">{total.toFixed(2)}€</span>
            </div>
          </div>
        </div>

        {/* Formulaire informations client */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom (optionnel)
              </label>
              <input
                type="text"
                value={customerInfo.nom}
                onChange={(e) => setCustomerInfo({...customerInfo, nom: e.target.value})}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Votre nom"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prénom (optionnel)
              </label>
              <input
                type="text"
                value={customerInfo.prenom}
                onChange={(e) => setCustomerInfo({...customerInfo, prenom: e.target.value})}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Votre prénom"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email (optionnel)
            </label>
            <input
              type="email"
              value={customerInfo.email}
              onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="votre@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Téléphone (optionnel)
            </label>
            <input
              type="tel"
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="06 12 34 56 78"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse de livraison (optionnel)
            </label>
            <textarea
              value={customerInfo.address}
              onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
              placeholder="123 Rue de la Beauté, 75001 Paris"
            />
          </div>

          {/* Mode de paiement */}
          <div className="bg-green-50 p-4 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
                💰
              </div>
              <div>
                <div className="font-semibold text-green-800">Paiement en espèces</div>
                <div className="text-sm text-green-600">Commande payée à la livraison</div>
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-semibold"
            >
              Confirmer la commande
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default CheckoutModal;