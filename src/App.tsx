import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product, Order, CartItem, SyncData } from './types';
import { initialProducts, SHOP_CONFIG, STORAGE_KEYS } from './constants';
import { supabase } from './services/productService'; 
import { 
  saveToStorage, 
  loadFromStorage, 
  extractSyncDataFromUrl,
} from './utils';
import Header from './components/Header';
import CategoryFilter from './components/CategoryFilter';
import ProductCard from './components/ProductCard';
import Cart from './components/Cart';
import FloatingCartIcon from './components/FloatingCartIcon';
import CheckoutModal from './components/CheckoutModal';
import AdminPanel from './components/AdminPanel';
import { ProductService } from './services/productService';
import { EmailService } from './services/emailService'; 

const App: React.FC = () => {
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [admin, setAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Produits avec état de chargement
  const [products, setProducts] = useState<Product[]>(() => 
    loadFromStorage(STORAGE_KEYS.PRODUCTS, [])
  );
  const [loading, setLoading] = useState(false);
  
  // --- ÉTAT COMMANDES ---
  const [orders, setOrders] = useState<Order[]>(() =>
    loadFromStorage(STORAGE_KEYS.ORDERS, [])
  );

  // --- ÉCOUTER LES COMMANDES EN TEMPS RÉEL (SUPABASE) ---
  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setOrders(data);
      }
    };

    fetchOrders();

    const channel = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        console.log('🔔 NOUVELLE COMMANDE REÇUE !', payload.new);
        setOrders((prev: Order[]) => {
          if (prev.some(o => o.id === payload.new.id)) return prev;
          return [payload.new as Order, ...prev];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ORDERS, orders);
  }, [orders]);

  // 🚀 OPTIMISATION 1: Générer QR Code une seule fois
  const qrCodeUrl = useMemo(() => {
    const currentUrl = window.location.href.split('?')[0];
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentUrl)}`;
  }, []);

  // 🚀 OPTIMISATION 2: Chargement optimisé avec cache
  useEffect(() => {
    let isMounted = true;
    
    const loadProducts = async () => {
      const cachedProducts = loadFromStorage(STORAGE_KEYS.PRODUCTS, []);
      if (cachedProducts.length > 0) {
        setProducts(cachedProducts);
      }

      try {
        setLoading(true);
        const data = await ProductService.getAllProducts();
        
        if (isMounted) {
          setProducts(data);
          saveToStorage(STORAGE_KEYS.PRODUCTS, data);
        }
      } catch (err) {
        console.error('Erreur chargement Supabase:', err);
        if (cachedProducts.length === 0) {
          setProducts(initialProducts);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  // Synchronisation URL (inchangé)
  useEffect(() => {
    const syncData = extractSyncDataFromUrl();
    if (syncData) {
      handleDataSync(syncData);
      const url = new URL(window.location.href);
      url.searchParams.delete('sync');
      window.history.replaceState({}, '', url.toString());

      setTimeout(() => {
        alert(`Synchronisation automatique réussie !\n\n` +
          `${syncData.products.length} produits importés\n` +
          `${syncData.orders.length} commandes importées\n` +
          `${new Date(syncData.timestamp).toLocaleString('fr-FR')}\n` +
          `Depuis: ${syncData.deviceId || 'Appareil inconnu'}\n\n` +
          `Ce magasin est maintenant synchronisé !`);
      }, 1000);
    }
  }, []);

  const handleDataSync = (syncData: SyncData) => {
    if (!syncData.products || !Array.isArray(syncData.products) ||
        !syncData.orders || !Array.isArray(syncData.orders)) {
      console.error('Données de synchronisation invalides');
      return;
    }
    setProducts(syncData.products);
    setOrders(syncData.orders);
  };

  const handleForceSync = () => {
    setProducts(initialProducts);
    setOrders([]);
    saveToStorage(STORAGE_KEYS.PRODUCTS, initialProducts);
    saveToStorage(STORAGE_KEYS.ORDERS, []);
    alert('Magasin réinitialisé avec les données d\'origine');
  };

  const reloadProductsFromSupabase = useCallback(async () => {
    try {
      console.log('Rechargement des produits depuis Supabase...');
      setLoading(true);
      const data = await ProductService.getAllProducts();
      setProducts(data);
      saveToStorage(STORAGE_KEYS.PRODUCTS, data);
      console.log('Produits rechargés:', data.length);
    } catch (error) {
      console.error('Erreur rechargement produits:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateRealPrice = useCallback((product: Product) => {
    if (product.quantite_reference && product.quantite_reference > 0) {
      return (product.prix_reference / product.quantite_reference) * 
             (product.quantite_reelle || product.quantite_reference);
    }
    return product.prix_reference;
  }, []);

  const addToCart = useCallback(async (product: Product) => {
    const stockQuantity = product.stock_unite ?? 0;
    
    if (stockQuantity <= 0) {
      alert('Produit en rupture de stock');
      return;
    }

    setCart(prevCart => {
      const index = prevCart.findIndex(item => item.id === product.id);
      if (index !== -1) {
        const updatedCart = [...prevCart];
        updatedCart[index].quantite_achat += 1;
        return updatedCart;
      }
      return [...prevCart, { ...product, quantite_achat: 1 }];
    });

    try {
      const newStock = stockQuantity - 1;
      await ProductService.updateStock(product.id, newStock);
      
      setProducts(prevProducts => (prevProducts || []).map(p =>
        p.id === product.id ? { ...p, stock_unite: newStock } : p
      ));
    } catch (error) {
      console.error('Erreur mise à jour stock:', error);
      alert('Erreur lors de la mise à jour du stock');
    }
  }, []);

  const removeFromCart = useCallback(async (index: number) => {
    const removedItem = cart[index];
    setCart(cart.filter((_, i) => i !== index));

    try {
      const product = (products || []).find(p => p.id === removedItem.id);
      if (product) {
        const currentStock = product.stock_unite ?? 0;
        const newStock = currentStock + removedItem.quantite_achat;
        await ProductService.updateStock(product.id, newStock);
        
        setProducts((products || []).map(p =>
          p.id === removedItem.id ? { ...p, stock_unite: newStock } : p
        ));
      }
    } catch (error) {
      console.error('Erreur remise stock:', error);
    }
  }, [cart, products]);

  const updateCartQuantity = useCallback(async (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(index);
      return;
    }
    
    const item = cart[index];
    const diff = newQuantity - item.quantite_achat;

    const product = (products || []).find(p => p.id === item.id);
    if (product) {
      const currentStock = product.stock_unite ?? 0;
      if (diff > 0 && currentStock < diff) {
        alert('Stock insuffisant');
        return;
      }
    }

    const updatedCart = [...cart];
    updatedCart[index].quantite_achat = newQuantity;
    setCart(updatedCart);

    try {
      if (product) {
        const currentStock = product.stock_unite ?? 0;
        const newStock = currentStock - diff;
        await ProductService.updateStock(product.id, newStock);
        
        setProducts((products || []).map(p =>
          p.id === item.id ? { ...p, stock_unite: newStock } : p
        ));
      }
    } catch (error) {
      console.error('Erreur mise à jour stock:', error);
    }
  }, [cart, products, removeFromCart]);

 const handleCheckout = useCallback(async (customerInfo: any) => {
  const total = (cart || []).reduce((sum, item) => {
    const realPrice = calculateRealPrice(item);
    const finalPrice = realPrice * (1 - (item.reduction ?? 0) / 100);
    return sum + finalPrice * item.quantite_achat;
  }, 0);

  const newOrder: Order = {
    id: Date.now().toString(),
    date: new Date().toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }),
    items: [...cart],
    total,
    status: 'pending',
    paymentMode: 'espece',
    customerInfo,
    preparedItems: {}
  };

  try {
    await ProductService.saveOrder(newOrder);
    console.log('Commande sauvegardée dans Supabase');
    
    EmailService.sendOrderNotification(newOrder);

    setOrders([newOrder, ...orders]);
    setCart([]);
    setShowCheckout(false);

    const customerName = customerInfo.nom && customerInfo.prenom
      ? `${customerInfo.prenom} ${customerInfo.nom}`
      : customerInfo.nom || customerInfo.prenom || 'Client';

    alert(`Commande validée pour ${customerName}!\nNuméro: #${newOrder.id}\nSauvegardée dans Supabase.`);
  } catch (error) {
    console.error('Erreur sauvegarde commande:', error);
    
    setOrders([newOrder, ...orders]);
    setCart([]);
    setShowCheckout(false);
    
    alert(`Commande validée mais erreur de sauvegarde Supabase.\nCommande sauvegardée localement.`);
  }
}, [cart, orders, calculateRealPrice]);

  // 🚀 OPTIMISATION 6: Mémoriser le filtrage et le regroupement
