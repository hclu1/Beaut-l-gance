
import { useState, useEffect, useCallback } from 'react'
import { lumi } from '../lib/storage'
import toast from 'react-hot-toast'

interface CustomerInfo {
  name: string
  email: string
  phone: string
  address: {
    street: string
    city: string
    postalCode: string
    country: string
  }
}

interface OrderItem {
  productId: string
  name: string
  quantity: number
  price: number
  imageUrl: string
}

interface Order {
  _id: string
  orderId: string
  customerInfo: CustomerInfo
  items: OrderItem[]
  totalAmount: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  notes?: string
  createdAt: string
  updatedAt: string
}

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const { list } = await lumi.entities.orders.list()
      setOrders(list || [])
    } catch (error: any) {
      console.error('Erreur lors du chargement des commandes:', error)
      toast.error('Impossible de charger les commandes')
    } finally {
      setLoading(false)
    }
  }, [])

  const createOrder = async (orderData: Omit<Order, '_id' | 'orderId' | 'createdAt' | 'updatedAt'>) => {
    try {
      const now = new Date().toISOString()
      const orderId = `ORDER-${Date.now()}`
      
      const newOrder = await lumi.entities.orders.create({
        ...orderData,
        orderId,
        createdAt: now,
        updatedAt: now
      })
      
      await fetchOrders()
      toast.success('Commande créée avec succès')
      return newOrder
    } catch (error: any) {
      console.error('Erreur lors de la création de la commande:', error)
      toast.error('Erreur lors de la création de la commande')
      throw error
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      // Récupérer la commande actuelle pour vérifier le changement de statut
      const currentOrder = orders.find(order => order._id === orderId)
      if (!currentOrder) {
        throw new Error('Commande introuvable')
      }

      const oldStatus = currentOrder.status

      // Mettre à jour le statut de la commande
      await lumi.entities.orders.update(orderId, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      })

      // Si la commande passe à "annulée", remettre les produits en stock
      if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
        await restoreStock(currentOrder.items)
        toast.success('Commande annulée - Stock remis à jour')
      } else {
        toast.success('Statut de commande mis à jour')
      }

      await fetchOrders()
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du statut:', error)
      toast.error('Erreur lors de la mise à jour')
      throw error
    }
  }

  // Fonction pour remettre les produits en stock lors d'une annulation
  const restoreStock = async (items: OrderItem[]) => {
    try {
      for (const item of items) {
        // Récupérer le produit actuel
        const { list: products } = await lumi.entities.products.list()
        const product = products.find(p => p._id === item.productId)
        
        if (product) {
          // Remettre la quantité en stock
          const newStock = product.stock + item.quantity
          await lumi.entities.products.update(item.productId, {
            stock: newStock,
            updatedAt: new Date().toISOString()
          })
          
          console.log(`Stock remis à jour pour ${product.name}: +${item.quantity} (nouveau stock: ${newStock})`)
        }
      }
    } catch (error) {
      console.error('Erreur lors de la remise en stock:', error)
      toast.error('Erreur lors de la remise en stock des produits')
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return {
    orders,
    loading,
    fetchOrders,
    createOrder,
    updateOrderStatus,
    restoreStock
  }
}
