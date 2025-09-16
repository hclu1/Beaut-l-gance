// constants.ts
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
    id: "1",
    image: "https://images.pexels.com/photos/2533266/pexels-photo-2533266.jpeg?auto=compress&cs=tinysrgb&w=400",
    marque: "L'Oréal Paris",
    nom: "Mascara Volume Million Lashes",
    categorie: "Maquillage",
    emplacement: "A1",
    prix_reference: 18.90,
    quantite_web: 50,
    quantite_reelle: 35,
    reduction: 20,
    description: "Mascara volume extrême pour des cils spectaculaires.",
    quantite_produit: 1,
  },
  {
    id: "2",
    image: "https://images.pexels.com/photos/3685530/pexels-photo-3685530.jpeg?auto=compress&cs=tinysrgb&w=400",
    marque: "Nuxe",
    nom: "Crème Prodigieuse",
    categorie: "Soins Visage",
    emplacement: "B5",
    prix_reference: 39.90,
    quantite_web: 80,
    quantite_reelle: 75,
    reduction: 10,
    description: "Hydratation intense 24h pour tous types de peaux.",
    quantite_produit: 1,
  },
  {
    id: "3",
    image: "https://images.pexels.com/photos/3685523/pexels-photo-3685523.jpeg?auto=compress&cs=tinysrgb&w=400",
    marque: "Chanel",
    nom: "Rouge à Lèvres Rouge Coco",
    categorie: "Maquillage",
    emplacement: "A3",
    prix_reference: 45.00,
    quantite_web: 30,
    quantite_reelle: 28,
    reduction: 0,
    description: "Rouge à lèvres hydratant couleur intense.",
    quantite_produit: 1,
  },
  {
    id: "4",
    image: "https://images.pexels.com/photos/4465124/pexels-photo-4465124.jpeg?auto=compress&cs=tinysrgb&w=400",
    marque: "Kérastase",
    nom: "Sérum Nutritive",
    categorie: "Cheveux",
    emplacement: "C2",
    prix_reference: 52.00,
    quantite_web: 25,
    quantite_reelle: 20,
    reduction: 15,
    description: "Sérum nourrissant pour cheveux secs et abîmés.",
    quantite_produit: 1,
  },
  {
    id: "5",
    image: "https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=400",
    marque: "Dior",
    nom: "J'adore Eau de Parfum",
    categorie: "Parfums",
    emplacement: "D1",
    prix_reference: 89.00,
    quantite_web: 15,
    quantite_reelle: 12,
    reduction: 5,
    description: "Fragrance florale sophistiquée et intemporelle.",
    quantite_produit: 1,
  },
  {
    id: "6",
    image: "https://images.pexels.com/photos/3685538/pexels-photo-3685538.jpeg?auto=compress&cs=tinysrgb&w=400",
    marque: "The Body Shop",
    nom: "Beurre Corporel Karité",
    categorie: "Soins Corps",
    emplacement: "E4",
    prix_reference: 24.90,
    quantite_web: 60,
    quantite_reelle: 45,
    reduction: 25,
    description: "Hydratation intense 48h au beurre de karité pur.",
    quantite_produit: 1,
  },
];

export const STORAGE_KEYS = {
  PRODUCTS: 'beaute_elegance_products',
  ORDERS: 'beaute_elegance_orders',
  SYNC_TIMESTAMP: 'beaute_elegance_sync_timestamp',
  DEVICE_ID: 'beaute_elegance_device_id',
  LAST_MODIFIED: 'beaute_elegance_last_modified'
};