import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../types';
import { getOptimizedImageUrl, imagePresets } from '../lib/imageUtils';
import { ProductService } from '../services/productService';

interface ProductCardProps {
  product: Product;
  variants?: Product[];
  onAddToCart: (product: Product) => void;
}

// 🚀 OPTIMISATION: Mémoriser le composant avec React.memo
const ProductCard: React.FC<ProductCardProps> = React.memo(({ product, variants = [], onAddToCart }) => {
  const [showModal, setShowModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<Product>(product);
  const [imageError, setImageError] = useState(false);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [allVariants, setAllVariants] = useState<Product[]>(variants);
  const [showFullDescription, setShowFullDescription] = useState(false);

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

  // 🚀 OPTIMISATION: Mémoriser la fonction de calcul de prix
  const calculateRealPrice = useCallback((prod: Product) => {
    if (prod.quantite_reference && prod.quantite_reference > 0 && prod.quantite_reelle) {
      return (prod.prix_reference / prod.quantite_reference) * prod.quantite_reelle;
    }
    return prod.prix_reference || 0;
  }, []);

  // 🚀 OPTIMISATION: Mémoriser les calculs de prix
  const { basePrice, finalPrice, reduction, stockQuantity } = useMemo(() => {
    const base = calculateRealPrice(selectedVariant);
    const red = selectedVariant.reduction || 0;
    const final = base * (1 - red / 100);
    const stock = selectedVariant.stock_unite ?? 0;

    return {
      basePrice: base,
      finalPrice: final,
      reduction: red,
      stockQuantity: stock
    };
  }, [selectedVariant, calculateRealPrice]);

  // 🚀 OPTIMISATION: Mémoriser les URLs d'images
  const { cardImageUrl, modalImageUrl } = useMemo(() => ({
    cardImageUrl: getOptimizedImageUrl(selectedVariant.image_url, imagePresets.card),
    modalImageUrl: getOptimizedImageUrl(selectedVariant.image_url, imagePresets.modal)
  }), [selectedVariant.image_url]);

  const handleImageError = useCallback(() => setImageError(true), []);

  // 🚀 OPTIMISATION: Mémoriser le handler de changement de variante
  const handleVariantChange = useCallback((variantId: number) => {
    const variant = allVariants.find(v => v.id === variantId);
    if (variant) {
      setSelectedVariant(variant);
      setQuantity(1);
    }
  }, [allVariants]);

  const hasMultipleVariants = allVariants.length > 1;

  // 🚀 OPTIMISATION: Mémoriser la description tronquée
  const truncatedDescription = useMemo(() =>
    selectedVariant.description ? selectedVariant.description.slice(0, 150) : '',
    [selectedVariant.description]
  );

  // 🚀 OPTIMISATION: Mémoriser le handler d'ajout au panier
  const handleAddToCart = useCallback(() => {
    for (let i = 0; i < quantity; i++) {
      onAddToCart(selectedVariant);
    }
    setShowModal(false);
    setQuantity(1);
  }, [quantity, selectedVariant, onAddToCart]);

  return (
    <>
      {/* --- CARD --- */}
      <div
        className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
        onClick={() => setShowModal(true)}
      >
        <div className="relative h-48 bg-gray-100">
          {cardImageUrl && !imageError ? (
            <img
              src={cardImageUrl}
              alt={selectedVariant.nom}
              className="w-full h-full object-contain p-2 hover:scale-105 transition-transform duration-300"
              loading="lazy"
              decoding="async"
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">📷</div>
          )}

          {reduction > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-bold">
              -{reduction}%
            </div>
          )}

          {hasMultipleVariants && (
            <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-md text-sm font-bold">
              {allVariants.length} tailles
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-lg text-gray-800 hover:text-purple-600">
            {selectedVariant.nom}
          </h3>
          <p className="text-sm text-gray-600">{selectedVariant.marque}</p>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-bold text-purple-600">{finalPrice.toFixed(2)}€</span>
            {reduction > 0 && (
              <span className="text-sm text-gray-500 line-through">{basePrice.toFixed(2)}€</span>
            )}
            {selectedVariant.quantite_reelle && (
              <span className="text-sm text-gray-500">/ {selectedVariant.quantite_reelle}ml</span>
            )}
          </div>
        </div>
      </div>

      {/* --- MODAL --- */}
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
                        loading="eager"
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

                  {hasMultipleVariants && (
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Quantité :</label>
                      <select
                        value={selectedVariant.id}
                        onChange={(e) => handleVariantChange(Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-purple-500"
                      >
                        {allVariants.map((v) => {
                          const variantBasePrice = calculateRealPrice(v);
                          const variantReduction = v.reduction || 0;
                          const variantFinalPrice = variantBasePrice * (1 - variantReduction / 100);

                          return (
                            <option key={v.id} value={v.id}>
                              {v.quantite_reelle}ml - {variantFinalPrice.toFixed(2)}€
                              {variantReduction > 0 && ` (-${variantReduction}%)`}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}

                  {selectedVariant.description && (
                    <div className="text-gray-700 text-sm leading-relaxed">
                      {showFullDescription
                        ? selectedVariant.description
                        : truncatedDescription + (selectedVariant.description.length > 150 ? '...' : '')}

                      {selectedVariant.description.length > 150 && (
                        <button
                          onClick={() => setShowFullDescription(!showFullDescription)}
                          className="block mt-2 text-purple-600 font-medium hover:underline"
                        >
                          {showFullDescription ? 'Voir moins ▲' : 'Voir plus ▼'}
                        </button>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-purple-600">{finalPrice.toFixed(2)}€</span>
                    {reduction > 0 && (
                      <span className="text-sm text-gray-500 line-through">{basePrice.toFixed(2)}€</span>
                    )}
                    {selectedVariant.quantite_reelle && (
                      <span className="text-sm text-gray-500">pour {selectedVariant.quantite_reelle}ml</span>
                    )}
                  </div>

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
}, (prevProps, nextProps) => {
  // 🚀 OPTIMISATION: Comparateur custom pour React.memo
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.stock_unite === nextProps.product.stock_unite &&
    prevProps.product.reduction === nextProps.product.reduction &&
    (prevProps.variants ?? []).length === (nextProps.variants ?? []).length
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
