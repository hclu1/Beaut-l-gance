import React from 'react';

interface CategoryFilterProps {
  selectedCat: string | null;
  setSelectedCat: (category: string | null) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ selectedCat, setSelectedCat }) => {
  const categories = [
    { id: null, name: 'Tous', emoji: '🛍️' },
    { id: 'makeup', name: 'Maquillage', emoji: '💄' },
    { id: 'skincare', name: 'Soins Visage', emoji: '🧴' },
    { id: 'bodycare', name: 'Soins Corps', emoji: '🧴' },
    { id: 'haircare', name: 'Cheveux', emoji: '💇‍♀️' },
    { id: 'fragrance', name: 'Parfums', emoji: '🌸' },
    { id: 'accessories', name: 'Accessoires', emoji: '💎' }
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-8 justify-center">
      {categories.map((category) => (
        <button
          key={category.id || 'all'}
          onClick={() => setSelectedCat(category.id)}
          className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
            selectedCat === category.id
              ? 'bg-purple-600 text-white shadow-lg transform scale-105'
              : 'bg-white text-gray-700 shadow-md hover:shadow-lg hover:bg-purple-50'
          }`}
        >
          <span className="mr-2">{category.emoji}</span>
          {category.name}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;