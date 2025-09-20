import React from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  // Calculer le prix réel
  const calculateRealPrice = () => {
    if (product.quantite_reference && product.quantite_reference > 0) {
      return (product.prix_reference / product.quantite_reference) * (product.quantite_reelle || product.quantite_reference);
    }
    return product.prix_reference;
  };

  const realPrice = calculateRealPrice();
  const finalPrice = realPrice * (1 - (product.reduction || 0) / 100);
  const stockQuantity = product.stock_unite || product.quantite_reelle || 0;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Image du produit */}
      <div className="relative h-48 bg-gray-100">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.nom}
            className="w-full h-full object-cover"
            crossOrigin="anonymous"
            onError={(e) => {
              console.log('❌ Erreur chargement image:', product.image_url);
              const target = e.currentTarget as HTMLImageElement;
              // Utiliser une image de fallback qui fonctionne
              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vbiBkaXNwb25pYmxlPC90ZXh0Pgo8L3N2Zz4K';
            }}
            onLoad={() => {
              console.log('✅ Image chargée avec succès:', product.image_url);
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-2">📷</div>
              <div className="text-sm">Pas d'image</div>
            </div>
          </div>
        )}
        
        {/* Badge réduction */}
        {product.reduction > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-bold">
            -{product.reduction}%
          </div>
        )}
      </div>

      {/* Contenu de la carte */}
      <div className="p-4">
        {/* En-tête */}
        <div className="mb-2">
          <h3 className="font-semibold text-lg text-gray-800 line-clamp-2">
            {product.nom}
          </h3>
          <p className="text-sm text-gray-600">{product.marque}</p>
        </div>

        {/* Informations quantité */}
        {product.quantite_reelle && product.quantite_reference && (
          <div className="mb-3 text-xs text-gray-500">
            <div>
              {product.quantite_reelle}ml/gr 
              {product.quantite_reelle !== product.quantite_reference && (
                <span> (réf: {product.quantite_reference}ml/gr)</span>
              )}
            </div>
          </div>
        )}

        {/* Prix */}
        <div className="mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-purple-600">
              {finalPrice.toFixed(2)}€
            </span>
            {product.reduction > 0 && (
              <span className="text-sm text-gray-500 line-through">
                {realPrice.toFixed(2)}€
              </span>
            )}
          </div>
          {realPrice !== product.prix_reference && (
            <div className="text-xs text-gray-500">
              Prix internet: {product.prix_reference.toFixed(2)}€
            </div>
          )}
        </div>

        {/* Stock et emplacement */}
        <div className="mb-3 text-sm text-gray-600">
          <div>Stock: {stockQuantity} unités</div>
          {product.emplacement_stock && (
            <div className="text-xs text-blue-600">📍 {product.emplacement_stock}</div>
          )}
        </div>

        {/* Description */}
        {product.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Bouton d'ajout */}
        <button
          onClick={() => onAddToCart(product)}
          disabled={stockQuantity <= 0}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors duration-300 ${
            stockQuantity <= 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {stockQuantity <= 0 
            ? 'Rupture de stock' 
            : 'Ajouter au panier'
          }
        </button>
      </div>
    </div>
  );
};

export default ProductCard;