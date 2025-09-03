
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {AlertTriangle, Package, Plus, Edit, Eye, MapPin, Percent, ShoppingCart, X} from 'lucide-react'

interface DuplicateDetectionModalProps {
  isOpen: boolean
  onClose: () => void
  matchedProduct: any
  similarity: number
  confidence: 'high' | 'medium' | 'low'
  newProductData: any
  onChooseAddNew: () => void
  onChooseModifyExisting: () => void
  onViewExisting: () => void
}

const DuplicateDetectionModal: React.FC<DuplicateDetectionModalProps> = ({
  isOpen,
  onClose,
  matchedProduct,
  similarity,
  confidence,
  newProductData,
  onChooseAddNew,
  onChooseModifyExisting,
  onViewExisting
}) => {
  if (!isOpen) return null

  const getConfidenceColor = () => {
    switch (confidence) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-orange-600 bg-orange-100'
      case 'low': return 'text-yellow-600 bg-yellow-100'
    }
  }

  const getConfidenceText = () => {
    switch (confidence) {
      case 'high': return 'Très probable'
      case 'medium': return 'Probable'
      case 'low': return 'Possible'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle size={28} />
              <div>
                <h2 className="text-xl font-bold">Produit similaire détecté</h2>
                <p className="text-orange-100">
                  Similarité : {similarity.toFixed(1)}% - Confiance : {getConfidenceText()}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-orange-200 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6">
          {/* Badge de confiance */}
          <div className="flex justify-center mb-6">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getConfidenceColor()}`}>
              🔍 Correspondance {getConfidenceText().toLowerCase()} ({similarity.toFixed(1)}%)
            </span>
          </div>

          {/* Comparaison côte à côte */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Produit existant */}
            <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
              <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center">
                <Package className="mr-2" size={20} />
                Produit existant dans votre stock
              </h3>
              
              <div className="space-y-4">
                <img
                  src={matchedProduct.imageUrl}
                  alt={matchedProduct.name}
                  className="w-full h-48 object-cover rounded-lg border"
                />
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-800">{matchedProduct.name}</h4>
                  <p className="text-sm text-gray-600">{matchedProduct.brand}</p>
                  <p className="text-xs text-gray-500 line-clamp-2">{matchedProduct.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-gray-600">Quantité</div>
                    <div className="font-semibold">{matchedProduct.quantity}{matchedProduct.unit}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-gray-600">Prix de vente</div>
                    <div className="font-semibold text-green-600">{matchedProduct.salePrice?.toFixed(2)}€</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-gray-600">Stock actuel</div>
                    <div className={`font-semibold ${
                      matchedProduct.stock <= 5 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {matchedProduct.stock} unités
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-gray-600 flex items-center">
                      <MapPin size={12} className="mr-1" />
                      Localisation
                    </div>
                    <div className="font-semibold">{matchedProduct.location || 'Non définie'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Nouveau produit */}
            <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
              <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center">
                <Plus className="mr-2" size={20} />
                Nouveau produit à ajouter
              </h3>
              
              <div className="space-y-4">
                <img
                  src={newProductData.imageUrl}
                  alt={newProductData.name || 'Nouveau produit'}
                  className="w-full h-48 object-cover rounded-lg border"
                />
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-800">{newProductData.name || 'Nom à définir'}</h4>
                  <p className="text-sm text-gray-600">{newProductData.brand || 'Marque à définir'}</p>
                  <p className="text-xs text-gray-500">{newProductData.description || 'Description à compléter'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-gray-600">Quantité prévue</div>
                    <div className="font-semibold">{newProductData.quantity || 0}{newProductData.unit || 'ml'}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-gray-600">Prix estimé</div>
                    <div className="font-semibold text-green-600">{newProductData.salePrice?.toFixed(2) || '0.00'}€</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-gray-600">Stock prévu</div>
                    <div className="font-semibold text-blue-600">{newProductData.stock || 0} unités</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-gray-600 flex items-center">
                      <MapPin size={12} className="mr-1" />
                      Localisation
                    </div>
                    <div className="font-semibold">{newProductData.location || 'À définir'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Options d'action */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
              Que souhaitez-vous faire ?
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Modifier l'existant */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onChooseModifyExisting}
                className="bg-blue-500 text-white p-6 rounded-xl hover:bg-blue-600 transition-all shadow-lg"
              >
                <div className="flex flex-col items-center space-y-3">
                  <div className="bg-blue-400 p-3 rounded-full">
                    <Edit size={24} />
                  </div>
                  <div className="text-center">
                    <h4 className="font-semibold">Modifier l'existant</h4>
                    <p className="text-sm text-blue-100 mt-1">
                      Ajuster stock et localisation du produit existant
                    </p>
                  </div>
                </div>
              </motion.button>

              {/* Ajouter comme nouveau */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onChooseAddNew}
                className="bg-green-500 text-white p-6 rounded-xl hover:bg-green-600 transition-all shadow-lg"
              >
                <div className="flex flex-col items-center space-y-3">
                  <div className="bg-green-400 p-3 rounded-full">
                    <Plus size={24} />
                  </div>
                  <div className="text-center">
                    <h4 className="font-semibold">Ajouter comme nouveau</h4>
                    <p className="text-sm text-green-100 mt-1">
                      Créer un produit séparé (variante, taille différente...)
                    </p>
                  </div>
                </div>
              </motion.button>

              {/* Voir les détails */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onViewExisting}
                className="bg-gray-500 text-white p-6 rounded-xl hover:bg-gray-600 transition-all shadow-lg"
              >
                <div className="flex flex-col items-center space-y-3">
                  <div className="bg-gray-400 p-3 rounded-full">
                    <Eye size={24} />
                  </div>
                  <div className="text-center">
                    <h4 className="font-semibold">Examiner d'abord</h4>
                    <p className="text-sm text-gray-100 mt-1">
                      Voir tous les détails avant de décider
                    </p>
                  </div>
                </div>
              </motion.button>
            </div>
          </div>

          {/* Conseils */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">💡 Conseils pour choisir :</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• <strong>Modifier l'existant</strong> si c'est exactement le même produit (même marque, même contenance)</li>
              <li>• <strong>Ajouter comme nouveau</strong> si c'est une variante (taille différente, édition limitée, etc.)</li>
              <li>• <strong>Examiner d'abord</strong> si vous n'êtes pas sûr de la différence</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default DuplicateDetectionModal
