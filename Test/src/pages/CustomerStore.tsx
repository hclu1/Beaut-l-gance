
import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ShoppingBag, Search, Filter, Heart, Star, Sparkles, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useProducts } from '../hooks/useProducts'
import { useCart } from '../hooks/useCart'
import ProductCard from '../components/ProductCard'

const categories = [
  { id: 'all', name: 'Tous les produits', icon: '✨', color: 'from-pink-400 to-purple-400' },
  { id: 'soins-visage', name: 'Soins Visage', icon: '🌸', color: 'from-rose-400 to-pink-400' },
  { id: 'maquillage', name: 'Maquillage', icon: '💄', color: 'from-red-400 to-rose-400' },
  { id: 'soins-corps', name: 'Soins Corps', icon: '🧴', color: 'from-purple-400 to-indigo-400' },
  { id: 'parfums', name: 'Parfums', icon: '🌺', color: 'from-indigo-400 to-purple-400' },
  { id: 'soins-cheveux', name: 'Soins Cheveux', icon: '💆‍♀️', color: 'from-teal-400 to-cyan-400' },
  { id: 'accessoires', name: 'Accessoires', icon: '🎀', color: 'from-pink-400 to-rose-400' }
]

const CustomerStore: React.FC = () => {
  const navigate = useNavigate()
  const { products, loading } = useProducts()
  const { addToCart, getTotalItems } = useCart()
  
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Filtrer les produits actifs et en stock
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const isActive = product.isActive && product.stock > 0
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.brand.toLowerCase().includes(searchTerm.toLowerCase())
      
      return isActive && matchesCategory && matchesSearch
    })
  }, [products, selectedCategory, searchTerm])

  const handleAddToCart = (product: any) => {
    addToCart({
      productId: product._id,
      name: product.name,
      price: product.salePrice,
      imageUrl: product.imageUrl,
      stock: product.stock
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-500 mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg">Chargement de votre boutique de beauté...</p>
          <div className="flex justify-center space-x-2 mt-4">
            <Sparkles className="text-pink-400 animate-pulse" size={20} />
            <Sparkles className="text-purple-400 animate-pulse delay-150" size={20} />
            <Sparkles className="text-rose-400 animate-pulse delay-300" size={20} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Header élégant */}
      <header className="bg-white shadow-lg sticky top-0 z-50 border-b border-pink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-pink-500 to-purple-600 w-12 h-12 rounded-full flex items-center justify-center">
                  <Sparkles className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    Beauté & Élégance
                  </h1>
                  <p className="text-sm text-gray-500 hidden sm:block">
                    ✨ Cosmétiques de luxe à prix exceptionnels
                  </p>
                </div>
              </div>
            </motion.div>

            <div className="flex items-center space-x-4">
              {/* Recherche */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Rechercher votre produit de beauté..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 w-80 border border-pink-200 rounded-full focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-pink-50/50"
                />
              </div>

              {/* Panier stylé */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/cart')}
                className="relative bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4 rounded-full hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg"
              >
                <ShoppingBag size={24} />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-sm rounded-full h-7 w-7 flex items-center justify-center font-bold animate-pulse">
                    {getTotalItems()}
                  </span>
                )}
              </motion.button>
            </div>
          </div>

          {/* Recherche mobile */}
          <div className="mt-4 md:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher votre produit de beauté..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-pink-200 rounded-full focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-pink-50/50"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section magnifique */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-400/20 via-purple-400/20 to-rose-400/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-8"
          >
            <div className="flex justify-center space-x-3 mb-6">
              <Sparkles className="text-pink-500 animate-bounce" size={32} />
              <Sparkles className="text-purple-500 animate-bounce delay-150" size={28} />
              <Sparkles className="text-rose-500 animate-bounce delay-300" size={24} />
            </div>
            
            <h2 className="text-5xl md:text-7xl font-bold text-gray-800 leading-tight">
              Révélez votre
              <span className="block bg-gradient-to-r from-pink-600 via-purple-600 to-rose-600 bg-clip-text text-transparent">
                beauté naturelle
              </span>
            </h2>
            
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Découvrez notre collection exclusive de cosmétiques de luxe 
              <span className="font-semibold text-pink-600"> avec jusqu'à 50% de réduction</span>
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-8 text-lg text-gray-600">
              <div className="flex items-center space-x-3">
                <Heart className="text-pink-500" size={24} />
                <span>Produits sélectionnés avec amour</span>
              </div>
              <div className="flex items-center space-x-3">
                <Star className="text-yellow-500" size={24} />
                <span>Qualité premium garantie</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🚚</span>
                <span>Livraison soignée</span>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 max-w-md mx-auto shadow-xl border border-pink-100"
            >
              <p className="text-pink-700 font-semibold text-lg">🎁 Offre spéciale</p>
              <p className="text-gray-600">Livraison gratuite dès 50€ d'achat</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Catégories élégantes */}
      <section className="py-12 bg-white/70 backdrop-blur-sm border-y border-pink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-gray-800">Nos univers beauté</h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center space-x-2 text-pink-600 bg-pink-50 px-4 py-2 rounded-full"
            >
              <Filter size={20} />
              <span>Filtres</span>
            </button>
          </div>

          <div className={`grid grid-cols-2 md:flex md:flex-wrap md:justify-center gap-4 ${showFilters ? 'block' : 'hidden md:flex'}`}>
            {categories.map((category) => (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center justify-center space-x-3 px-6 py-4 rounded-2xl transition-all font-medium ${
                  selectedCategory === category.id
                    ? `bg-gradient-to-r ${category.color} text-white shadow-lg transform scale-105`
                    : 'bg-white text-gray-700 hover:bg-pink-50 border border-pink-100 shadow-sm'
                }`}
              >
                <span className="text-xl">{category.icon}</span>
                <span className="text-sm md:text-base">{category.name}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Produits avec animation */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h3 className="text-3xl font-bold text-gray-800 mb-2">
                {selectedCategory === 'all' 
                  ? 'Toute notre collection' 
                  : categories.find(c => c.id === selectedCategory)?.name
                }
              </h3>
              <p className="text-gray-600">
                {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} disponible{filteredProducts.length > 1 ? 's' : ''}
              </p>
            </div>
            
            {filteredProducts.length > 0 && (
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500">
                <Sparkles className="text-pink-400" size={16} />
                <span>Nouveautés ajoutées régulièrement</span>
              </div>
            )}
          </div>

          {filteredProducts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="text-8xl mb-6">🔍</div>
              <h4 className="text-2xl font-semibold text-gray-600 mb-4">
                Aucun produit trouvé
              </h4>
              <p className="text-gray-500 text-lg mb-8">
                Essayez de modifier vos critères de recherche ou explorez d'autres catégories
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('all')
                  setSearchTerm('')
                }}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-3 rounded-full hover:from-pink-600 hover:to-purple-700 transition-all"
              >
                Voir tous les produits
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            >
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ProductCard
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Footer élégant avec accès propriétaire */}
      <footer className="bg-gradient-to-r from-gray-900 via-purple-900 to-pink-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <div className="flex justify-center space-x-3">
              <Sparkles className="text-pink-300" size={32} />
              <Sparkles className="text-purple-300" size={28} />
              <Sparkles className="text-rose-300" size={24} />
            </div>
            
            <h4 className="text-3xl font-bold">Beauté & Élégance</h4>
            <p className="text-purple-200 text-lg max-w-2xl mx-auto">
              Votre destination beauté en ligne pour des cosmétiques d'exception 
              à des prix irrésistibles
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="space-y-2">
                <h5 className="font-semibold text-pink-300">Contact</h5>
                <p className="text-purple-200">📞 01 23 45 67 89</p>
                <p className="text-purple-200">📧 contact@beaute-elegance.fr</p>
              </div>
              
              <div className="space-y-2">
                <h5 className="font-semibold text-pink-300">Livraison</h5>
                <p className="text-purple-200">🚚 Gratuite dès 50€</p>
                <p className="text-purple-200">⚡ Expédition 24h</p>
              </div>
              
              <div className="space-y-2">
                <h5 className="font-semibold text-pink-300">Garanties</h5>
                <p className="text-purple-200">💝 Emballage soigné</p>
                <p className="text-purple-200">🔄 Retour 14 jours</p>
              </div>
            </div>
            
            <div className="border-t border-purple-700 pt-8 space-y-4">
              <p className="text-purple-300">
                © 2025 Beauté & Élégance - Tous droits réservés
              </p>
              
              {/* Bouton d'accès propriétaire discret */}
              <div className="flex justify-center">
                <button
                  onClick={() => navigate('/owner')}
                  className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 text-sm transition-colors opacity-75 hover:opacity-100"
                  title="Accès propriétaire"
                >
                  <Settings size={16} />
                  <span>Gestion</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default CustomerStore
