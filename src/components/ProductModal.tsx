// components/ProductModal.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Product } from '../types';
import { categories } from '../constants';
import ImageCapture from './ImageCapture';

interface ProductModalProps {
  product?: Product | null;
  onSave: (productData: Product) => void;
  onClose: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, onSave, onClose }) => {
  const [formData, setFormData] = useState(product || {
    id: '',
    nom: '',
    marque: '',
    categorie: categories[0],
    prix_reference: '0',
    quantite_web: '0',
    quantite_reelle: '0',
    stock: '0',
    reduction: '0',
    description: '',
    emplacement: '',
    image: 'https://images.pexels.com/photos/2533266/pexels-photo-2533266.jpeg?auto=compress&cs=tinysrgb&w=400'
  });

  const calculateFinalPrice = () => {
    const prixRef = parseFloat(formData.prix_reference) || 0;
    const qtyWeb = parseFloat(formData.quantite_web) || 0;
    const qtyReelle = parseFloat(formData.quantite_reelle) || 0;
    const reduction = parseFloat(formData.reduction) || 0;

    if (qtyWeb > 0 && qtyReelle > 0 && prixRef > 0) {
      const prixProrata = (prixRef * qtyReelle) / qtyWeb;
      const prixFinal = prixProrata * (1 - reduction / 100);
      return prixFinal.toFixed(2);
    }
    return '0.00';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom || !formData.marque) {
      alert('Veuillez remplir les champs obligatoires');
      return;
    }
    
    const productData = {
      ...formData,
      id: formData.id || Date.now().toString(),
      prix_reference: parseFloat(calculateFinalPrice()),
      quantite_web: parseInt(formData.quantite_web) || 0,
      quantite_reelle: parseInt(formData.stock) || 0,
      reduction: parseInt(formData.reduction) || 0,
      quantite_produit: 1
    };
    
    onSave(productData);
  };

  const handleImageChange = (newImageUrl: string) => {
    setFormData({ ...formData, image: newImageUrl });
  };

  return (
    <motion.div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-blue-800">
            {product ? 'Modifier le produit' : 'Ajouter un produit'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ImageCapture
            currentImage={formData.image}
            onImageChange={handleImageChange}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du produit *
            </label>
            <input
              type="text"
              value={formData.nom}
              onChange={(e) => setFormData({...formData, nom: e.target.value})}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marque *
            </label>
            <input
              type="text"
              value={formData.marque}
              onChange={(e) => setFormData({...formData, marque: e.target.value})}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie
            </label>
            <select
              value={formData.categorie}
              onChange={(e) => setFormData({...formData, categorie: e.target.value})}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
            <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
              🌐 Référence Web
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix web (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.prix_reference}
                  onChange={(e) => setFormData({...formData, prix_reference: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 39.90"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantité web (ml/g)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.quantite_web}
                  onChange={(e) => setFormData({...formData, quantite_web: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 50"
                />
              </div>
            </div>
            <div className="text-xs text-blue-600 mt-2">
              Prix et quantité trouvés sur internet (référence)
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
            <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
              📦 Produit Détenu
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantité réelle (ml/g)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.quantite_reelle}
                  onChange={(e) => setFormData({...formData, quantite_reelle: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock (unités)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({...formData, stock: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 5"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 mt-3">
                Réduction (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.reduction}
                onChange={(e) => setFormData({...formData, reduction: e.target.value})}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 10"
              />
            </div>
            
            <div className="text-xs text-green-600 mt-2">
              Quantité et stock de votre produit physique
            </div>
          </div>

          {parseFloat(formData.quantite_web) > 0 && parseFloat(formData.quantite_reelle) > 0 && parseFloat(formData.prix_reference) > 0 && (
            <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
              <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                💰 Prix Calculé
              </h4>
              <div className="text-2xl font-bold text-purple-700 mb-2">
                {calculateFinalPrice()}€
              </div>
              <div className="text-xs text-purple-600 space-y-1">
                <div>• Prix web: {formData.prix_reference}€ pour {formData.quantite_web}ml/g</div>
                <div>• Prix au prorata: {((parseFloat(formData.prix_reference) * parseFloat(formData.quantite_reelle)) / parseFloat(formData.quantite_web)).toFixed(2)}€ pour {formData.quantite_reelle}ml/g</div>
                {parseFloat(formData.reduction) > 0 && (
                  <div>• Avec réduction {formData.reduction}%: {calculateFinalPrice()}€</div>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Emplacement
            </label>
            <input
              type="text"
              value={formData.emplacement}
              onChange={(e) => setFormData({...formData, emplacement: e.target.value})}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
              placeholder="ex: A1, B5..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {product ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ProductModal;