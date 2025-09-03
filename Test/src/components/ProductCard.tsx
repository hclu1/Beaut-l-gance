
import React from 'react'
import { motion } from 'framer-motion'
import { ShoppingBag, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Product {
  _id: string
  productId: string
  name: string
  category: string
  price: number
  salePrice: number
  discountPercentage: number
  stock: number
  imageUrl: string
  brand: string
}

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product) => void
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const navigate = useNavigate()

  const handleViewProduct = () => {
    navigate(`/product/${product._id}`)
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    onAddToCart(product)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer group"
      onClick={handleViewProduct}
    >
      <div className="relative overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Badge de réduction */}
        {product.discountPercentage > 0 && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            -{product.discountPercentage}%
          </div>
        )}

        {/* Stock faible */}
        {product.stock <= 5 && product.stock > 0 && (
          <div className="absolute top-3 right-3 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            Stock faible
          </div>
        )}

        {/* Rupture de stock */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-semibold bg-red-500 px-4 py-2 rounded-lg">
              Rupture de stock
            </span>
          </div>
        )}

        {/* Actions au survol */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex space-x-3">
            <button
              onClick={handleViewProduct}
              className="bg-white text-gray-800 p-3 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Eye size={20} />
            </button>
            {product.stock > 0 && (
              <button
                onClick={handleAddToCart}
                className="bg-gradient-to-r from-pink-500 to-rose-500 text-white p-3 rounded-full hover:from-pink-600 hover:to-rose-600 transition-all"
              >
                <ShoppingBag size={20} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-2">
          <span className="text-xs text-gray-500 uppercase tracking-wider">
            {product.brand}
          </span>
        </div>
        
        <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-pink-600 transition-colors">
          {product.name}
        </h3>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-pink-600">
              {product.salePrice.toFixed(2)}€
            </span>
            {product.discountPercentage > 0 && (
              <span className="text-sm text-gray-500 line-through">
                {product.price.toFixed(2)}€
              </span>
            )}
          </div>
          
          <div className="text-xs text-gray-500">
            Stock: {product.stock}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default ProductCard
