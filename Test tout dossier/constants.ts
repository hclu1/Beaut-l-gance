import { Product, ShopConfig } from './types';

export const categories = [
  "Maquillage",
  "Soins Visage", 
  "Soins Corps",
  "Cheveux",
  "Parfums",
  "Accessoires",
];

export const SHOP_CONFIG: ShopConfig = {
  name: "Beauté & Élégance",
  subtitle: "Votre destination beauté de luxe",
  adminCode: "marina2025"
};

export const initialProducts: Product[] = [
  {
    id: 1,
    nom: "Mascara Volume Million Lashes",
    marque: "L'Oréal Paris",
    prix_reference: 18.90,
    reduction: 20,
    image_url: "https://images.pexels.com/photos/2533266/pexels-photo-2533266.jpeg?auto=compress&cs=tinysrgb&w=400",
    categorie: "makeup",
    quantite_reference: 50,
    quantite_reelle: 50,
    stock_unite: 10,
    emplacement_stock: "A1",
    description: "Mascara volume extrême pour des cils spectaculaires.",
    variant_id: "mascara-loreal-volume" // Identifiant unique pour ce produit
  },
  {
    id: 2,
    nom: "Mascara Volume Million Lashes",
    marque: "L'Oréal Paris",
    prix_reference: 18.90,
    reduction: 20,
    image_url: "https://images.pexels.com/photos/2533266/pexels-photo-2533266.jpeg?auto=compress&cs=tinysrgb&w=400",
    categorie: "makeup",
    quantite_reference: 50,
    quantite_reelle: 35, // Variante avec quantité différente
    stock_unite: 15,
    emplacement_stock: "A2",
    description: "Mascara volume extrême pour des cils spectaculaires.",
    variant_id: "mascara-loreal-volume" // Même identifiant que le produit précédent
  },
  {
    id: 3,
    nom: "Crème Prodigieuse",
    marque: "Nuxe",
    prix_reference: 39.90,
    reduction: 10,
    image_url: "https://images.pexels.com/photos/3685530/pexels-photo-3685530.jpeg?auto=compress&cs=tinysrgb&w=400",
    categorie: "skincare",
    quantite_reference: 80,
    quantite_reelle: 80,
    stock_unite: 8,
    emplacement_stock: "B5",
    description: "Hydratation intense 24h pour tous types de peaux.",
    variant_id: "creme-nuxe-prodigieuse"
  },
  {
    id: 4,
    nom: "Crème Prodigieuse",
    marque: "Nuxe",
    prix_reference: 39.90,
    reduction: 10,
    image_url: "https://images.pexels.com/photos/3685530/pexels-photo-3685530.jpeg?auto=compress&cs=tinysrgb&w=400",
    categorie: "skincare",
    quantite_reference: 80,
    quantite_reelle: 50, // Variante avec quantité différente
    stock_unite: 12,
    emplacement_stock: "B6",
    description: "Hydratation intense 24h pour tous types de peaux.",
    variant_id: "creme-nuxe-prodigieuse" // Même identifiant que le produit précédent
  },
  {
    id: 5,
    nom: "Rouge à Lèvres Rouge Coco",
    marque: "Chanel",
    prix_reference: 45.00,
    reduction: 0,
    image_url: "https://images.pexels.com/photos/3685523/pexels-photo-3685523.jpeg?auto=compress&cs=tinysrgb&w=400",
    categorie: "makeup",
    quantite_reference: 30,
    quantite_reelle: 30,
    stock_unite: 5,
    emplacement_stock: "A3",
    description: "Rouge à lèvres hydratant couleur intense.",
    variant_id: "rouge-a-levres-chanel-coco"
  },
  {
    id: 6,
    nom: "Sérum Nutritive",
    marque: "Kérastase",
    prix_reference: 52.00,
    reduction: 15,
    image_url: "https://images.pexels.com/photos/4465124/pexels-photo-4465124.jpeg?auto=compress&cs=tinysrgb&w=400",
    categorie: "haircare",
    quantite_reference: 25,
    quantite_reelle: 25,
    stock_unite: 7,
    emplacement_stock: "C2",
    description: "Sérum nourrissant pour cheveux secs et abîmés.",
    variant_id: "serum-kerastase-nutritive"
  },
  {
    id: 7,
    nom: "Sérum Nutritive",
    marque: "Kérastase",
    prix_reference: 52.00,
    reduction: 15,
    image_url: "https://images.pexels.com/photos/4465124/pexels-photo-4465124.jpeg?auto=compress&cs=tinysrgb&w=400",
    categorie: "haircare",
    quantite_reference: 25,
    quantite_reelle: 15, // Variante avec quantité différente
    stock_unite: 10,
    emplacement_stock: "C3",
    description: "Sérum nourrissant pour cheveux secs et abîmés.",
    variant_id: "serum-kerastase-nutritive" // Même identifiant que le produit précédent
  },
  {
    id: 8,
    nom: "J'adore Eau de Parfum",
    marque: "Dior",
    prix_reference: 89.00,
    reduction: 5,
    image_url: "https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=400",
    categorie: "fragrance",
    quantite_reference: 15,
    quantite_reelle: 15,
    stock_unite: 3,
    emplacement_stock: "D1",
    description: "Fragrance florale sophistiquée et intemporelle.",
    variant_id: "jadore-dior-eau-de-parfum"
  },
  {
    id: 9,
    nom: "J'adore Eau de Parfum",
    marque: "Dior",
    prix_reference: 89.00,
    reduction: 5,
    image_url: "https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=400",
    categorie: "fragrance",
    quantite_reference: 15,
    quantite_reelle: 30, // Variante avec quantité différente
    stock_unite: 5,
    emplacement_stock: "D2",
    description: "Fragrance florale sophistiquée et intemporelle.",
    variant_id: "jadore-dior-eau-de-parfum" // Même identifiant que le produit précédent
  },
  {
    id: 10,
    nom: "Beurre Corporel Karité",
    marque: "The Body Shop",
    prix_reference: 24.90,
    reduction: 25,
    image_url: "https://images.pexels.com/photos/3685538/pexels-photo-3685538.jpeg?auto=compress&cs=tinysrgb&w=400",
    categorie: "bodycare",
    quantite_reference: 60,
    quantite_reelle: 60,
    stock_unite: 8,
    emplacement_stock: "E4",
    description: "Hydratation intense 48h au beurre de karité pur.",
    variant_id: "beurre-corporel-the-body-shop-karite"
  },
  {
    id: 11,
    nom: "Beurre Corporel Karité",
    marque: "The Body Shop",
    prix_reference: 24.90,
    reduction: 25,
    image_url: "https://images.pexels.com/photos/3685538/pexels-photo-3685538.jpeg?auto=compress&cs=tinysrgb&w=400",
    categorie: "bodycare",
    quantite_reference: 60,
    quantite_reelle: 30, // Variante avec quantité différente
    stock_unite: 12,
    emplacement_stock: "E5",
    description: "Hydratation intense 48h au beurre de karité pur.",
    variant_id: "beurre-corporel-the-body-shop-karite" // Même identifiant que le produit précédent
  }
];

export const STORAGE_KEYS = {
  PRODUCTS: 'beaute_elegance_products',
  ORDERS: 'beaute_elegance_orders',
  SYNC_TIMESTAMP: 'beaute_elegance_sync_timestamp',
  DEVICE_ID: 'beaute_elegance_device_id',
  LAST_MODIFIED: 'beaute_elegance_last_modified'
};