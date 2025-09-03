
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ShoppingBag, Plus, Minus, Star, Truck, Shield, RefreshCw } from 'lucide-react'
import { useProducts } from '../hooks/useProducts'
import { useCart } from '../hooks/useCart'
import toast from 'react-hot-toast'

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { products } = useProducts()
  const { addToCart } = useCart()
  
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)

  const product = products.find(p => p._id === id)

  useEffect(() => {
    if (!product) return
    setSelectedImage(0)
  }, [product])

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Produit non trouvé</h2>
          <p className="text-gray-600 mb-4">Ce produit n'existe pas ou n'est plus disponible</p>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-3 rounded-full hover:from-pink-600 hover:to-rose-600 transition-all"
          >
            Retour à la boutique
          </button>
        </div>
      </div>
    )
  }

  const handleAddToCart = () => {
    if (product.stock === 0) {
      toast.error('Produit en rupture de stock')
      return
    }

    if (quantity > product.stock) {
      toast.error(`Stock insuffisant. Maximum disponible: ${product.stock}`)
      return
    }

    addToCart({
      productId: product._id,
      name: product.name,
      price: product.salePrice,
      imageUrl: product.imageUrl,
      stock: product.stock
    }, quantity)
  }

  const handleBuyNow = () => {
    handleAddToCart()
    navigate('/cart')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-gray-600 hover:text-pink-600 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Retour à la boutique</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="aspect-square rounded-2xl overflow-hidden shadow-lg"
            >
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>

          {/* Informations produit */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div>
                <span className="text-sm text-pink-600 font-medium uppercase tracking-wider">
                  {product.brand}
                </span>
                <h1 className="text-3xl font-bold text-gray-900 mt-1">
                  {product.name}
                </h1>
              </div>

              {/* Prix */}
              <div className="flex items-center space-x-4">
                <span className="text-3xl font-bold text-pink-600">
                  {product.salePrice.toFixed(2)}€
                </span>
                {product.discountPercentage > 0 && (
                  <>
                    <span className="text-xl text-gray-500 line-through">
                      {product.price.toFixed(2)}€
                    </span>
                    <span className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      -{product.discountPercentage}% OFF
                    </span>
                  </>
                )}
              </div>

              {/* Note et avis */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={`${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">(4.8/5 - 127 avis)</span>
              </div>

              {/* Description */}
              <div className="prose prose-sm">
                <p className="text-gray-700 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Informations produit */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Contenance:</span>
                  <span className="font-medium">{product.weight}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Catégorie:</span>
                  <span className="font-medium capitalize">{product.category.replace('-', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Stock:</span>
                  <span className={`font-medium ${product.stock <= 5 ? 'text-orange-600' : 'text-green-600'}`}>
                    {product.stock > 0 ? `${product.stock} disponible${product.stock > 1 ? 's' : ''}` : 'Rupture de stock'}
                  </span>
                </div>
              </div>

              {/* Quantité et achat */}
              {product.stock > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-700 font-medium">Quantité:</span>
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-2 hover:bg-gray-100 transition-colors"
                        disabled={quantity <= 1}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="px-4 py-2 font-medium">{quantity}</span>
                      <button
                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                        className="p-2 hover:bg-gray-100 transition-colors"
                        disabled={quantity >= product.stock}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={handleAddToCart}
                      className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 px-6 rounded-full font-semibold hover:from-pink-600 hover:to-rose-600 transition-all flex items-center justify-center space-x-2"
                    >
                      <ShoppingBag size={20} />
                      <span>Ajouter au panier</span>
                    </button>
                    <button
                      onClick={handleBuyNow}
                      className="flex-1 bg-gray-900 text-white py-3 px-6 rounded-full font-semibold hover:bg-gray-800 transition-all"
                    >
                      Acheter maintenant
                    </button>
                  </div>
                </div>
              )}

              {product.stock === 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <p className="text-red-800 font-medium">Ce produit est actuellement en rupture de stock</p>
                  <p className="text-red-600 text-sm mt-1">Revenez bientôt pour vérifier la disponibilité</p>
                </div>
              )}
            </motion.div>

            {/* Avantages */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t">
              <div className="flex items-center space-x-3 text-sm">
                <Truck className="text-green-600" size={20} />
                <div>
                  <p className="font-medium">Livraison rapide</p>
                  <p className="text-gray-600">2-3 jours ouvrés</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Shield className="text-blue-600" size={20} />
                <div>
                  <p className="font-medium">Paiement sécurisé</p>
                  <p className="text-gray-600">SSL 256 bits</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <RefreshCw className="text-purple-600" size={20} />
                <div>
                  <p className="font-medium">Retour gratuit</p>
                  <p className="text-gray-600">14 jours</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
