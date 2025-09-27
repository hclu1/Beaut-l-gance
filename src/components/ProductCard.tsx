import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../types';
import { getOptimizedImageUrl, imagePresets } from '../lib/imageUtils';
import { ProductService } from '../services/ProductService';

interface ProductCardProps {
  product: Product;
  variants?: Product[];
  onAddToCart: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, variants = [], onAddToCart }) => {
  const [showModal, setShowModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<Product>(product);
  const [imageError, setImageError] = useState(false);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [allVariants, setAllVariants] = useState<Product[]>(variants);

  // Récupérer les variantes si non fournies en props
  useEffect(() => {
    const fetchVariants = async () => {
      if (variants.length === 0 && product.variant_id) {
        setLoadingVariants(true);
        try {
          const productVariants = await ProductService.getProductVariants(product.variant_id);
          setAllVariants(productVariants);
        } catch (error) {
          console.error('Erreur lors de la récupération des variantes:', error);
        } finally {
          setLoadingVariants(false);
        }
      }
    };

    fetchVariants();
  }, [product.variant_id, variants]);

  const calculateRealPrice = (productToCalculate: Product) => {
    if (productToCalculate.quantite_reference && productToCalculate.quantite_reference > 0) {
      return (productToCalculate.prix_reference / productToCalculate.quantite_reference) * (productToCalculate.quantite_reelle || productToCalculate.quantite_reference);
    }
    return productToCalculate.prix_reference;
  };

  const realPrice = calculateRealPrice(selectedVariant);
  const finalPrice = realPrice * (1 - (selectedVariant.reduction || 0) / 100);
  const stockQuantity = selectedVariant.stock_unite ?? 0;

  // URLs optimisées pour les différentes tailles
  const cardImageUrl = getOptimizedImageUrl(selectedVariant.image_url, imagePresets.card);
  const modalImageUrl = getOptimizedImageUrl(selectedVariant.image_url, imagePresets.modal);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      onAddToCart(selectedVariant);
    }
    setShowModal(false);
    setQuantity(1);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleVariantChange = (variantId: number) => {
    const variant = allVariants.find(v => v.id === variantId);
    if (variant) {
      setSelectedVariant(variant);
      setQuantity(1); // Réinitialiser la quantité lors du changement de variante
    }
  };

  // Vérifier s'il y a plusieurs variantes
  const hasMultipleVariants = allVariants.length > 1;

  return (
    <>
      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer" onClick={() => setShowModal(true)}>
        <div className="relative h-48 bg-gray-100">
          {cardImageUrl && !imageError ? (
            <img 
              src={cardImageUrl}
              alt={selectedVariant.nom} 
              className="w-full h-full object-contain p-2 hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">📷</div>
          )}
          {selectedVariant.reduction > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-bold">
              -{selectedVariant.reduction}%
            </div>
          )}
          {hasMultipleVariants && (
            <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-md text-sm font-bold">
              {allVariants.length} tailles
            </div>
          )}
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white p-1 rounded-full">🔍</div>
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-lg text-gray-800 hover:text-purple-600">
            {selectedVariant.nom}
          </h3>
          <p className="text-sm text-gray-600">{selectedVariant.marque}</p>
          
          {hasMultipleVariants && (
            <div className="mt-2">
              {/* Affichage conditionnel : boutons si <=3 variantes, menu déroulant sinon */}
              {allVariants.length <= 3 ? (
                <div className="flex flex-wrap gap-1">
                  {allVariants.map((variant) => (
                    <button
                      key={variant.id}
                      className={`px-2 py-1 text-xs rounded-md border ${
                        selectedVariant.id === variant.id
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVariantChange(variant.id);
                      }}
                    >
                      {variant.quantite_reelle}ml/gr
                    </button>
                  ))}
                </div>
              ) : (
                <select
                  value={selectedVariant.id}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleVariantChange(parseInt(e.target.value));
                  }}
                  className="w-full p-2 border rounded text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  {allVariants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.quantite_reelle}ml/gr - {calculateRealPrice(variant).toFixed(2)}€
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
          
          <div className="mt-3">
            <span className="text-xl font-bold text-purple-600">{finalPrice.toFixed(2)}€</span>
            {selectedVariant.reduction > 0 && (
              <span className="text-sm text-gray-500 line-through ml-2">{realPrice.toFixed(2)}€</span>
            )}
          </div>
        </div>
      </div>

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
                    {modalImageUrl && !imageError ? (
                      <img 
                        src={modalImageUrl}
                        alt={selectedVariant.nom} 
                        className="w-full h-full object-contain p-2"
                        onError={handleImageError}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">📷</div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-gray-800">{selectedVariant.nom}</h2>
                  <p className="text-gray-600">{selectedVariant.marque}</p>
                  
                  {/* Menu déroulant des quantités avec prix */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantité
                    </label>
                    {/* Affichage conditionnel : boutons si <=3 variantes, menu déroulant sinon */}
                    {allVariants.length <= 3 ? (
                      <div className="flex flex-wrap gap-2">
                        {allVariants.map((variant) => (
                          <button
                            key={variant.id}
                            className={`px-4 py-2 rounded-md border ${
                              selectedVariant.id === variant.id
                                ? 'bg-purple-600 text-white border-purple-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                            onClick={() => {
                              setSelectedVariant(variant);
                              setQuantity(1);
                            }}
                          >
                            {variant.quantite_reelle}ml/gr - {calculateRealPrice(variant).toFixed(2)}€
                          </button>
                        ))}
                      </div>
                    ) : (
                      <select
                        value={selectedVariant.id}
                        onChange={(e) => {
                          const variant = allVariants.find(v => v.id === parseInt(e.target.value));
                          if (variant) {
                            setSelectedVariant(variant);
                            setQuantity(1);
                          }
                        }}
                        className="w-full p-2 border rounded"
                      >
                        {allVariants.map((variant) => (
                          <option key={variant.id} value={variant.id}>
                            {variant.quantite_reelle}ml/gr - {calculateRealPrice(variant).toFixed(2)}€
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Quantité d'achat */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantité d'achat
                    </label>
                    <div className="flex items-center">
                      <button
                        className="px-3 py-1 bg-gray-200 rounded-l-md hover:bg-gray-300"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={stockQuantity}
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Math.min(stockQuantity, parseInt(e.target.value) || 1)))}
                        className="w-16 text-center border-t border-b border-gray-300"
                      />
                      <button
                        className="px-3 py-1 bg-gray-200 rounded-r-md hover:bg-gray-300"
                        onClick={() => setQuantity(Math.min(stockQuantity, quantity + 1))}
                      >
                        +
                      </button>
                      <span className="ml-4 text-sm text-gray-500">
                        Stock: {stockQuantity}
                      </span>
                    </div>
                  </div>

                  {/* Prix */}
                  <div className="mt-4">
                    <span className="text-2xl font-bold text-purple-600">{finalPrice.toFixed(2)}€</span>
                    {selectedVariant.reduction > 0 && (
                      <span className="text-sm text-gray-500 line-through ml-2">{realPrice.toFixed(2)}€</span>
                    )}
                  </div>

                  {/* Boutons d'action */}
                  <div className="mt-6 flex gap-3">
                    <button
                      className="flex-1 py-3 px-6 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowModal(false)}
                    >
                      Continuer mes achats
                    </button>
                    <button
                      className="flex-1 py-3 px-6 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                      onClick={handleAddToCart}
                      disabled={stockQuantity === 0}
                    >
                      Ajouter {quantity} au panier
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