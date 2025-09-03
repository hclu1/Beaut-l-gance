
import { useState, useEffect, useCallback } from 'react'
import { lumi } from '../lib/storage'
import toast from 'react-hot-toast'

interface Product {
  _id: string
  productId: string
  name: string
  category: string
  description: string
  price: number
  discountPercentage: number
  salePrice: number
  stock: number
  weight: string
  brand: string
  imageUrl: string
  driveImageId?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const { list } = await lumi.entities.products.list()
      setProducts(list || [])
    } catch (error: any) {
      console.error('Erreur lors du chargement des produits:', error)
      toast.error('Impossible de charger les produits')
    } finally {
      setLoading(false)
    }
  }, [])

  const createProduct = async (productData: Omit<Product, '_id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const now = new Date().toISOString()
      const newProduct = await lumi.entities.products.create({
        ...productData,
        createdAt: now,
        updatedAt: now
      })
      await fetchProducts()
      toast.success('Produit ajouté avec succès')
      return newProduct
    } catch (error: any) {
      console.error('Erreur lors de la création du produit:', error)
      toast.error('Erreur lors de l\'ajout du produit')
      throw error
    }
  }

  const updateProduct = async (productId: string, updates: Partial<Product>) => {
    try {
      const updatedProduct = await lumi.entities.products.update(productId, {
        ...updates,
        updatedAt: new Date().toISOString()
      })
      await fetchProducts()
      toast.success('Produit mis à jour')
      return updatedProduct
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour:', error)
      toast.error('Erreur lors de la mise à jour')
      throw error
    }
  }

  const deleteProduct = async (productId: string) => {
    try {
      await lumi.entities.products.delete(productId)
      await fetchProducts()
      toast.success('Produit supprimé')
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error)
      toast.error('Erreur lors de la suppression')
      throw error
    }
  }

  const updateStock = async (productId: string, newStock: number) => {
    try {
      await updateProduct(productId, { stock: newStock })
    } catch (error) {
      throw error
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return {
    products,
    loading,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    updateStock
  }
}
