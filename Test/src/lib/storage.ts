
// Système de stockage local pour remplacer le SDK Lumi
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
  quantity: number
  unit: string
  weight: string
  referencePrice: number
  referenceQuantity: number
  pricePerUnit: number
  brand: string
  imageUrl: string
  location?: string // Numéro de carton de stockage
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Order {
  _id: string
  orderId: string
  customerInfo: {
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
  items: Array<{
    productId: string
    name: string
    quantity: number
    price: number
    imageUrl: string
  }>
  totalAmount: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  notes?: string
  createdAt: string
  updatedAt: string
}

// Simulation d'une base de données locale
class LocalStorage {
  private getKey(entity: string): string {
    return `beaute_elegance_${entity}`
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9)
  }

  // Gestion des produits
  async getProducts(): Promise<Product[]> {
    const products = localStorage.getItem(this.getKey('products'))
    return products ? JSON.parse(products) : this.getDefaultProducts()
  }

  async createProduct(productData: Omit<Product, '_id'>): Promise<Product> {
    const products = await this.getProducts()
    const newProduct: Product = {
      ...productData,
      _id: this.generateId()
    }
    products.push(newProduct)
    localStorage.setItem(this.getKey('products'), JSON.stringify(products))
    return newProduct
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const products = await this.getProducts()
    const index = products.findIndex(p => p._id === id)
    if (index === -1) throw new Error('Produit non trouvé')
    
    products[index] = { ...products[index], ...updates }
    localStorage.setItem(this.getKey('products'), JSON.stringify(products))
    return products[index]
  }

  async deleteProduct(id: string): Promise<void> {
    const products = await this.getProducts()
    const filteredProducts = products.filter(p => p._id !== id)
    localStorage.setItem(this.getKey('products'), JSON.stringify(filteredProducts))
  }

  // Gestion des commandes
  async getOrders(): Promise<Order[]> {
    const orders = localStorage.getItem(this.getKey('orders'))
    return orders ? JSON.parse(orders) : []
  }

  async createOrder(orderData: Omit<Order, '_id'>): Promise<Order> {
    const orders = await this.getOrders()
    const newOrder: Order = {
      ...orderData,
      _id: this.generateId()
    }
    orders.push(newOrder)
    localStorage.setItem(this.getKey('orders'), JSON.stringify(orders))
    return newOrder
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
    const orders = await this.getOrders()
    const index = orders.findIndex(o => o._id === id)
    if (index === -1) throw new Error('Commande non trouvée')
    
    orders[index] = { ...orders[index], ...updates }
    localStorage.setItem(this.getKey('orders'), JSON.stringify(orders))
    return orders[index]
  }

  // Produits par défaut pour initialiser l'app
  private getDefaultProducts(): Product[] {
    const defaultProducts: Product[] = [
      {
        _id: '1',
        productId: 'COSM-001',
        name: 'Crème Hydratante Lumière',
        category: 'soins-visage',
        description: 'Crème hydratante enrichie en vitamine C pour un éclat naturel. Texture légère et absorption rapide.',
        price: 44.99,
        discountPercentage: 50,
        salePrice: 22.49,
        stock: 25,
        quantity: 50,
        unit: 'ml',
        weight: '50ml',
        referencePrice: 89.99,
        referenceQuantity: 100,
        pricePerUnit: 0.899,
        brand: 'Beauté Élégance',
        imageUrl: 'https://images.pexels.com/photos/3762879/pexels-photo-3762879.jpeg',
        location: 'C001', // Exemple de numéro de carton
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '2',
        productId: 'COSM-002',
        name: 'Rouge à Lèvres Velours',
        category: 'maquillage',
        description: 'Rouge à lèvres longue tenue avec fini mat velours. Couleur intense et confort optimal.',
        price: 22.99,
        discountPercentage: 50,
        salePrice: 11.49,
        stock: 40,
        quantity: 3.5,
        unit: 'g',
        weight: '3.5g',
        referencePrice: 45.99,
        referenceQuantity: 7,
        pricePerUnit: 6.57,
        brand: 'Beauté Élégance',
        imageUrl: 'https://images.pexels.com/photos/2533266/pexels-photo-2533266.jpeg',
        location: 'C002',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '3',
        productId: 'COSM-003',
        name: 'Sérum Anti-Âge Premium',
        category: 'soins-visage',
        description: 'Sérum concentré en acide hyaluronique et peptides pour réduire les signes de l\'âge.',
        price: 64.99,
        discountPercentage: 50,
        salePrice: 32.49,
        stock: 15,
        quantity: 30,
        unit: 'ml',
        weight: '30ml',
        referencePrice: 129.99,
        referenceQuantity: 60,
        pricePerUnit: 2.166,
        brand: 'Beauté Élégance',
        imageUrl: 'https://images.pexels.com/photos/3685530/pexels-photo-3685530.jpeg',
        location: 'C003',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '4',
        productId: 'COSM-004',
        name: 'Parfum Floral Mystique',
        category: 'parfums',
        description: 'Eau de parfum aux notes florales délicates. Tenue longue durée pour une féminité assumée.',
        price: 39.99,
        discountPercentage: 50,
        salePrice: 19.99,
        stock: 30,
        quantity: 50,
        unit: 'ml',
        weight: '50ml',
        referencePrice: 79.99,
        referenceQuantity: 100,
        pricePerUnit: 0.799,
        brand: 'Beauté Élégance',
        imageUrl: 'https://images.pexels.com/photos/1190829/pexels-photo-1190829.jpeg',
        location: 'C004',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '5',
        productId: 'COSM-005',
        name: 'Masque Purifiant Argile',
        category: 'soins-visage',
        description: 'Masque à l\'argile verte pour purifier et matifier les peaux mixtes à grasses.',
        price: 29.99,
        discountPercentage: 50,
        salePrice: 14.99,
        stock: 50,
        quantity: 75,
        unit: 'ml',
        weight: '75ml',
        referencePrice: 39.99,
        referenceQuantity: 100,
        pricePerUnit: 0.399,
        brand: 'Beauté Élégance',
        imageUrl: 'https://images.pexels.com/photos/3762876/pexels-photo-3762876.jpeg',
        location: 'C005',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '6',
        productId: 'COSM-006',
        name: 'Palette Ombres à Paupières',
        category: 'maquillage',
        description: 'Palette de 12 ombres à paupières aux tons neutres et dorés. Pigmentation intense.',
        price: 29.99,
        discountPercentage: 50,
        salePrice: 14.99,
        stock: 20,
        quantity: 15,
        unit: 'g',
        weight: '15g',
        referencePrice: 59.99,
        referenceQuantity: 30,
        pricePerUnit: 1.999,
        brand: 'Beauté Élégance',
        imageUrl: 'https://images.pexels.com/photos/2533269/pexels-photo-2533269.jpeg',
        location: 'C006',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]

    // Sauvegarder les produits par défaut
    localStorage.setItem(this.getKey('products'), JSON.stringify(defaultProducts))
    return defaultProducts
  }
}

// Instance singleton
export const storage = new LocalStorage()

// API compatible avec l'ancien système
export const lumi = {
  entities: {
    products: {
      list: async () => ({ list: await storage.getProducts() }),
      create: (data: any) => storage.createProduct(data),
      update: (id: string, data: any) => storage.updateProduct(id, data),
      delete: (id: string) => storage.deleteProduct(id)
    },
    orders: {
      list: async () => ({ list: await storage.getOrders() }),
      create: (data: any) => storage.createOrder(data),
      update: (id: string, data: any) => storage.updateOrder(id, data)
    }
  }
}
