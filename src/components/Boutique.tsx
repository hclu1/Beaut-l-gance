import React, { useState, useMemo } from 'react';
import { useProducts } from '../hooks/useProducts';
import CategoryFilter from './CategoryFilter';
import ProductList from './ProductList';

export default function Boutique() {
  const { products, loading } = useProducts();
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 🔎 Filtrage combiné : nom, marque ou emplacement + catégorie
  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (selectedCat && selectedCat !== 'all') {
      filtered = filtered.filter(
        (p) =>
          p.categorie?.toLowerCase() === selectedCat.toLowerCase()
      );
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.nom?.toLowerCase().includes(term) ||
          p.marque?.toLowerCase().includes(term) ||
          p.emplacement_stock?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [products, selectedCat, searchTerm]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8 text-gray-500">
        Chargement des produits...
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-center mb-6">
        🛍️ Boutique cosmétique
      </h1>

      {/* Barre de recherche */}
      <div className="flex justify-center mb-6">
        <input
          type="text"
          placeholder="Rechercher un produit, une marque ou un emplacement..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-full shadow-sm focus:ring-2 focus:ring-purple-400 focus:outline-none"
        />
      </div>

      {/* Filtres catégories */}
      <CategoryFilter selectedCat={selectedCat} setSelectedCat={setSelectedCat} />

      {/* Liste produits */}
      <ProductList products={filteredProducts} />
    </div>
  );
}
