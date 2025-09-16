// components/ProductCard.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const prixFinal = product.prix_reference * (1 - product.reduction / 100);
  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  const handleClick = async () => {
    if (product.quantite_reelle <= 0) {
      alert('Produit en rupture de stock');
      return;
    }
    
    setIsAdding(true);
    onAddToCart(product);
    
    setTimeout(() => setIsAdding(false), 600);
  };

  return (
    <motion.div 
      className="rounded-2xl shadow-xl p-4 bg-gradient-to-br from-pink-50 via-white to-purple-100 border border-pink-200 mb-4 flex flex-col overflow-hidden relative cursor-pointer"
      whileHover={{ scale: 1.02, y: -5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleClick}
      transition={{ type: "spring", stiffness: 300 }}
      animate={isAdding ? { scale: 1.05 } : { scale: 1 }}
    >
      {product.reduction > 0 && (
        <div className="absolute top-2 right-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
          -{product.reduction}%
        </div>
      )}
      
      <div className="relative overflow-hidden rounded-xl mb-3">
        <motion.img
          src={product.image}
          alt={product.nom}
          className="w-full h-40 object-cover"
          animate={{ scale: isHovered ? 1.1 : 1 }}
          transition={{ duration: 0.3 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
        
        <AnimatePresence>
          {isAdding && (
            <motion.div
              className="absolute inset-0 bg-green-500/80 flex items-center justify-center rounded-xl"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <div className="text-white text-2xl">✓</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="flex-1">
        <h3 className="font-bold text-lg text-gray-800 mb-1 leading-tight">{product.nom}</h3>
        <p className="text-sm text-purple-600 font-medium mb-2">{product.marque}</p>
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{product.description}</p>
        
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl text-purple-700">{prixFinal.toFixed(2)} €</span>
            {product.reduction > 0 && (
              <span className="line-through text-gray-400 text-sm">{product.prix_reference} €</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>Stock: {product.quantite_reelle}</span>
          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full">{product.categorie}</span>
        </div>
      </div>
      
      <div className="text-center py-2">
        {product.quantite_reelle > 0 ? (
          <div className="text-purple-600 font-medium text-sm flex items-center justify-center gap-2">
            🛒 Cliquez pour ajouter au panier
          </div>
        ) : (
          <div className="text-red-500 font-medium text-sm">
            ❌ Rupture de stock
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProductCard;