import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CartItem } from '../types';

interface CartProps {
  cart: CartItem[];
  removeFromCart: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
}

const Cart: React.FC<CartProps> = ({ cart, removeFromCart, updateQuantity }) => {
  // Fonction pour calculer le prix réel d'un produit
  const calculateRealPrice = (item: CartItem) => {
    if (!item) return 0; // Sécurité
    if (item.quantite_reference && item.quantite_reference > 0) {
      return (item.prix_reference / item.quantite_reference) * (item.quantite_reelle || item.quantite_reference);
    }
    return item.prix_reference;
  };

  // Calculer le total du panier (Sécurité ajoutée sur .reduce)
  const total = (cart || []).reduce((sum, item) => {
    if (!item) return sum;
    const realPrice = calculateRealPrice(item);
    const finalPrice = realPrice * (1 - (item.reduction || 0) / 100);
    return sum + (finalPrice * (item.quantite_achat || 0));
  }, 0);

  return (
    <motion.div 
      className="bg-white/80 backdrop-blur-sm border border-purple-200 p-5 rounded-2xl shadow-xl mt-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"></div>
        <h3 className="text-xl font-bold text-gray-800">Mon Panier</h3>
        {cart?.length > 0 && (
          <span className="bg-purple-100 text-purple-700 text-sm px-2 py-1 rounded-full">
            {(cart || []).reduce((sum, item) => sum + (item.quantite_achat || 0), 0)} article{(cart || []).reduce((sum, item) => sum + (item.quantite_achat || 0), 0) > 1 ? 's' : ''}
          </span>
        )}
      </div>
      
      {(!cart || cart.length === 0) ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🛍️</div>
          <p>Votre panier est vide</p>
          <p className="text-sm mt-2">Cliquez sur un produit pour l'ajouter</p>
        </div>
      ) : (
        <AnimatePresence>
          {(cart || []).map((item, index) => {
            // Sécurité : vérifier que l'item existe
            if (!item) return null;

            const realPrice = calculateRealPrice(item);
            const finalPrice = realPrice * (1 - (item.reduction || 0) / 100);
            const itemTotal = finalPrice * (item.quantite_achat || 0);
            
            return (
              <motion.div 
                key={`${item.id}-${index}`}
                className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center gap-3 flex-1">
                  <img 
                    src={item.image_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAzNkMzMC42Mjc0IDM2IDM2IDMwLjYyNzQgMzYgMjRDMzYgMTcuMzcyNiAzMC42Mjc0IDEyIDI0IDEyQzE3LjM3MjYgMTIgMTIgMTcuMzcyNiAxMiAyNEMxMiAzMC42Mjc0IDE3LjM3MjYgMzYgMjQgMzZaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik0yNCAyOEMyNi4yMDkxIDI4IDI4IDI2LjIwOTEgMjggMjRDMjggMjEuNzkwOSAyNi4yMDkxIDIwIDI0IDIwQzIxLjc5MDkgMjAgMjAgMjEuNzkwOSAyMCAyNEMyMCAyNi4yMDkxIDIxLjc5MDkgMjggMjQgMjhaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPg=='}
                    alt={item.nom}
                    className="w-12 h-12 object-cover rounded-lg"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAzNkMzMC42Mjc0IDM2IDM2IDMwLjYyNzQgMzYgMjRDMzYgMTcuMzcyNiAzMC42Mjc0IDEyIDI0IDEyQzE3LjM3MjYgMTIgMTIgMTcuMzcyNiAxMiAyNEMxMiAzMC42Mjc0IDE3LjM3MjYgMzYgMjQgMzZaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik0yNCAyOEMyNi4yMDkxIDI4IDI4IDI2LjIwOTEgMjggMjRDMjggMjEuNzkwOSAyNi4yMDkxIDIwIDI0IDIwQzIxLjc5MDkgMjAgMjAgMjEuNzkwOSAyMCAyNEMyMCAyNi4yMDkxIDIxLjc5MDkgMjggMjQgMjhaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPg==';
                    }}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{item.nom}</div>
                    <div className="text-sm text-gray-500">{item.marque}</div>
                    <div className="text-xs text-gray-400">
                      {item.quantite_reelle && (
                        <span>{item.quantite_reelle}ml/gr • </span>
                      )}
                      {item.reduction > 0 ? (
                        <>
                          <span className="line-through">{realPrice.toFixed(2)}€</span>
                          <span className="ml-1">{finalPrice.toFixed(2)}€</span>
                          <span className="ml-1 text-red-500">(-{item.reduction}%)</span>
                        </>
                      ) : (
                        <span>{finalPrice.toFixed(2)}€</span>
                      )}
                      <span> × {item.quantite_achat}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuantity(index, (item.quantite_achat || 0) - 1);
                      }}
                      className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center text-sm"
                      disabled={(item.quantite_achat || 0) <= 1}
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantite_achat}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuantity(index, (item.quantite_achat || 0) + 1);
                      }}
                      className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center text-sm"
                    >
                      +
                    </button>
                  </div>
                  
                  <span className="font-bold text-purple-700 min-w-[60px] text-right">
                    {itemTotal.toFixed(2)}€
                  </span>
                  
                  <motion.button
                    className="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromCart(index);
                    }}
                  >
                    ✕
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}
      
      {(cart && cart.length > 0) && (
        <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
          <div className="flex justify-between items-center text-lg font-bold text-gray-800">
            <span>Total:</span>
            <span className="text-purple-700">{total.toFixed(2)} €</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Cart;