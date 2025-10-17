import { createClient } from '@supabase/supabase-js';
import { Product, Order } from '../types';

// Configuration Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('ProductService: Configuration Supabase');
console.log('URL:', supabaseUrl ? 'Présente' : 'MANQUANTE');
console.log('Key:', supabaseKey ? 'Présente' : 'MANQUANTE');

if (!supabaseUrl || !supabaseKey) {
  console.error('Variables d\'environnement Supabase manquantes !');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// 🚀 OPTIMISATION 1: Cache simple en mémoire
let productsCache: { data: Product[] | null; timestamp: number | null } = {
  data: null,
  timestamp: null
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// 🚀 CORRECTION: Générer un ID de variant basé sur nom + marque + quantité_réelle
const generateVariantId = (nom: string, marque: string, quantiteReelle?: number): string => {
  const baseName = nom.toLowerCase().replace(/\s+/g, '-');
  const baseBrand = marque.toLowerCase().replace(/\s+/g, '-');
  
  // Si quantite_reelle est fournie, créer un ID unique pour cette quantité
  if (quantiteReelle && quantiteReelle > 0) {
    return `${baseName}-${baseBrand}-${quantiteReelle}ml`;
  }
  
  // Sinon, ID de base sans quantité
  return `${baseName}-${baseBrand}`;
};

// 🚀 NOUVELLE FONCTION: Extraire l'ID de base sans la quantité
const getBaseVariantId = (variantId: string): string => {
  return variantId.replace(/-\d+ml$/, '');
};

export const ProductService = {
  // 🚀 OPTIMISATION 2: Upload d'image avec compression
  async uploadImage(file: File): Promise<string> {
    try {
      console.log('ProductService: Upload image...', file.name);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '31536000', // 1 an de cache
          upsert: false
        });

      if (error) {
        console.error('Erreur upload image:', error);
        throw error;
      }

      // Récupérer l'URL publique avec transformations
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath, {
          transform: {
            width: 800,
            height: 800,
            quality: 80,
            format: 'webp'
          }
        });

      console.log('Image uploadée:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Exception uploadImage:', error);
      throw error;
    }
  },

  async deleteImage(imageUrl: string): Promise<void> {
    try {
      const fileName = imageUrl.split('/').pop();
      if (!fileName) return;

      console.log('ProductService: Suppression image...', fileName);
      
      const { error } = await supabase.storage
        .from('product-images')
        .remove([fileName]);

      if (error) {
        console.error('Erreur suppression image:', error);
        throw error;
      }

      console.log('Image supprimée');
    } catch (error) {
      console.error('Exception deleteImage:', error);
      throw error;
    }
  },

  // 🚀 OPTIMISATION 3: getAllProducts avec cache et sélection spécifique
  async getAllProducts(forceRefresh = false): Promise<Product[]> {
    try {
      // Vérifier le cache si pas de force refresh
      if (!forceRefresh && productsCache.data && productsCache.timestamp) {
        const now = Date.now();
        if (now - productsCache.timestamp < CACHE_DURATION) {
          console.log('ProductService: Produits récupérés du cache');
          return productsCache.data;
        }
      }

      console.log('ProductService: Récupération des produits depuis Supabase...');
      
      // 🚀 Sélectionner uniquement les colonnes nécessaires
      const { data, error } = await supabase
        .from('products')
        .select('id, nom, marque, prix_reference, reduction, image_url, categorie, quantite_reference, quantite_reelle, stock_unite, emplacement_stock, description, variant_id')
        .gt('stock_unite', 0) // 🚀 Filtrer côté serveur les produits en stock
        .order('nom', { ascending: true });

      if (error) {
        console.error('Erreur Supabase getAllProducts:', error);
        throw error;
      }

      // Mettre à jour le cache
      productsCache = {
        data: data || [],
        timestamp: Date.now()
      };

      console.log('Produits récupérés depuis Supabase:', data?.length);
      return data || [];
    } catch (error) {
      console.error('Exception getAllProducts:', error);
      
      // Retourner le cache en cas d'erreur si disponible
      if (productsCache.data) {
        console.log('Utilisation du cache en fallback');
        return productsCache.data;
      }
      
      throw error;
    }
  },

  // 🚀 OPTIMISATION 4: Invalider le cache
  invalidateCache(): void {
    productsCache = { data: null, timestamp: null };
    console.log('Cache invalidé');
  },

  async addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    try {
      console.log('ProductService: Ajout produit...', product.nom);
      
      const productToInsert: any = {
        nom: product.nom,
        marque: product.marque,
        prix_reference: product.prix_reference,
        reduction: product.reduction || 0,
        image_url: product.image_url || '',
        categorie: product.categorie || 'makeup'
      };
      
      if (product.quantite_reference !== undefined) {
        productToInsert.quantite_reference = product.quantite_reference;
      }
      
      if (product.quantite_reelle !== undefined) {
        productToInsert.quantite_reelle = product.quantite_reelle;
      }
      
      if (product.stock_unite !== undefined) {
        productToInsert.stock_unite = product.stock_unite;
      }
      
      if (product.emplacement_stock !== undefined) {
        productToInsert.emplacement_stock = product.emplacement_stock;
      }
      
      if (product.description !== undefined) {
        productToInsert.description = product.description;
      }
      
      if (product.variant_id !== undefined) {
        productToInsert.variant_id = product.variant_id;
      }
      
      const { data, error } = await supabase
        .from('products')
        .insert([productToInsert])
        .select()
        .single();

      if (error) {
        console.error('Erreur Supabase addProduct:', error);
        throw error;
      }

      // 🚀 Invalider le cache après ajout
      this.invalidateCache();
      
      console.log('Produit ajouté:', data?.nom);
      return data;
    } catch (error) {
      console.error('Exception addProduct:', error);
      throw error;
    }
  },

  // 🚀 OPTIMISATION 5: Batch update pour le stock
  async updateStock(productId: number, newStock: number): Promise<void> {
    try {
      console.log(`ProductService: Mise à jour stock produit ${productId} → ${newStock}`);
      
      const { error } = await supabase
        .from('products')
        .update({ stock_unite: newStock })
        .eq('id', productId);

      if (error) {
        console.error('Erreur Supabase updateStock:', error);
        throw error;
      }

      // 🚀 Mise à jour du cache local sans refetch complet
      if (productsCache.data) {
        productsCache.data = productsCache.data.map(p =>
          p.id === productId ? { ...p, stock_unite: newStock } : p
        );
      }

      console.log('Stock mis à jour');
    } catch (error) {
      console.error('Exception updateStock:', error);
      throw error;
    }
  },

  async updateProduct(productId: number, updates: Partial<Product>): Promise<void> {
    try {
      console.log(`ProductService: Mise à jour produit ${productId}`, updates);
      
      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', productId);

      if (error) {
        console.error('Erreur Supabase updateProduct:', error);
        throw error;
      }

      // 🚀 Invalider le cache après mise à jour
      this.invalidateCache();
      
      console.log('Produit mis à jour');
    } catch (error) {
      console.error('Exception updateProduct:', error);
      throw error;
    }
  },

  async deleteProduct(productId: number): Promise<void> {
    try {
      console.log(`ProductService: Suppression produit ${productId}`);
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        console.error('Erreur Supabase deleteProduct:', error);
        throw error;
      }

      // 🚀 Invalider le cache après suppression
      this.invalidateCache();
      
      console.log('Produit supprimé');
    } catch (error) {
      console.error('Exception deleteProduct:', error);
      throw error;
    }
  },

  async saveOrder(order: Order): Promise<void> {
    try {
      console.log('ProductService: Sauvegarde commande', order.id);
      
      const { error: orderError } = await supabase
        .from('orders')
        .insert([{
          id: order.id,
          date: order.date,
          total: order.total,
          status: order.status,
          payment_mode: order.paymentMode,
          customer_info: order.customerInfo,
          prepared_items: order.preparedItems
        }]);

      if (orderError) {
        console.error('Erreur Supabase saveOrder:', orderError);
        throw orderError;
      }

      const orderItems = order.items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        nom: item.nom,
        marque: item.marque,
        prix_reference: item.prix_reference,
        reduction: item.reduction,
        quantite_achat: item.quantite_achat,
        image_url: item.image_url,
        categorie: item.categorie
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Erreur Supabase saveOrderItems:', itemsError);
        throw itemsError;
      }

      console.log('Commande sauvegardée');
    } catch (error) {
      console.error('Exception saveOrder:', error);
      throw error;
    }
  },

  async getAllOrders(): Promise<Order[]> {
    try {
      console.log('ProductService: Récupération des commandes...');
      
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false })
        .limit(100); // 🚀 Limiter le nombre de commandes récupérées

      if (ordersError) {
        console.error('Erreur Supabase getAllOrders:', ordersError);
        throw ordersError;
      }

      const result = orders?.map(order => ({
        id: order.id,
        date: order.date,
        total: order.total,
        status: order.status,
        paymentMode: order.payment_mode,
        customerInfo: order.customer_info,
        preparedItems: order.prepared_items,
        items: order.order_items.map((item: any) => ({
          id: item.product_id,
          nom: item.nom,
          marque: item.marque,
          prix_reference: item.prix_reference,
          reduction: item.reduction,
          quantite_achat: item.quantite_achat,
          quantite_reelle: 0,
          image_url: item.image_url,
          categorie: item.categorie,
          prepared: order.prepared_items?.[item.product_id] || false
        }))
      })) || [];

      console.log('Commandes récupérées:', result.length);
      return result;
    } catch (error) {
      console.error('Exception getAllOrders:', error);
      throw error;
    }
  },

  async updateOrderStatus(orderId: string, newStatus: string): Promise<void> {
    try {
      console.log(`ProductService: Changement statut commande ${orderId} vers ${newStatus}`);
      
      const { data, error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)
        .select('*');

      if (error) {
        console.error('Erreur mise à jour statut Supabase:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.error('Aucune commande trouvée avec l\'ID:', orderId);
        throw new Error('Commande non trouvée');
      }

      console.log('Statut mis à jour avec succès:', data[0]);
    } catch (error) {
      console.error('Exception updateOrderStatus:', error);
      throw error;
    }
  },

  async deleteOrder(orderId: string): Promise<void> {
    try {
      console.log(`ProductService: Suppression commande ${orderId}`);
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);

      if (itemsError) {
        console.error('Erreur suppression items:', itemsError);
        throw itemsError;
      }

      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (orderError) {
        console.error('Erreur suppression commande:', orderError);
        throw orderError;
      }

      console.log('Commande supprimée définitivement');
    } catch (error) {
      console.error('Exception deleteOrder:', error);
      throw error;
    }
  },
  
  // 🚀 CORRECTION: Ajouter un produit avec gestion intelligente des variantes
  async addProductWithVariant(productData: Partial<Product>): Promise<Product> {
    try {
      console.log('🔍 Ajout produit avec détection variantes:', {
        nom: productData.nom,
        marque: productData.marque,
        quantite_reelle: productData.quantite_reelle
      });

      // Chercher tous les produits avec même nom et marque
      const allProducts = await this.getAllProducts();
      const sameNameBrand = allProducts.filter(p =>
        p.nom.toLowerCase() === productData.nom?.toLowerCase() &&
        p.marque.toLowerCase() === productData.marque?.toLowerCase()
      );

      let variantId: string;

      if (sameNameBrand.length > 0) {
        // Il existe déjà des produits avec ce nom/marque
        const sameQuantity = sameNameBrand.find(p => 
          p.quantite_reelle === productData.quantite_reelle
        );

        if (sameQuantity) {
          // 🚀 MÊME QUANTITÉ = MÊME PRODUIT (différent emplacement)
          // Utiliser le même variant_id
          variantId = sameQuantity.variant_id || 
                     generateVariantId(productData.nom || '', productData.marque || '', productData.quantite_reelle);
          
          console.log('⚠️ Produit identique trouvé (même quantité) - Utilisation du même variant_id:', variantId);
        } else {
          // 🎯 QUANTITÉ DIFFÉRENTE = VRAIE VARIANTE
          // Extraire l'ID de base et ajouter la nouvelle quantité
          const baseId = getBaseVariantId(sameNameBrand[0].variant_id || 
                                         generateVariantId(productData.nom || '', productData.marque || ''));
          variantId = `${baseId}-${productData.quantite_reelle}ml`;
          
          console.log('✅ Nouvelle variante détectée (quantité différente) - Nouveau variant_id:', variantId);
        }
      } else {
        // Nouveau produit unique
        variantId = generateVariantId(productData.nom || '', productData.marque || '', productData.quantite_reelle);
        console.log('🆕 Nouveau produit unique - Génération variant_id:', variantId);
      }

      const productWithVariant = {
        ...productData,
        variant_id: variantId
      };

      return await this.addProduct(productWithVariant as Omit<Product, 'id'>);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du produit avec variante:', error);
      throw error;
    }
  },

  // 🚀 CORRECTION: Récupérer les produits similaires (même nom, marque ET quantité = MÊME produit)
  async getSimilarProducts(nom: string, marque: string, quantiteReelle?: number): Promise<Product[]> {
    try {
      const allProducts = await this.getAllProducts();
      
      return allProducts.filter(product => 
        product.nom.toLowerCase() === nom.toLowerCase() && 
        product.marque.toLowerCase() === marque.toLowerCase() &&
        // 🚀 IMPORTANT: Si quantité fournie, filtrer aussi par quantité
        (quantiteReelle === undefined || product.quantite_reelle === quantiteReelle)
      );
    } catch (error) {
      console.error('Erreur lors de la recherche de produits similaires:', error);
      return [];
    }
  },

  // 🚀 CORRECTION: Récupérer uniquement les VRAIES variantes (quantités différentes)
  async getProductVariants(variantId: string): Promise<Product[]> {
    try {
      const allProducts = await this.getAllProducts();
      
      // Extraire l'ID de base du variant_id (retirer la quantité)
      const baseId = getBaseVariantId(variantId);
      
      // Filtrer les produits qui ont le même ID de base
      const variants = allProducts.filter(product => {
        if (!product.variant_id) return false;
        const productBaseId = getBaseVariantId(product.variant_id);
        return productBaseId === baseId;
      });

      // 🚀 IMPORTANT: Ne retourner que s'il y a plusieurs quantités différentes
      const uniqueQuantities = new Set(variants.map(v => v.quantite_reelle));
      
      if (uniqueQuantities.size <= 1) {
        // Une seule quantité = pas de vraies variantes, retourner tableau vide
        console.log('⚠️ Pas de vraies variantes (même quantité pour tous)', variantId);
        return [];
      }

      console.log(`✅ ${variants.length} vraies variantes trouvées pour`, baseId);
      return variants.sort((a, b) => (a.quantite_reelle || 0) - (b.quantite_reelle || 0));
    } catch (error) {
      console.error('Erreur lors de la récupération des variantes:', error);
      return [];
    }
  }
};

export default ProductService;
