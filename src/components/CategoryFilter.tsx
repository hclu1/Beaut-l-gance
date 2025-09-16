// components/CategoryFilter.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { categories } from '../constants';

interface CategoryFilterProps {
  selectedCat: string | null;
  setSelectedCat: (cat: string | null) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ selectedCat, setSelectedCat }) => {
  return (
    <div className="flex flex-wrap gap-2 mb-6 justify-center">
      {categories.map((cat, index) => (
        <motion.button
          key={cat}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
            selectedCat === cat 
              ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg" 
              : "bg-white/80 text-gray-700 hover:bg-purple-100 border border-purple-200"
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSelectedCat(selectedCat === cat ? null : cat)}
        >
          {cat}
        </motion.button>
      ))}
      {selectedCat && (
        <motion.button
          className="rounded-full px-4 py-2 text-sm font-semibold bg-gray-200 text-gray-600 hover:bg-gray-300"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => setSelectedCat(null)}
        >
          Tous les produits
        </motion.button>
      )}
    </div>
  );
};

export default CategoryFilter;