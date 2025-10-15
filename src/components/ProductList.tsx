import { getOptimizedImageUrl, imagePresets } from '../lib/imageUtils';
import React from 'react';

export default function ProductList({ products }: { products: any[] }) {
  if (!products || products.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-600">
        Aucun produit trouvé.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {products.map((product) => (
        <div
          key={product.id}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
        >
          <div className="h-48 bg-gray-100 overflow-hidden">
            {product.image_url ? (
              <img
                src={getOptimizedImageUrl(product.image_url, imagePresets.card)}
                alt={product.nom || product.name}
                loading="lazy"
                className="w-full h-full object-contain p-2 hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                📷
              </div>
            )}
          </div>

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
          </div>
        </div>
      ))}
    </div>
  );
}
