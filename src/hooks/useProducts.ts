import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fonction pour récupérer les produits depuis Supabase
    async function fetchProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('*');
      if (error) {
        console.error('Erreur récupération produits:', error.message);
      } else {
        setProducts(data || []);
      }
      setLoading(false);
    }

    fetchProducts();

    // Écoute en temps réel des changements sur la table "products"
    const subscription = supabase
      .from('products')
      .on('*', payload => {
        console.log('Changement reçu:', payload);
        // Recharger la liste après modification
        fetchProducts();
      })
      .subscribe();

    // Cleanup pour désabonnement à la déconnexion du composant
    return () => {
      supabase.removeSubscription(subscription);
    };
  }, []);

  return { products, loading };
}
