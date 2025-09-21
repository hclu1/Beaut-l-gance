import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product, Order, CartItem, SyncData } from './types';
import { initialProducts, SHOP_CONFIG, STORAGE_KEYS } from './constants';
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
import DiscreteAdminButton from './components/DiscreteAdminButton';
import AdminPanel from './components/AdminPanel';
import { ProductService } from './services/productService';

const App: React.FC = () => {
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [admin, setAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  
  // NOUVEAU : État pour QR Code
  const [showQR, setShowQR] = useState(false);

  // Produits chargés depuis Supabase uniquement
  const [products, setProducts] = useState<Product[]>([]);
  
  // Commandes chargées depuis localStorage pour le moment
  const [orders, setOrders] = useState<Order[]>(() =>
    loadFromStorage(STORAGE_KEYS.ORDERS, [])
  );

  // NOUVEAU : Fonction pour générer QR Code
  const generateQRCode = () => {
    const boutqueUrl = window.location.origin;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(boutqueUrl)}`;
  };

  // Chargement initial des produits depuis Supabase
  useEffect(() => {
    console.log('Chargement des produits depuis Supabase...');
    
    ProductService.getAllProducts()
      .then(data => {
        setProducts(data);
        console.log('Produits chargés depuis Supabase:', data.length);
      })
      .catch(err => {
        console.error('Erreur chargement produits:', err);
        // Fallback vers données initiales en cas d'erreur
        setProducts(initialProducts);
        console.log('Fallback vers données initiales');
      });

    // Écouter l'événement de fermeture admin
    const handleCloseAdmin = () => setAdmin(false);
    window.addEventListener('closeAdmin', handleCloseAdmin);
    
    return () => {
      window.removeEventListener('closeAdmin', handleCloseAdmin);
    };
  }, []);

  // Synchronisation des données via URL (QR code) au chargement
  useEffect(() => {
    const syncData = extractSyncDataFromUrl();
    if (syncData) {
      handleDataSync(syncData);
      const url = new URL(window.location.href);
      url.searchParams.delete('sync');
      window.history.replaceState({}, '', url.toString());

      setTimeout(() => {
        alert(`✅ Synchronisation automatique réussie !\n\n` +
          `📦 ${syncData.products.length} produits importés\n` +
          `📋 ${syncData.orders.length} commandes importées\n` +
          `🕒 ${new Date(syncData.timestamp).toLocaleString('fr-FR')}\n` +
          `📱 Depuis: ${syncData.deviceId || 'Appareil inconnu'}\n\n` +
          `🔄 Ce magasin est maintenant synchronisé !`);
      }, 1000);
    }
  }, []);

  // Sauvegarde automatique des commandes dans le localStorage
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ORDERS, orders);
  }, [orders]);

  // Fonction de synchronisation des données reçues
  const handleDataSync = (syncData: SyncData) => {
    if (!syncData.products || !Array.isArray(syncData.products) ||
        !syncData.orders || !Array.isArray(syncData.orders)) {
      console.error('Données de synchronisation invalides');
      return;
    }
    setProducts(syncData.products);
    setOrders(syncData.orders);
  };

  // Réinitialisation forcée des données
  const handleForceSync = () => {
    setProducts(initialProducts);
    setOrders([]);
    saveToStorage(STORAGE_KEYS.PRODUCTS, initialProducts);
    saveToStorage(STORAGE_KEYS.ORDERS, []);
    alert('Magasin réinitialisé avec les données d\'origine');
  };

  // Fonction pour recharger les produits depuis Supabase
  const reloadProductsFromSupabase = async () => {
    try {
      console.log('Rechargement des produits depuis Supabase...');
      const data = await ProductService.getAllProducts();
      setProducts(data);
      console.log('Produits rechargés:', data.length);
    } catch (error) {
      console.error('Erreur rechargement produits:', error);
    }
  };

  // Gestion panier : ajout produit avec mise à jour Supabase
  const addToCart = async (product: Product) => {
    if (product.quantite_reelle <= 0) {
      alert('Produit en rupture de stock');
      return;
    }

    const index = cart.findIndex(item => item.id === product.id);
    if (index !== -1) {
      const updatedCart = [...cart];
      updatedCart[index].quantite_achat += 1;
      setCart(updatedCart);
    } else {
      setCart([...cart, { ...product, quantite_achat: 1 }]);
    }

    // Mettre à jour le stock dans Supabase ET l'état local
    try {
      const newStock = product.quantite_reelle - 1;
      await ProductService.updateStock(product.id, newStock);
      
      // Mettre à jour l'état local seulement après succès Supabase
      setProducts(products.map(p =>
        p.id === product.id ? { ...p, quantite_reelle: newStock } : p
      ));
    } catch (error) {
      console.error('Erreur mise à jour stock:', error);
      alert('Erreur lors de la mise à jour du stock');
    }
  };

  // Supprimer un item du panier avec mise à jour stock Supabase
  const removeFromCart = async (index: number) => {
    const removedItem = cart[index];
    setCart(cart.filter((_, i) => i !== index));

    // Remettre le stock dans Supabase
    try {
      const product = products.find(p => p.id === removedItem.id);
      if (product) {
        const newStock = product.quantite_reelle + removedItem.quantite_achat;
        await ProductService.updateStock(product.id, newStock);
        
        setProducts(products.map(p =>
          p.id === removedItem.id ? { ...p, quantite_reelle: newStock } : p
        ));
      }
    } catch (error) {
      console.error('Erreur remise stock:', error);
    }
  };

  // Modifier la quantité d'un item dans le panier avec Supabase
  const updateCartQuantity = async (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(index);
      return;
    }
    
    const item = cart[index];
    const diff = newQuantity - item.quantite_achat;

    const product = products.find(p => p.id === item.id);
    if (product && diff > 0 && product.quantite_reelle < diff) {
      alert('Stock insuffisant');
      return;
    }

    const updatedCart = [...cart];
    updatedCart[index].quantite_achat = newQuantity;
    setCart(updatedCart);

    // Mettre à jour le stock dans Supabase
    try {
      if (product) {
        const newStock = product.quantite_reelle - diff;
        await ProductService.updateStock(product.id, newStock);
        
        setProducts(products.map(p =>
          p.id === item.id ? { ...p, quantite_reelle: newStock } : p
        ));
      }
    } catch (error) {
      console.error('Erreur mise à jour stock:', error);
    }
  };

  // Finalisation commande avec sauvegarde Supabase
  const handleCheckout = async (customerInfo: any) => {
    const total = cart.reduce((sum, item) =>
      sum + (item.prix_reference * (1 - item.reduction / 100) * item.quantite_achat), 0
    );

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
      // Sauvegarder la commande dans Supabase
      await ProductService.saveOrder(newOrder);
      console.log('Commande sauvegardée dans Supabase');
      
      // Puis mettre à jour l'état local
      setOrders([newOrder, ...orders]);
      setCart([]);
      setShowCheckout(false);

      const customerName = customerInfo.nom && customerInfo.prenom
        ? `${customerInfo.prenom} ${customerInfo.nom}`
        : customerInfo.nom || customerInfo.prenom || 'Client';

      alert(`✅ Commande validée pour ${customerName}!\nNuméro: #${newOrder.id}\nSauvegardée dans Supabase.`);
    } catch (error) {
      console.error('Erreur sauvegarde commande:', error);
      
      // En cas d'erreur Supabase, sauvegarder quand même localement
      setOrders([newOrder, ...orders]);
      setCart([]);
      setShowCheckout(false);
      
      alert(`⚠️ Commande validée mais erreur de sauvegarde Supabase.\nCommande sauvegardée localement.`);
    }
  };

  // Filtrage des produits selon catégorie et recherche
  const filteredProducts = products.filter(product => {
    const matchesCat = !selectedCat || product.categorie === selectedCat;
    const matchesSearch = !searchTerm ||
      product.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.marque.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="relative z-10 font-sans pt-4 md:pt-8 pb-12 px-2 md:px-4 max-w-6xl mx-auto">
        {/* MODIFIÉ : Header avec QR Code intégré */}
        <header className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
              ✨ Beauté-légance ✨
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
              📱 Partager
            </button>
          </div>

          {/* NOUVEAU : Modal QR Code */}
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
                  src={generateQRCode()}
                  alt="QR Code"
                  className="mx-auto mb-4 border rounded"
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

        <CategoryFilter
          selectedCat={selectedCat}
          setSelectedCat={setSelectedCat}
        />

        {/* MODIFIÉ : Grille responsive optimisée */}
        <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8" layout>
          <AnimatePresence>
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                layout
              >
                <ProductCard
                  product={product}
                  onAddToCart={addToCart}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredProducts.length === 0 && (
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

        {/* MODIFIÉ : Bouton admin responsive */}
        {!admin && (
          <button
            onClick={() => setAdmin(true)}
            className="fixed top-4 left-4 w-8 h-8 md:w-10 md:h-10 bg-gray-200 hover:bg-gray-300 rounded-full opacity-30 hover:opacity-100 transition-opacity z-30 text-xs md:text-sm"
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