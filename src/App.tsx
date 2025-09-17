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
import { ProductService } from './services/productService'; // PLACEZ L'IMPORT ICI

const App: React.FC = () => {
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [admin, setAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);

 const [products, setProducts] = useState<Product[]>([]);
const [orders, setOrders] = useState<Order[]>(() =>
  loadFromStorage(STORAGE_KEYS.ORDERS, [])
);


  // TEST SUPABASE - PLACEZ LE useEffect ICI, DANS LE COMPOSANT
 useEffect(() => {
  console.log('Chargement des produits depuis Supabase...');
  
  ProductService.getAllProducts()
    .then(data => {
      setProducts(data);
      console.log('Produits chargés:', data);
    })
    .catch(err => {
      console.error('Erreur chargement produits:', err);
      // Fallback vers données initiales en cas d'erreur
      setProducts(initialProducts);
    });
}, []);

  // ... reste de votre code existant ...


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

  // Sauvegarde automatique des produits dans le localStorage
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PRODUCTS, products);
  }, [products]);

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

  // Gestion panier : ajout produit
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

  // NOUVEAU : Mettre à jour le stock dans Supabase
  try {
    await ProductService.updateStock(product.id, product.quantite_reelle - 1);
    setProducts(products.map(p =>
      p.id === product.id ? { ...p, quantite_reelle: p.quantite_reelle - 1 } : p
    ));
  } catch (error) {
    console.error('Erreur mise à jour stock:', error);
    alert('Erreur lors de la mise à jour du stock');
  }
};

  // Supprimer un item du panier
  const removeFromCart = (index: number) => {
    const removedItem = cart[index];
    setCart(cart.filter((_, i) => i !== index));
    setProducts(products.map(p =>
      p.id === removedItem.id ? { ...p, quantite_reelle: p.quantite_reelle + removedItem.quantite_achat } : p
    ));
  };

  // Modifier la quantité d’un item dans le panier
  const updateCartQuantity = (index: number, newQuantity: number) => {
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

    setProducts(products.map(p =>
      p.id === item.id ? { ...p, quantite_reelle: p.quantite_reelle - diff } : p
    ));
  };

  // Finalisation commande
  const handleCheckout = (customerInfo: any) => {
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

    setOrders([newOrder, ...orders]);
    setCart([]);
    setShowCheckout(false);

    const customerName = customerInfo.nom && customerInfo.prenom
      ? `${customerInfo.prenom} ${customerInfo.nom}`
      : customerInfo.nom || customerInfo.prenom || 'Client';

    alert(`Commande validée pour ${customerName}!\nNuméro: #${newOrder.id}\nPaiement en espèces à la livraison.`);
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

      <div className="relative z-10 font-sans pt-8 pb-12 px-4 max-w-6xl mx-auto">
        <Header
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          products={products}
          orders={orders}
          onDataSync={handleDataSync}
          onForceSync={handleForceSync}
        />

        <CategoryFilter
          selectedCat={selectedCat}
          setSelectedCat={setSelectedCat}
        />

        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8" layout>
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
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucun produit trouvé</h3>
            <p className="text-gray-500">Essayez de modifier vos critères de recherche</p>
          </motion.div>
        )}

        <Cart
          cart={cart}
          removeFromCart={removeFromCart}
          updateQuantity={updateCartQuantity}
        />

        {!admin && <DiscreteAdminButton setAdmin={setAdmin} />}
        {admin && (
          <AdminPanel
            products={products}
            setProducts={setProducts}
            orders={orders}
            setOrders={setOrders}
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
          />
        )}
      </div>
    </div>
  );
};

export default App;
