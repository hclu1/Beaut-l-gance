import { useState, useEffect, useCallback } from 'react';
import { ProductService } from '../services/productService';
import { Product } from '../types';

// 🚀 OPTIMISATION: Hook moderne avec cache et real-time
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🚀 Fonction de rechargement mémorisée
  const refreshProducts = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      const data = await ProductService.getAllProducts(forceRefresh);
      setProducts(data);
    } catch (err) {
      console.error('Erreur récupération produits:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProducts();

    // 🚀 OPTIMISATION: Utiliser la nouvelle API realtime de Supabase
    const channel = ProductService.supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        (payload) => {
          console.log('Changement détecté:', payload);
          
          // 🚀 Mise à jour optimiste selon le type d'événement
          if (payload.eventType === 'INSERT') {
            setProducts(prev => [...prev, payload.new as Product]);
          } else if (payload.eventType === 'UPDATE') {
            setProducts(prev =>
              prev.map(p => p.id === payload.new.id ? payload.new as Product : p)
            );
          } else if (payload.eventType === 'DELETE') {
            setProducts(prev => prev.filter(p => p.id !== payload.old.id));
          }
          
          // Invalider le cache du service
          ProductService.invalidateCache();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [refreshProducts]);

  return { products, loading, error, refreshProducts };
}
