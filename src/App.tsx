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
import AdminPanel from './components/AdminPanel';
import { ProductService } from './services/productService';

const App: React.FC = () => {
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [admin, setAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Produits chargés depuis Supabase uniquement
  const [products, setProducts] = useState<Product[]>([]);
  
  // Commandes chargées depuis localStorage pour le moment
  const [orders, setOrders] = useState<Order[]>(() =>
    loadFromStorage(STORAGE_KEYS.ORDERS, [])
  );

  // Fonction pour générer QR Code
  const generateQRCode = () => {
    const currentUrl = window.location.href.split('?')[0];
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentUrl)}`;
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
        setProducts(initialProducts);
        console.log('Fallback vers données initiales');
      });

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
        alert(`Synchronisation automatique réussie !\n\n` +
          `${syncData.products.length} produits importés\n` +
          `${syncData.orders.length} commandes importées\n` +
          `${new Date(syncData.timestamp).toLocaleString('fr-FR')}\n` +
          `Depuis: ${syncData.deviceId || 'Appareil inconnu'}\n\n` +
          `Ce magasin est maintenant synchronisé !`);
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

  // Fonction pour calculer le prix réel d'un produit
  const calculateRealPrice = (product: Product) => {
    if (product.quantite_reference && product.quantite_reference > 0) {
      return (product.prix_reference / product.quantite_reference) * (product.quantite_reelle || product.quantite_reference);
    }
    return product.prix_reference;
  };

  // Gestion panier : ajout produit avec mise à jour Supabase
  const addToCart = async (product: Product) => {
    const stockQuantity = product.stock_unite ?? 0;
    
    if (stockQuantity <= 0) {
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

    try {
      const newStock = stockQuantity - 1;
      await ProductService.updateStock(product.id, newStock);
      
      setProducts(products.map(p =>
        p.id === product.id ? { ...p, stock_unite: newStock } : p
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

    try {
      const product = products.find(p => p.id === removedItem.id);
      if (product) {
        const currentStock = product.stock_unite ?? 0;
        const newStock = currentStock + removedItem.quantite_achat;
        await ProductService.updateStock(product.id, newStock);
        
        setProducts(products.map(p =>
          p.id === removedItem.id ? { ...p, stock_unite: newStock } : p
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
        
        setProducts(products.map(p =>
          p.id === item.id ? { ...p, stock_unite: newStock } : p
        ));
      }
    } catch (error) {
      console.error('Erreur mise à jour stock:', error);
    }
  };

  // Finalisation commande avec sauvegarde Supabase
  const handleCheckout = async (customerInfo: any) => {
    // Calculer le total en utilisant le prix réel de chaque produit
    const total = cart.reduce((sum, item) => {
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
  };

  // Filtrage des produits selon catégorie, recherche ET stock
  const filteredProducts = products.filter(product => {
    const matchesCat = !selectedCat || product.categorie === selectedCat;
    const matchesSearch = !searchTerm ||
      product.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.marque.toLowerCase().includes(searchTerm.toLowerCase());
    
    const hasStock = (product.stock_unite ?? 0) > 0;
    
    return matchesCat && matchesSearch && hasStock;
  });

  // Regrouper les produits par nom et marque (correction du regroupement)
  const groupProductsByNameAndBrand = (products: Product[]) => {
    const groups: { [key: string]: Product[] } = {};
    
    products.forEach(product => {
      // Utiliser uniquement le nom et la marque pour regrouper
      const key = `${product.nom}-${product.marque}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(product);
    });
    
    return groups;
  };

  // Regrouper les produits filtrés
  const groupedProducts = Object.values(
    filteredProducts.reduce((acc, product) => {
      const key = `${product.nom}-${product.marque}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(product);
      return acc;
    }, {} as Record<string, Product[]>)
  );

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
              Beauté-légance
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

        {/* Filtre de catégories */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {[
            { id: null, name: 'Tous', icon: '🛍️' },
            { id: 'makeup', name: 'Maquillage', icon: '💄' },
            { id: 'skincare', name: 'Soins Visage', icon: '🧴' },
            { id: 'bodycare', name: 'Soins Corps', icon: '🧼' },
            { id: 'haircare', name: 'Cheveux', icon: '💇‍♀️' },
            { id: 'fragrance', name: 'Parfums', icon: '🌸' },
            { id: 'accessories', name: 'Accessoires', icon: '✨' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className={`px-3 py-2 md:px-4 md:py-2 rounded-full text-sm md:text-base transition-all ${
                selectedCat === cat.id
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-purple-100'
              }`}
            >
              <span className="mr-1">{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Grille des produits */}
        <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8" layout>
          <AnimatePresence>
            {groupedProducts.map((variants, index) => {
              // Prendre la première variante comme produit principal
              const mainProduct = variants[0];
              
              return (
                <motion.div
                  key={mainProduct.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  layout
                >
                  <ProductCard
                    product={mainProduct}
                    variants={variants} // Passer toutes les variantes
                    onAddToCart={addToCart}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {groupedProducts.length === 0 && (
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

        {/* BOUTON ADMIN DISCRET AVEC CODE */}
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