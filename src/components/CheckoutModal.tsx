import React, { useState } from 'react';
import { CartItem } from '../types';

interface CheckoutModalProps {
  cart: CartItem[];
  onClose: () => void;
  onConfirm: (customerInfo: any) => void;
  updateQuantity?: (index: number, quantity: number) => void;
  removeFromCart?: (index: number) => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ 
  cart, 
  onClose, 
  onConfirm, 
  updateQuantity, 
  removeFromCart 
}) => {
  const [customerInfo, setCustomerInfo] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Calculer le prix réel d'un produit
  const calculateRealPrice = (item: CartItem) => {
    if (item.quantite_reference && item.quantite_reference > 0) {
      return (item.prix_reference / item.quantite_reference) * (item.quantite_reelle || item.quantite_reference);
    }
    return item.prix_reference;
  };

  // Calculer le total du panier
  const total = cart.reduce((sum, item) => {
    const realPrice = calculateRealPrice(item);
    const finalPrice = realPrice * (1 - (item.reduction || 0) / 100);
    return sum + (finalPrice * item.quantite_achat);
  }, 0);

  // Grouper les produits par catégorie avec leurs index globaux
  const groupedCartWithIndexes = cart.reduce((groups, item, globalIndex) => {
    const category = item.categorie || 'autres';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push({ ...item, globalIndex });
    return groups;
  }, {} as { [key: string]: (CartItem & { globalIndex: number })[] });

  // Noms des catégories avec emojis
  const categoryNames: { [key: string]: string } = {
    makeup: '💄 Maquillage',
    skincare: '🧴 Soins Visage',
    bodycare: '🧴 Soins Corps',
    haircare: '💇‍♀️ Cheveux',
    fragrance: '🌸 Parfums',
    accessories: '💎 Accessoires',
    autres: '📦 Autres'
  };

  // Validation des champs
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Au moins un champ doit être rempli
    const hasAnyField = Object.values(customerInfo).some(value => value.trim() !== '');
    
    if (!hasAnyField) {
      newErrors.general = 'Au moins un champ doit être rempli (nom, prénom, email, téléphone ou adresse)';
    }

    // Validation email si rempli
    if (customerInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    // Validation téléphone si rempli
    if (customerInfo.telephone && !/^[0-9+\s\-()]{8,}$/.test(customerInfo.telephone)) {
      newErrors.telephone = 'Format de téléphone invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onConfirm(customerInfo);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Finaliser la commande</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Récapitulatif du panier par catégorie */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Récapitulatif de votre commande</h3>
            <div className="space-y-4">
              {Object.entries(groupedCartWithIndexes).map(([category, items]) => (
                <div key={category} className="border rounded-lg p-3">
                  <h4 className="font-medium text-purple-600 mb-2">
                    {categoryNames[category] || category}
                  </h4>
                  <div className="space-y-2">
                    {items.map((item, idx) => {
                      const realPrice = calculateRealPrice(item);
                      const finalPrice = realPrice * (1 - (item.reduction || 0) / 100);
                      
                      return (
                        <div key={idx} className="flex justify-between items-center text-sm border-b pb-2 mb-2 last:border-b-0 last:pb-0 last:mb-0">
                          <div className="flex items-center space-x-3 flex-1">
                            {/* Miniature du produit */}
                            <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                              {item.image_url ? (
                                <img 
                                  src={item.image_url} 
                                  alt={item.nom}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.currentTarget as HTMLImageElement;
                                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAzNkMzMC42Mjc0IDM2IDM2IDMwLjYyNzQgMzYgMjRDMzYgMTcuMzcyNiAzMC42Mjc0IDEyIDI0IDEyQzE3LjM3MjYgMTIgMTIgMTcuMzcyNiAxMiAyNEMxMiAzMC42Mjc0IDE3LjM3MjYgMzYgMjQgMzZaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik0yNCAyOEMyNi4yMDkxIDI4IDI4IDI2LjIwOTEgMjggMjRDMjggMjEuNzkwOSAyNi4yMDkxIDIwIDI0IDIwQzIxLjc5MDkgMjAgMjAgMjEuNzkwOSAyMCAyNEMyMCAyNi4yMDkxIDIxLjc5MDkgMjggMjQgMjhaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                  📷
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="font-medium">{item.nom}</div>
                              <div className="text-gray-500">
                                {item.marque} • {finalPrice.toFixed(2)}€
                              </div>
                            </div>
                          </div>
                          
                          {/* Contrôles de quantité */}
                          <div className="flex items-center space-x-2 mx-3">
                            {updateQuantity && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.globalIndex, item.quantite_achat - 1)}
                                  className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 text-sm"
                                >
                                  −
                                </button>
                                <span className="w-8 text-center text-sm font-medium">{item.quantite_achat}</span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.globalIndex, item.quantite_achat + 1)}
                                  className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 text-sm"
                                >
                                  +
                                </button>
                              </>
                            )}
                            {removeFromCart && (
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.globalIndex)}
                                className="text-red-500 hover:text-red-700 text-xs ml-2"
                                title="Supprimer cet article"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                          
                          <div className="font-medium">
                            {(finalPrice * item.quantite_achat).toFixed(2)}€
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-3 mt-4">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total</span>
                <span className="text-purple-600">{total.toFixed(2)}€</span>
              </div>
            </div>
          </div>

          {/* Formulaire client */}
          <form onSubmit={handleSubmit}>
            <h3 className="text-lg font-semibold mb-3">Informations de livraison</h3>
            
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
                {errors.general}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom
                </label>
                <input
                  type="text"
                  value={customerInfo.prenom}
                  onChange={(e) => setCustomerInfo({...customerInfo, prenom: e.target.value})}
                  className="w-full p-2 border rounded focus:border-purple-500 focus:outline-none"
                  placeholder="Votre prénom"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  value={customerInfo.nom}
                  onChange={(e) => setCustomerInfo({...customerInfo, nom: e.target.value})}
                  className="w-full p-2 border rounded focus:border-purple-500 focus:outline-none"
                  placeholder="Votre nom"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                className={`w-full p-2 border rounded focus:border-purple-500 focus:outline-none ${
                  errors.email ? 'border-red-500' : ''
                }`}
                placeholder="votre@email.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                value={customerInfo.telephone}
                onChange={(e) => setCustomerInfo({...customerInfo, telephone: e.target.value})}
                className={`w-full p-2 border rounded focus:border-purple-500 focus:outline-none ${
                  errors.telephone ? 'border-red-500' : ''
                }`}
                placeholder="06 12 34 56 78"
              />
              {errors.telephone && (
                <p className="text-red-500 text-sm mt-1">{errors.telephone}</p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse de livraison
              </label>
              <textarea
                value={customerInfo.adresse}
                onChange={(e) => setCustomerInfo({...customerInfo, adresse: e.target.value})}
                className="w-full p-2 border rounded focus:border-purple-500 focus:outline-none"
                rows={3}
                placeholder="Votre adresse complète"
              />
            </div>

            <div className="text-sm text-gray-600 mb-4">
              💡 Vous devez remplir au moins un champ (nom, prénom, email, téléphone ou adresse)
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Confirmer la commande
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;