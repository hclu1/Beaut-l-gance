import { getOptimizedImageUrl, imagePresets } from '../lib/imageUtils';
import React from 'react';
import { useProducts } from '../hooks/useProducts';

export default function ProductList() {
  const { products, loading } = useProducts();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {products.map(product => (
        <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
          {/* Image optimisée */}
          <div className="h-48 bg-gray-100 overflow-hidden">
            {product.image_url ? (
              <img 
                src={getOptimizedImageUrl(product.image_url, imagePresets.card)}
                alt={product.nom || product.name}
                loading="lazy"
                className="w-full h-full object-contain p-2 hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                  e.currentTarget.parentElement!.innerHTML = '<div class="text-gray-400 text-4xl">📷</div>';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">📷</div>
            )}
          </div>

          {/* Informations produit */}
          <div className="p-4">
            <h3 className="font-semibold text-lg text-gray-800 mb-1 truncate">
              {product.nom || product.name}
            </h3>
            
            {product.marque && (
              <p className="text-sm text-gray-600 mb-2">{product.marque}</p>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-purple-600">
                {product.prix_reference || product.price} €
              </span>
              
              {(product.stock_unite || product.quantite_reelle) && (
                <span className="text-xs text-gray-500">
                  Stock: {product.stock_unite || product.quantite_reelle}
                </span>
              )}
            </div>

            {/* Réduction si applicable */}
            {product.reduction > 0 && (
              <div className="mt-2 flex items-center space-x-2">
                <span className="text-sm bg-red-500 text-white px-2 py-1 rounded">
                  -{product.reduction}%
                </span>
                <span className="text-sm text-gray-500 line-through">
                  Prix initial
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}