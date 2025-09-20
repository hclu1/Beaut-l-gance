import { createClient } from '@supabase/supabase-js';
import { Product, Order } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('ProductService: Configuration Supabase');
console.log('URL:', supabaseUrl ? 'Présente' : 'MANQUANTE');
console.log('Key:', supabaseKey ? 'Présente' : 'MANQUANTE');

if (!supabaseUrl || !supabaseKey) {
  console.error('Variables d\'environnement Supabase manquantes !');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export const ProductService = {
  // Upload d'une image vers Supabase Storage
  async uploadImage(file: File): Promise<string> {
    try {
      console.log('ProductService: Upload image...', file.name);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (error) {
        console.error('Erreur upload image:', error);
        throw error;
      }

      // Récupérer l'URL publique de l'image
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      console.log('Image uploadée:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Exception uploadImage:', error);
      throw error;
    }
  },

  // Supprimer une image du Storage
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extraire le nom du fichier de l'URL
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

  // Récupérer tous les produits
  async getAllProducts(): Promise<Product[]> {
    try {
      console.log('ProductService: Récupération des produits...');
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error('Erreur Supabase getAllProducts:', error);
        throw error;
      }

      console.log('Produits récupérés depuis Supabase:', data);
      return data || [];
    } catch (error) {
      console.error('Exception getAllProducts:', error);
      throw error;
    }
  },

  // Ajouter un nouveau produit
  async addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    try {
      console.log('ProductService: Ajout produit...', product.nom);
      
      // S'assurer que tous les nouveaux champs sont présents
      const productToInsert = {
        ...product,
        quantite_reference: product.quantite_reference || 100,
        stock_unite: product.stock_unite || 0,
        emplacement_stock: product.emplacement_stock || '',
        description: product.description || ''
      };
      
      const { data, error } = await supabase
        .from('products')
        .insert([productToInsert])
        .select()
        .single();

      if (error) {
        console.error('Erreur Supabase addProduct:', error);
        throw error;
      }

      console.log('Produit ajouté:', data?.nom);
      return data;
    } catch (error) {
      console.error('Exception addProduct:', error);
      throw error;
    }
  },

  // Mettre à jour le stock d'un produit
  async updateStock(productId: number, newStock: number): Promise<void> {
    try {
      console.log(`ProductService: Mise à jour stock produit ${productId} → ${newStock}`);
      
      const { error } = await supabase
        .from('products')
        .update({ 
          quantite_reelle: newStock, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', productId);

      if (error) {
        console.error('Erreur Supabase updateStock:', error);
        throw error;
      }

      console.log('Stock mis à jour');
    } catch (error) {
      console.error('Exception updateStock:', error);
      throw error;
    }
  },

  // Mettre à jour un produit complet
  async updateProduct(productId: number, updates: Partial<Product>): Promise<void> {
    try {
      console.log(`ProductService: Mise à jour produit ${productId}`, updates);
      
      const { error } = await supabase
        .from('products')
        .update({ 
          ...updates, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', productId);

      if (error) {
        console.error('Erreur Supabase updateProduct:', error);
        throw error;
      }

      console.log('Produit mis à jour');
    } catch (error) {
      console.error('Exception updateProduct:', error);
      throw error;
    }
  },

  // Supprimer un produit
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

      console.log('Produit supprimé');
    } catch (error) {
      console.error('Exception deleteProduct:', error);
      throw error;
    }
  },

  // Sauvegarder une commande
  async saveOrder(order: Order): Promise<void> {
    try {
      console.log('ProductService: Sauvegarde commande', order.id);
      
      // D'abord, insérer la commande
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

      // Ensuite, insérer les items de la commande
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

  // Récupérer toutes les commandes
  async getAllOrders(): Promise<Order[]> {
    try {
      console.log('ProductService: Récupération des commandes...');
      
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Erreur Supabase getAllOrders:', ordersError);
        throw ordersError;
      }

      // Reconstituer la structure Order
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
          categorie: item.categorie
        }))
      })) || [];

      console.log('Commandes récupérées:', result.length);
      return result;
    } catch (error) {
      console.error('Exception getAllOrders:', error);
      throw error;
    }
  },

  // Mettre à jour le statut d'une commande - VERSION CORRIGÉE
  async updateOrderStatus(orderId: string, newStatus: string): Promise<void> {
    try {
      console.log(`ProductService: Changement statut commande ${orderId} vers ${newStatus}`);
      
      // Mettre à jour le statut dans Supabase
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

      console.log('Statut mis à jour avec succès dans Supabase:', data[0]);
      return;
    } catch (error) {
      console.error('Exception updateOrderStatus:', error);
      throw error;
    }
  },

  // Supprimer une commande définitivement
  async deleteOrder(orderId: string): Promise<void> {
    try {
      console.log(`ProductService: Suppression commande ${orderId}`);
      
      // Supprimer d'abord les items de la commande (à cause des contraintes de clé étrangère)
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);

      if (itemsError) {
        console.error('Erreur suppression items:', itemsError);
        throw itemsError;
      }

      // Puis supprimer la commande
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
  }
};