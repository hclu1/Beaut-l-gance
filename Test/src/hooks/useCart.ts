
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  imageUrl: string
  stock: number
}

export const useCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  // Charger le panier depuis localStorage au démarrage
  useEffect(() => {
    const savedCart = localStorage.getItem('cosmetics-cart')
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart))
      } catch (error) {
        console.error('Erreur lors du chargement du panier:', error)
      }
    }
  }, [])

  // Sauvegarder le panier dans localStorage à chaque modification
  useEffect(() => {
    localStorage.setItem('cosmetics-cart', JSON.stringify(cartItems))
  }, [cartItems])

  const addToCart = (product: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.productId === product.productId)
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity
        if (newQuantity > product.stock) {
          toast.error(`Stock insuffisant. Maximum disponible: ${product.stock}`)
          return prevItems
        }
        
        toast.success('Quantité mise à jour dans le panier')
        return prevItems.map(item =>
          item.productId === product.productId
            ? { ...item, quantity: newQuantity }
            : item
        )
      } else {
        if (quantity > product.stock) {
          toast.error(`Stock insuffisant. Maximum disponible: ${product.stock}`)
          return prevItems
        }
        
        toast.success('Produit ajouté au panier')
        return [...prevItems, { ...product, quantity }]
      }
    })
  }

  const removeFromCart = (productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.productId !== productId))
    toast.success('Produit retiré du panier')
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.productId === productId) {
          if (quantity > item.stock) {
            toast.error(`Stock insuffisant. Maximum disponible: ${item.stock}`)
            return item
          }
          return { ...item, quantity }
        }
        return item
      })
    )
  }

  const clearCart = () => {
    setCartItems([])
    localStorage.removeItem('cosmetics-cart')
  }

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  return {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice
  }
}
