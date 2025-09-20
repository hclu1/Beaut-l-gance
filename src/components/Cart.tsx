import React from 'react';
import { CartItem } from '../types';

interface CartProps {
  cart: CartItem[];
  removeFromCart: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
}

const Cart: React.FC<CartProps> = ({ cart, removeFromCart, updateQuantity }) => {
  // Calculer le prix réel d'un produit
  const calculateRealPrice = (item: CartItem) => {
    if (item.quantite_reference && item.quantite_reference > 0) {
      return (item.prix_reference / item.quantite_reference) * (item.quantite_reelle || item.quantite_reference);
    }
    return item.prix_reference;
  };

  const total = cart.reduce((sum, item) => {
    const realPrice = calculateRealPrice(item);
    const finalPrice = realPrice * (1 - (item.reduction || 0) / 100);
    return sum + (finalPrice * item.quantite_achat);
  }, 0);

  if (cart.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Mon Panier</h2>
        <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm font-medium">
          {cart.length} article{cart.length > 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="space-y-4">
        {cart.map((item, index) => {
          const realPrice = calculateRealPrice(item);
          const finalPrice = realPrice * (1 - (item.reduction || 0) / 100);
          
          return (
            <div key={index} className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-gray-50">
              {/* Miniature du produit */}
              <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                {item.image_url ? (
                  <img 
                    src={item.image_url} 
                    alt={item.nom}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjMyIiBjeT0iMzIiIHI9IjE2IiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIvPgo8Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSI2IiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    📷
                  </div>
                )}
              </div>

              {/* Informations du produit */}
              <div className="flex-1">
                <h3 className="font-medium text-gray-800">{item.nom}</h3>
                <p className="text-sm text-gray-600">{item.marque}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-purple-600 font-semibold">
                    {finalPrice.toFixed(2)}€
                  </span>
                  {item.reduction > 0 && (
                    <span className="text-xs text-gray-500 line-through">
                      {realPrice.toFixed(2)}€
                    </span>
                  )}
                </div>
              </div>

              {/* Contrôles de quantité */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => updateQuantity(index, item.quantite_achat - 1)}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600"
                >
                  −
                </button>
                <span className="w-8 text-center font-medium">{item.quantite_achat}</span>
                <button
                  onClick={() => updateQuantity(index, item.quantite_achat + 1)}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600"
                >
                  +
                </button>
              </div>

              {/* Prix total et suppression */}
              <div className="text-right">
                <div className="font-semibold text-gray-800">
                  {(finalPrice * item.quantite_achat).toFixed(2)}€
                </div>
                <button
                  onClick={() => removeFromCart(index)}
                  className="text-red-500 hover:text-red-700 text-sm mt-1"
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="border-t pt-4 mt-4">
        <div className="flex justify-between items-center text-xl font-bold">
          <span>Total</span>
          <span className="text-purple-600">{total.toFixed(2)}€</span>
        </div>
      </div>
    </div>
  );
};

export default Cart;