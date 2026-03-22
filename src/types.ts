// Définition de l'interface Product qui représente un produit dans la boutique
export interface Product {
  id: string | number; // Identifiant unique du produit danid: string | number; // Identifiant unique du produit dans la base de données
  nom: string; // Nom du produit (ex: "Rouge à lèvres mat")s la base de données  nom: string; // Nom du produit (ex: "Rouge à lèvres mat")
  marque: string; // Marque du produit (ex: "L'Oréal")
  prix_reference: number; // Prix de référence trouvé sur internet pour la quantité de référence
  reduction: number; // Pourcentage de réduction appliqué au produit (ex: 10 pour 10%)
  image_url: string; // URL de l'image du produit stockée dans Supabase Storage
  categorie: string; // Catégorie du produit (makeup, skincare, etc.)

  // Champs pour la gestion des stocks et des prix variables
  quantite_reference: number; // Quantité qui correspond au prix_reference (en ml ou gr)
  quantite_reelle: number; // Quantité réelle que vous avez en stock (en ml ou gr)
  stock_unite: number; // Nombre d'unités physiques disponibles en stock
  emplacement_stock?: string | string[]; // Emplacement du produit en stock (admin uniquement)

  // Prix calculé automatiquement en fonction de la quantité réelle
  prix_reel?: number; // Prix calculé : (prix_reference / quantite_reference) * quantite_reelle

  description?: string; // Description détaillée du produit (optionnel)

  // Champ pour identifier les variantes d'un même produit
  variant_id?: string; // Identifiant commun pour toutes les variantes d'un même produit
}

// Définition de l'interface CartItem qui représente un produit dans le panier
export interface CartItem extends Product {
  quantite_achat: number; // Quantité de ce produit que le client souhaite acheter
}

// Définition de l'interface OrderItem qui représente un produit dans une commande
export interface OrderItem extends Product {
  quantite_achat: number; // Quantité commandée
  prepared?: boolean; // État de préparation du produit (préparé ou non)
}

// Définition de l'interface Order qui représente une commande complète
export interface Order {
  id: string; // Identifiant unique de la commande
  date: string; // Date et heure de la commande
  items: OrderItem[]; // Liste des produits inclus dans la commande
  total: number; // Montant total de la commande
  status: 'pending' | 'preparing' | 'processing' | 'ready' | 'completed' | 'delivered' | 'deleted'; // Statut de la commande
  paymentMode: string; // Mode de paiement utilisé (ex: "espece", "carte")
  customerInfo: any; // Informations sur le client (nom, prénom, email, etc.)
  preparedItems: { [productId: string]: boolean }; // État de préparation par produit
}

// Définition de l'interface SyncData pour la synchronisation des données entre appareils
export interface SyncData {
  products: Product[]; // Liste des produits à synchroniser
  orders: Order[]; // Liste des commandes à synchroniser
  timestamp: number; // Timestamp de la synchronisation
  deviceId?: string; // Identifiant de l'appareil source (optionnel)
}

// Interface supplémentaire pour les produits dans l'administration
export interface AdminProduct extends Product {
  emplacement_stock: string | string[]; // Champ obligatoire pour l'administration
  createdAt: string; // Date de création
  updatedAt: string; // Date de dernière mise à jour
}

// Interface pour les commandes dans l'administration avec plus de détails
export interface AdminOrder extends Order {
  createdAt: string; // Date de création
  updatedAt: string; // Date de dernière mise à jour
  items: AdminOrderItem[]; // Items avec détails admin
}

// Interface pour les items de commande dans l'administration
export interface AdminOrderItem extends OrderItem {
  emplacement_stock: string | string[]; // Emplacement du produit
  productLocation: string; // Emplacement exact où trouver le produit
}