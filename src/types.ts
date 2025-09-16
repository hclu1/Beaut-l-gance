// types.ts
export interface Product {
  id: string;
  image: string;
  marque: string;
  nom: string;
  categorie: string;
  emplacement: string;
  prix_reference: number;
  quantite_web: number;
  quantite_reelle: number;
  reduction: number;
  description: string;
  quantite_produit: number;
}

export interface CartItem extends Product {
  quantite_achat: number;
}

export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered';
  paymentMode: string;
  customerInfo?: {
    nom?: string;
    prenom?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  preparedItems?: { [key: string]: boolean };
}

export interface SyncData {
  products: Product[];
  orders: Order[];
  timestamp: number;
  version: string;
  deviceId: string;
  lastModified: {
    products: number;
    orders: number;
  };
}

export interface ShopConfig {
  name: string;
  subtitle: string;
  adminCode: string;
}