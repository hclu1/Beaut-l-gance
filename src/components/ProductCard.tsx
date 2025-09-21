import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const [showModal, setShowModal] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const calculateRealPrice = () => {
    if (product.quantite_reference && product.quantite_reference > 0) {
      return (product.prix_reference / product.quantite_reference) * (product.quantite_reelle || product.quantite_reference);
    }
    return product.prix_reference;
  };

  const realPrice = calculateRealPrice();
  const finalPrice = realPrice * (1 - (product.reduction || 0) / 100);
  const stockQuantity = product.stock_unite || product.quantite_reelle || 0;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      onAddToCart(product);
    }
    setShowModal(false);
    setQuantity(1);
  };

  return (
    <>
      {/* CARTE PRODUIT - IMAGE CORRIGÉE */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div className="relative h-48 bg-gray-100 cursor-pointer" onClick={() => setShowModal(true)}>
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.nom} 
              className="w-full h-full object-contain p-2 hover:scale-105 transition-transform duration-300" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">📷</div>
          )}
          {product.reduction > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-bold">
              -{product.reduction}%
            </div>
          )}
          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1 rounded-full">🔍</div>
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-lg text-gray-800 cursor-pointer hover:text-purple-600" onClick={() => setShowModal(true)}>
            {product.nom}
          </h3>
          <p className="text-sm text-gray-600">{product.marque}</p>
          
          <div className="mt-3 mb-3">
            <span className="text-xl font-bold text-purple-600">{finalPrice.toFixed(2)}€</span>
            {product.reduction > 0 && (
              <span className="text-sm text-gray-500 line-through ml-2">{realPrice.toFixed(2)}€</span>
            )}
          </div>

          <div className="mb-3 text-sm text-gray-600">
            <div>Stock: {stockQuantity} unités</div>
            {product.emplacement_stock && (
              <div className="text-xs text-blue-600">📍 {product.emplacement_stock}</div>
            )}
          </div>

          <button
            onClick={() => onAddToCart(product)}
            disabled={stockQuantity <= 0}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors duration-300 ${
              stockQuantity <= 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {stockQuantity <= 0 ? 'Rupture de stock' : 'Ajouter au panier'}
          </button>
        </div>
      </div>

      {/* MODAL - IMAGE ÉGALEMENT CORRIGÉE */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-xl max-w-4xl max-h-[90vh] overflow-y-auto w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                <div className="relative">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.nom} 
                        className="w-full h-full object-contain p-4" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">📷</div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{product.nom}</h2>
                      <p className="text-lg text-gray-600">{product.marque}</p>
                    </div>
                    <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
                  </div>

                  <div className="mb-6">
                    <span className="text-3xl font-bold text-purple-600">{finalPrice.toFixed(2)}€</span>
                    {product.reduction > 0 && (
                      <span className="text-xl text-gray-500 line-through ml-3">{realPrice.toFixed(2)}€</span>
                    )}
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-2">Disponibilité</h4>
                        <div className="text-sm">Stock: {stockQuantity} unités</div>
                        {product.emplacement_stock && (
                          <div className="text-sm">📍 {product.emplacement_stock}</div>
                        )}
                      </div>
                      
                      {product.quantite_reelle && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-blue-800 mb-2">Quantité</h4>
                          <div className="text-sm">{product.quantite_reelle}ml/gr</div>
                        </div>
                      )}
                    </div>

                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-orange-800 mb-2">Quantité à acheter</h4>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-8 h-8 bg-orange-200 hover:bg-orange-300 rounded-full flex items-center justify-center text-orange-800 font-bold"
                        >
                          -
                        </button>
                        <span className="text-lg font-semibold min-w-[3rem] text-center">{quantity}</span>
                        <button
                          onClick={() => setQuantity(Math.min(stockQuantity, quantity + 1))}
                          disabled={quantity >= stockQuantity}
                          className="w-8 h-8 bg-orange-200 hover:bg-orange-300 disabled:bg-gray-200 disabled:text-gray-400 rounded-full flex items-center justify-center text-orange-800 font-bold"
                        >
                          +
                        </button>
                        <div className="text-sm text-gray-600">
                          Total: <span className="font-semibold text-purple-600">{(finalPrice * quantity).toFixed(2)}€</span>
                        </div>
                      </div>
                    </div>

                    {product.description && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-2">Description</h4>
                        <div className="text-xs md:text-sm text-gray-600 whitespace-pre-wrap leading-relaxed break-words">
                          {product.description}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      onClick={() => setShowModal(false)}
                      className="py-2 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-300"
                    >
                      Continuer mes achats
                    </button>
                    <button
                      onClick={handleAddToCart}
                      disabled={stockQuantity <= 0}
                      className={`py-2 px-4 rounded-lg font-semibold transition-colors duration-300 ${
                        stockQuantity <= 0 ? 'bg-gray-300 text-gray-500' : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                    >
                      {stockQuantity <= 0 ? 'Rupture de stock' : `Ajouter ${quantity} au panier`}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ProductCard;