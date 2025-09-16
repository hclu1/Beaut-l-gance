// components/FloatingCartIcon.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CartItem } from '../types';

interface FloatingCartIconProps {
  cart: CartItem[];
  onClick: () => void;
}

const FloatingCartIcon: React.FC<FloatingCartIconProps> = ({ cart, onClick }) => {
  const itemCount = cart.reduce((sum, item) => sum + item.quantite_achat, 0);
  
  if (itemCount === 0) return null;

  return (
    <motion.button
      className="fixed bottom-6 right-6 bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4 rounded-full shadow-2xl z-40 flex items-center gap-2"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
    >
      <div className="relative">
        🛒
        <motion.div
          className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          key={itemCount}
        >
          {itemCount}
        </motion.div>
      </div>
      <span className="hidden sm:block font-semibold">Panier</span>
    </motion.button>
  );
};

export default FloatingCartIcon;