const { filteredProducts, groupedProducts } = useMemo(() => {
  // SÉCURITÉ : On s'assure que products est bien un tableau
  const currentProducts = products || [];
  
  // Filtrage
  const filtered = currentProducts.filter(product => {
    const matchesCat = !selectedCat || product.categorie === selectedCat;
    const matchesSearch = !searchTerm ||
      product.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.marque.toLowerCase().includes(searchTerm.toLowerCase());
    
    const hasStock = (product.stock_unite ?? 0) > 0;
    
    return matchesCat && matchesSearch && hasStock;
  });

  // Regroupement par nom + marque + quantité_reelle
  const uniqueProductsMap = new Map<string, Product>();

  filtered.forEach(product => {
    const key = `${product.nom.toLowerCase()}-${product.marque.toLowerCase()}-${product.quantite_reelle || 0}ml`;
    
    if (uniqueProductsMap.has(key)) {
      const existing = uniqueProductsMap.get(key)!;
      uniqueProductsMap.set(key, {
        ...existing,
        stock_unite: (existing.stock_unite || 0) + (product.stock_unite || 0)
      });
    } else {
      uniqueProductsMap.set(key, { ...product });
    }
  });

  const uniqueProducts = Array.from(uniqueProductsMap.values());

  // Regroupement des variantes
  const variantGroups = new Map<string, Product[]>();

  uniqueProducts.forEach(product => {
    const baseKey = `${product.nom.toLowerCase()}-${product.marque.toLowerCase()}`;
    
    if (!variantGroups.has(baseKey)) {
      variantGroups.set(baseKey, []);
    }
    variantGroups.get(baseKey)!.push(product);
  });

  const groupedProducts = Array.from(variantGroups.values())
    .map(group => {
      const uniqueQuantities = new Set(group.map(p => p.quantite_reelle));
      
      if (uniqueQuantities.size > 1) {
        return group.sort((a, b) => (a.quantite_reelle || 0) - (b.quantite_reelle || 0));
      } else {
        return [group[0]];
      }
    });

  return { filteredProducts: filtered, groupedProducts };
}, [products, selectedCat, searchTerm]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="relative z-10 font-sans pt-4 md:pt-8 pb-12 px-2 md:px-4 max-w-6xl mx-auto">
        {/* Header avec QR Code */}
        <header className="mb-8">
          <div className="text-center mb-6">
          <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
  TEST DU BON DOSSIER
</h1>
            <p className="text-gray-600 text-sm md:text-base">Votre boutique de beauté exclusive</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full sm:max-w-md">
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <button
              onClick={() => setShowQR(!showQR)}
              className="px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors text-sm md:text-base"
            >
              Partager
            </button>
          </div>

          {/* Modal QR Code */}
          {showQR && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowQR(false)}
            >
              <div className="bg-white rounded-lg p-6 text-center max-w-sm w-full" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-4">Partager la boutique</h3>
                <img 
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="mx-auto mb-4 border rounded"
                  loading="lazy"
                />
                <p className="text-sm text-gray-600 mb-4">
                  Scannez ce QR code pour accéder à la boutique
                </p>
                <button
                  onClick={() => setShowQR(false)}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          )}
        </header>

        {/* Filtre de catégories */}
        <CategoryFilter selectedCat={selectedCat} setSelectedCat={setSelectedCat} />

        {/* Indicateur de chargement */}
        {loading && (
          <div className="text-center py-4 text-purple-600">
            Mise à jour des produits...
          </div>
        )}

             {/* Grille des produits */}
      {/*  <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8" layout>
          <AnimatePresence>
            {groupedProducts?.map((variants, index) => {
              if (!variants || variants.length === 0) return null;
              
              const mainProduct = variants[0];
              
              return (
                <motion.div
                  key={mainProduct.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: Math.min(index * 0.05, 0.3) }}
                  layout
                >
                  <ProductCard
                    product={mainProduct}
                    variants={variants}
                    onAddToCart={addToCart}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>*/}

        {(!groupedProducts || groupedProducts.length === 0) && !loading && (
          <motion.div className="text-center py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="text-4xl md:text-6xl mb-4">🔍</div>
            <h3 className="text-lg md:text-xl font-semibold text-gray-600 mb-2">Aucun produit trouvé</h3>
            <p className="text-gray-500">Essayez de modifier vos critères de recherche</p>
          </motion.div>
        )}

        <Cart
          cart={cart}
          removeFromCart={removeFromCart}
          updateQuantity={updateCartQuantity}
        />

        {!admin && (
          <button
            onClick={() => {
              const code = prompt("Code d'accès administrateur :");
              if (code === "marina2025") {
                setAdmin(true);
              } else if (code !== null) {
                alert("Code incorrect");
              }
            }}
            className="fixed top-4 left-4 w-8 h-8 md:w-10 md:h-10 bg-gray-200 hover:bg-gray-300 rounded-full opacity-30 hover:opacity-100 transition-opacity z-30 text-xs md:text-sm flex items-center justify-center"
          >
            ⚙️
          </button>
        )}

       {admin && (
  <AdminPanel
    products={products}
    setProducts={setProducts}
    orders={orders}
    setOrders={setOrders}
    onReloadProducts={reloadProductsFromSupabase}
    setAdmin={setAdmin}
          />
        )}

        <AnimatePresence>
          <FloatingCartIcon
            cart={cart}
            onClick={() => setShowCheckout(true)}
          />
        </AnimatePresence>

        {showCheckout && (
          <CheckoutModal
            cart={cart}
            onClose={() => setShowCheckout(false)}
            onConfirm={handleCheckout}
            updateQuantity={updateCartQuantity}
            removeFromCart={removeFromCart}
          />
        )}
      </div>
    </div>
  );
};

export default App;