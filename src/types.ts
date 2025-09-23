export interface Product {
  id: number;
  nom: string;
  marque: string;
  prix_reference: number; // Prix trouvé sur internet
  reduction: number;
  image_url: string;
  categorie: string;
  
  // NOUVEAUX CHAMPS pour la gestion stock/prix
  quantite_reference: number; // Quantité qui correspond au prix_reference (ml/gr)
  quantite_reelle: number; // Quantité réelle que vous avez (ml/gr)
  stock_unite: number; // Nombre d'unités en stock
  emplacement_stock: string | string[]; // Accepte string ET array
  
  // Prix calculé automatiquement basé sur quantité_reelle
  prix_reel?: number; // Prix calculé : (prix_reference / quantite_reference) * quantite_reelle
  
  description?: string;
}

export interface CartItem extends Product {
  quantite_achat: number;
}

export interface OrderItem extends Product {
  quantite_achat: number;
  prepared?: boolean; // Nouvel état : produit préparé ou non
}

export interface Order {
  id: string;
  date: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'preparation' | 'completed' | 'deleted'; // Statuts étendus avec supprimé
  paymentMode: string;
  customerInfo: any;
  preparedItems: { [productId: string]: boolean }; // État de préparation par produit
}

export interface SyncData {
  products: Product[];
  orders: Order[];
  timestamp: number;
  deviceId?: string;
}