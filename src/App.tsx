
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Toutes les données mockées
const categories = [
  "Maquillage",
  "Soins Visage", 
  "Soins Corps",
  "Cheveux",
  "Parfums",
  "Accessoires",
];

// Configuration fixe de la boutique (identique partout)
const SHOP_CONFIG = {
  name: "Beauté & Élégance",
  subtitle: "Votre destination beauté de luxe",
  adminCode: "marina2025"
};

// Produits initiaux
const initialProducts = [
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

interface Product {
  id: string;
  image: string;
  marque: string;
  nom: string;
  categorie: string;
  emplacement: string;
  prix_reference: number;
  quantite_web: number;
  quantite_reelle: number;
  reduction: number;
  description: string;
  quantite_produit: number;
}

interface CartItem extends Product {
  quantite_achat: number;
}

interface Order {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered';
  paymentMode: string;
  customerInfo?: {
    nom?: string;
    prenom?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  preparedItems?: { [key: string]: boolean }; // ID produit → état préparé
}

// 🆕 Interface pour les données synchronisées avec métadonnées
interface SyncData {
  products: Product[];
  orders: Order[];
  timestamp: number;
  version: string;
  deviceId: string;
  lastModified: {
    products: number;
    orders: number;
  };
}

// Fonctions de persistance localStorage
const STORAGE_KEYS = {
  PRODUCTS: 'beaute_elegance_products',
  ORDERS: 'beaute_elegance_orders',
  SYNC_TIMESTAMP: 'beaute_elegance_sync_timestamp',
  DEVICE_ID: 'beaute_elegance_device_id',
  LAST_MODIFIED: 'beaute_elegance_last_modified'
};

const saveToStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Erreur sauvegarde localStorage:', error);
  }
};

const loadFromStorage = (key: string, defaultValue: any) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error('Erreur chargement localStorage:', error);
    return defaultValue;
  }
};

// 🆕 Génération d'un ID unique pour chaque appareil
const getDeviceId = (): string => {
  let deviceId = loadFromStorage(STORAGE_KEYS.DEVICE_ID, null);
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    saveToStorage(STORAGE_KEYS.DEVICE_ID, deviceId);
  }
  return deviceId;
};

// 🆕 Fonctions de synchronisation améliorées
const encodeSyncData = (products: Product[], orders: Order[]): string => {
  const deviceId = getDeviceId();
  const now = Date.now();
  
  const syncData: SyncData = {
    products,
    orders,
    timestamp: now,
    version: '2.0',
    deviceId,
    lastModified: {
      products: now,
      orders: now
    }
  };
  
  try {
    const jsonString = JSON.stringify(syncData);
    return btoa(encodeURIComponent(jsonString));
  } catch (error) {
    console.error('Erreur encodage données:', error);
    return '';
  }
};

const decodeSyncData = (encodedData: string): SyncData | null => {
  try {
    const jsonString = decodeURIComponent(atob(encodedData));
    const data = JSON.parse(jsonString);
    
    // Validation des données
    if (!data.products || !data.orders || !data.timestamp) {
      console.error('Données de synchronisation incomplètes');
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Erreur décodage données:', error);
    return null;
  }
};

// 🔥 FONCTION CORRIGÉE : Génère toujours l'URL avec l'état ACTUEL du magasin
const generateSyncUrl = (products: Product[], orders: Order[]): string => {
  const baseUrl = window.location.origin + window.location.pathname;
  const encodedData = encodeSyncData(products, orders);
  return `${baseUrl}?sync=${encodedData}`;
};

const extractSyncDataFromUrl = (): SyncData | null => {
  const urlParams = new URLSearchParams(window.location.search);
  const syncParam = urlParams.get('sync');
  
  if (syncParam) {
    return decodeSyncData(syncParam);
  }
  
  return null;
};

// 🆕 Composant QR Code avec synchronisation automatique CORRIGÉE
function SearchWithQR({ searchTerm, setSearchTerm, products, orders, onDataSync, onForceSync }: { 
  searchTerm: string; 
  setSearchTerm: (term: string) => void;
  products: Product[];
  orders: Order[];
  onDataSync: (syncData: SyncData) => void;
  onForceSync: () => void;
}) {
  const [showQR, setShowQR] = useState(false);
  const [qrMode, setQrMode] = useState<'sync' | 'share'>('sync');
  const [lastSyncStats, setLastSyncStats] = useState<{ 
    products: number; 
    orders: number; 
    date: string;
    deviceId: string;
  } | null>(null);

  // 🔥 URL de base de l'application (sans paramètres) - pour partage simple
  const getAppUrl = () => {
    return window.location.origin + window.location.pathname;
  };

  // 🔥 URL DYNAMIQUE avec données synchronisées - REGÉNÉRÉE à chaque appel
  const getSyncUrl = () => {
    console.log('🔄 Génération URL de sync avec état actuel:', {
      products: products.length,
      orders: orders.length,
      totalStock: products.reduce((sum, p) => sum + p.quantite_reelle, 0)
    });
    return generateSyncUrl(products, orders);
  };

  // Partager l'application (URL simple)
  const shareApp = async () => {
    const url = getAppUrl();
    const title = SHOP_CONFIG.name;
    const text = `Découvrez ${SHOP_CONFIG.name} - ${SHOP_CONFIG.subtitle}`;

    try {
      if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        await navigator.share({
          title: title,
          text: text,
          url: url
        });
      } else {
        await navigator.clipboard.writeText(url);
        alert('Lien de l\'application copié ! Partagez-le pour donner accès à votre boutique.');
      }
    } catch (error) {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Lien de l\'application copié !');
    }
  };

  // 🔥 Partager les données (URL DYNAMIQUE avec synchronisation)
  const shareData = async () => {
    const url = getSyncUrl(); // 🔥 GÉNÈRE l'URL avec l'état ACTUEL
    const title = `${SHOP_CONFIG.name} - Données synchronisées`;
    const text = `Accédez à ${SHOP_CONFIG.name} avec les stocks actuels (${products.length} produits, ${orders.length} commandes)`;

    console.log('📤 Partage URL de synchronisation:', {
      url: url.substring(0, 100) + '...',
      productsCount: products.length,
      ordersCount: orders.length
    });

    try {
      if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        await navigator.share({
          title: title,
          text: text,
          url: url
        });
      } else {
        await navigator.clipboard.writeText(url);
        alert(`✅ Lien de synchronisation copié !\n\n📦 ${products.length} produits\n📋 ${orders.length} commandes\n🕒 ${new Date().toLocaleString('fr-FR')}\n\n📱 Scannez le QR code ou collez ce lien dans le navigateur de votre autre appareil.`);
      }
    } catch (error) {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('✅ Lien de synchronisation copié !');
    }
  };

  const openInNewTab = () => {
    const url = qrMode === 'share' ? getAppUrl() : getSyncUrl();
    window.open(url, '_blank');
  };

  // 🆕 Synchronisation forcée (réinitialisation)
  const forceSyncReset = () => {
    if (confirm('⚠️ Attention !\n\nCette action va remettre à zéro toutes les données de ce magasin (retour aux données initiales).\n\nContinuer ?')) {
      onForceSync();
      alert('✅ Magasin réinitialisé avec les données d\'origine.');
      setShowQR(false);
    }
  };

  // Calculer les statistiques actuelles
  const currentStats = {
    products: products.length,
    orders: orders.length,
    totalStock: products.reduce((sum, p) => sum + p.quantite_reelle, 0),
    deviceId: getDeviceId()
  };

  return (
    <motion.div 
      className="max-w-md mx-auto mt-6 relative"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex gap-2 items-center">
        {/* Barre de recherche */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-purple-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            🔍
          </div>
        </div>
        
        {/* Bouton QR Code */}
        <div className="relative">
          <motion.button
            className="bg-white/90 backdrop-blur-sm border border-purple-200 p-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowQR(!showQR)}
            title="Partager et synchroniser"
          >
            <div className="w-6 h-6 flex items-center justify-center text-purple-600 group-hover:text-purple-800">
              📱
            </div>
          </motion.button>

          <AnimatePresence>
            {showQR && (
              <motion.div
                className="absolute top-16 right-0 bg-white/95 backdrop-blur-sm border border-purple-200 p-4 rounded-2xl shadow-xl z-50 w-80"
                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -10 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="text-center">
                  <div className="font-semibold text-purple-800 mb-1 text-sm">📱 {SHOP_CONFIG.name}</div>
                  
                  {/* Sélecteur de mode */}
                  <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg">
                    <button
                      onClick={() => setQrMode('share')}
                      className={`flex-1 py-2 px-3 rounded text-xs font-medium transition-all ${
                        qrMode === 'share' 
                          ? 'bg-blue-500 text-white' 
                          : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      🌐 Partager App
                    </button>
                    <button
                      onClick={() => setQrMode('sync')}
                      className={`flex-1 py-2 px-3 rounded text-xs font-medium transition-all ${
                        qrMode === 'sync' 
                          ? 'bg-purple-500 text-white' 
                          : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      🔄 Synchroniser
                    </button>
                  </div>
                  
                  {/* 🔥 QR Code DYNAMIQUE - se met à jour avec l'état actuel */}
                  <div className="bg-white p-3 rounded-lg shadow-inner mb-4 border">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
                        qrMode === 'share' ? getAppUrl() : getSyncUrl() // 🔥 GÉNÈRE URL DYNAMIQUE
                      )}&size=150x150&bgcolor=ffffff&color=${
                        qrMode === 'share' ? '3b82f6' : '7c3aed'
                      }&margin=0&ecc=M`}
                      alt={`QR code ${qrMode === 'share' ? 'partage application' : 'synchronisation'} ${SHOP_CONFIG.name}`}
                      className="w-32 h-32 mx-auto"
                      style={{ imageRendering: 'auto' }}
                      key={`${qrMode}-${Date.now()}`} // 🔥 FORCE le rechargement du QR code
                    />
                  </div>
                  
                  {/* Description du mode */}
                  {qrMode === 'share' ? (
                    <div className="bg-blue-50 p-3 rounded-lg mb-4 text-xs">
                      <div className="font-semibold text-blue-800 mb-2">🌐 Partage de l'Application</div>
                      <div className="text-blue-600 leading-relaxed">
                        Scannez pour accéder directement à <strong>{SHOP_CONFIG.name}</strong> dans votre navigateur
                      </div>
                    </div>
                  ) : (
                    <div className="bg-purple-50 p-3 rounded-lg mb-4 text-xs">
                      <div className="font-semibold text-purple-800 mb-2">🔄 Synchronisation Complète</div>
                      <div className="grid grid-cols-2 gap-2 text-purple-600 mb-2">
                        <div>
                          <div className="font-bold">{currentStats.products}</div>
                          <div>Produits</div>
                        </div>
                        <div>
                          <div className="font-bold">{currentStats.orders}</div>
                          <div>Commandes</div>
                        </div>
                      </div>
                      <div className="text-xs text-purple-500 bg-purple-100 p-2 rounded mb-2">
                        📱 ID: {currentStats.deviceId.slice(-8)}
                      </div>
                      <div className="text-xs text-purple-700 font-medium">
                        🔥 QR code contient l'état COMPLET du magasin
                      </div>
                    </div>
                  )}

                  {/* Dernière synchronisation (mode sync uniquement) */}
                  {qrMode === 'sync' && lastSyncStats && (
                    <div className="bg-green-50 p-3 rounded-lg mb-4 text-xs">
                      <div className="font-semibold text-green-800 mb-1">✅ Dernière sync</div>
                      <div className="text-green-600">
                        <div>{lastSyncStats.products} produits, {lastSyncStats.orders} commandes</div>
                        <div>{lastSyncStats.date}</div>
                        <div className="text-xs">📱 De: {lastSyncStats.deviceId.slice(-8)}</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Boutons d'action */}
                  <div className="space-y-2">
                    {qrMode === 'share' ? (
                      <>
                        <button
                          onClick={shareApp}
                          className="w-full px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                          🌐 Partager l'application
                        </button>
                        
                        <button
                          onClick={openInNewTab}
                          className="w-full px-3 py-2 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                        >
                          🔗 Ouvrir dans un nouvel onglet
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={shareData}
                          className="w-full px-3 py-2 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                        >
                          📤 Partager les données actuelles
                        </button>
                        
                        <button
                          onClick={forceSyncReset}
                          className="w-full px-3 py-2 bg-orange-500 text-white text-xs rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                        >
                          🔄 Réinitialiser magasin
                        </button>
                        
                        <button
                          onClick={openInNewTab}
                          className="w-full px-3 py-2 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                        >
                          🔗 Nouvel onglet avec sync
                        </button>
                      </>
                    )}
                    
                    <button
                      onClick={() => setShowQR(false)}
                      className="w-full px-3 py-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Fermer
                    </button>
                  </div>

                  {/* Debug info avec URL dynamique */}
                  <div className="mt-3 p-2 bg-gray-100 rounded text-xs text-gray-600 break-all space-y-1">
                    <div><strong>Mode:</strong> {qrMode === 'share' ? 'Partage App' : 'Synchronisation'}</div>
                    <div><strong>Appareil:</strong> {currentStats.deviceId.slice(-8)}</div>
                    <div><strong>Données:</strong> {qrMode === 'share' ? 'URL seule' : `${currentStats.products}P + ${currentStats.orders}C`}</div>
                    {qrMode === 'sync' && (
                      <div><strong>Stock total:</strong> {currentStats.totalStock} unités</div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// Icône panier flottante
function FloatingCartIcon({ cart, onClick }: { cart: CartItem[]; onClick: () => void }) {
  const itemCount = cart.reduce((sum, item) => sum + item.quantite_achat, 0);
  
  if (itemCount === 0) return null;

  return (
    <motion.button
      className="fixed bottom-6 right-6 bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4 rounded-full shadow-2xl z-40 flex items-center gap-2"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
    >
      <div className="relative">
        🛒
        <motion.div
          className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          key={itemCount}
        >
          {itemCount}
        </motion.div>
      </div>
      <span className="hidden sm:block font-semibold">Panier</span>
    </motion.button>
  );
}

// Modal de finalisation de commande avec nom et prénom
function CheckoutModal({ cart, onClose, onConfirm }: { 
  cart: CartItem[]; 
  onClose: () => void; 
  onConfirm: (customerInfo: any) => void; 
}) {
  const [customerInfo, setCustomerInfo] = useState({
    nom: '',
    prenom: '',
    email: '',
    phone: '',
    address: ''
  });

  const total = cart.reduce((sum, item) => 
    sum + (item.prix_reference * (1 - item.reduction / 100) * item.quantite_achat), 0
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(customerInfo);
  };

  return (
    <motion.div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-purple-800">Finaliser la commande</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Résumé commande */}
        <div className="bg-purple-50 p-4 rounded-xl mb-6">
          <h4 className="font-semibold text-purple-800 mb-3">Votre commande</h4>
          <div className="space-y-2 mb-4">
            {cart.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span>{item.nom} × {item.quantite_achat}</span>
                <span className="font-semibold">
                  {(item.prix_reference * (1 - item.reduction / 100) * item.quantite_achat).toFixed(2)}€
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-purple-200 pt-2">
            <div className="flex justify-between items-center font-bold text-lg">
              <span>Total:</span>
              <span className="text-purple-700">{total.toFixed(2)}€</span>
            </div>
          </div>
        </div>

        {/* Formulaire informations client */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom et Prénom */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom (optionnel)
              </label>
              <input
                type="text"
                value={customerInfo.nom}
                onChange={(e) => setCustomerInfo({...customerInfo, nom: e.target.value})}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Votre nom"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prénom (optionnel)
              </label>
              <input
                type="text"
                value={customerInfo.prenom}
                onChange={(e) => setCustomerInfo({...customerInfo, prenom: e.target.value})}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Votre prénom"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email (optionnel)
            </label>
            <input
              type="email"
              value={customerInfo.email}
              onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="votre@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Téléphone (optionnel)
            </label>
            <input
              type="tel"
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="06 12 34 56 78"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse de livraison (optionnel)
            </label>
            <textarea
              value={customerInfo.address}
              onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
              placeholder="123 Rue de la Beauté, 75001 Paris"
            />
          </div>

          {/* Mode de paiement */}
          <div className="bg-green-50 p-4 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
                💰
              </div>
              <div>
                <div className="font-semibold text-green-800">Paiement en espèces</div>
                <div className="text-sm text-green-600">Commande payée à la livraison</div>
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-semibold"
            >
              Confirmer la commande
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// Composant de capture photo/upload
function ImageCapture({ currentImage, onImageChange }: { currentImage: string; onImageChange: (imageUrl: string) => void }) {
  const [showOptions, setShowOptions] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Préférer la caméra arrière
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCapturing(true);
    } catch (error) {
      alert('Impossible d\'accéder à la caméra. Veuillez utiliser l\'upload de fichier.');
      console.error('Erreur caméra:', error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        onImageChange(imageDataUrl);
        stopCamera();
        setShowOptions(false);
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB max
        alert('Fichier trop volumineux (max 5MB)');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onImageChange(result);
        setShowOptions(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    onImageChange('https://images.pexels.com/photos/2533266/pexels-photo-2533266.jpeg?auto=compress&cs=tinysrgb&w=400');
    setShowOptions(false);
  };

  useEffect(() => {
    return () => {
      stopCamera(); // Nettoyage lors du démontage
    };
  }, []);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Image du produit
      </label>
      
      {/* Aperçu de l'image actuelle */}
      <div className="relative mb-3">
        <img
          src={currentImage}
          alt="Aperçu produit"
          className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
        />
        <button
          type="button"
          onClick={() => setShowOptions(!showOptions)}
          className="absolute bottom-2 right-2 bg-purple-600 text-white p-2 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
        >
          📷
        </button>
      </div>

      {/* Options de capture/upload */}
      <AnimatePresence>
        {showOptions && (
          <motion.div
            className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {!isCapturing ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={startCamera}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  📷 Prendre une photo
                </button>
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  📁 Choisir un fichier
                </button>
                
                <button
                  type="button"
                  onClick={removeImage}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  🗑️ Image par défaut
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowOptions(false)}
                  className="w-full p-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Annuler
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-48 object-cover rounded-lg bg-black"
                />
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="flex-1 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    📸 Capturer
                  </button>
                  
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="flex-1 p-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input file caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      
      {/* Canvas caché pour la capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

function ProductCard({ product, onAddToCart }: { product: Product; onAddToCart: (product: Product) => void }) {
  const prixFinal = product.prix_reference * (1 - product.reduction / 100);
  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  const handleClick = async () => {
    if (product.quantite_reelle <= 0) {
      alert('Produit en rupture de stock');
      return;
    }
    
    setIsAdding(true);
    onAddToCart(product);
    
    // Animation temporaire
    setTimeout(() => setIsAdding(false), 600);
  };

  return (
    <motion.div 
      className="rounded-2xl shadow-xl p-4 bg-gradient-to-br from-pink-50 via-white to-purple-100 border border-pink-200 mb-4 flex flex-col overflow-hidden relative cursor-pointer"
      whileHover={{ scale: 1.02, y: -5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleClick}
      transition={{ type: "spring", stiffness: 300 }}
      animate={isAdding ? { scale: 1.05 } : { scale: 1 }}
    >
      {product.reduction > 0 && (
        <div className="absolute top-2 right-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
          -{product.reduction}%
        </div>
      )}
      
      <div className="relative overflow-hidden rounded-xl mb-3">
        <motion.img
          src={product.image}
          alt={product.nom}
          className="w-full h-40 object-cover"
          animate={{ scale: isHovered ? 1.1 : 1 }}
          transition={{ duration: 0.3 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
        
        {/* Indicateur d'ajout au panier */}
        <AnimatePresence>
          {isAdding && (
            <motion.div
              className="absolute inset-0 bg-green-500/80 flex items-center justify-center rounded-xl"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <div className="text-white text-2xl">✓</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="flex-1">
        <h3 className="font-bold text-lg text-gray-800 mb-1 leading-tight">{product.nom}</h3>
        <p className="text-sm text-purple-600 font-medium mb-2">{product.marque}</p>
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{product.description}</p>
        
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl text-purple-700">{prixFinal.toFixed(2)} €</span>
            {product.reduction > 0 && (
              <span className="line-through text-gray-400 text-sm">{product.prix_reference} €</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>Stock: {product.quantite_reelle}</span>
          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full">{product.categorie}</span>
        </div>
      </div>
      
      <div className="text-center py-2">
        {product.quantite_reelle > 0 ? (
          <div className="text-purple-600 font-medium text-sm flex items-center justify-center gap-2">
            🛒 Cliquez pour ajouter au panier
          </div>
        ) : (
          <div className="text-red-500 font-medium text-sm">
            ❌ Rupture de stock
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Cart({ cart, removeFromCart, updateQuantity }: any) {
  const total = cart.reduce((sum: number, item: CartItem) => 
    sum + (item.prix_reference * (1 - item.reduction / 100) * item.quantite_achat), 0
  );

  return (
    <motion.div 
      className="bg-white/80 backdrop-blur-sm border border-purple-200 p-5 rounded-2xl shadow-xl mt-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"></div>
        <h3 className="text-xl font-bold text-gray-800">Mon Panier</h3>
        {cart.length > 0 && (
          <span className="bg-purple-100 text-purple-700 text-sm px-2 py-1 rounded-full">
            {cart.reduce((sum: number, item: CartItem) => sum + item.quantite_achat, 0)} article{cart.reduce((sum: number, item: CartItem) => sum + item.quantite_achat, 0) > 1 ? 's' : ''}
          </span>
        )}
      </div>
      
      {cart.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🛍️</div>
          <p>Votre panier est vide</p>
          <p className="text-sm mt-2">Cliquez sur un produit pour l'ajouter</p>
        </div>
      ) : (
        <AnimatePresence>
          {cart.map((item: CartItem, index: number) => (
            <motion.div 
              key={`${item.id}-${index}`}
              className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center gap-3 flex-1">
                <img 
                  src={item.image} 
                  alt={item.nom}
                  className="w-12 h-12 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{item.nom}</div>
                  <div className="text-sm text-gray-500">{item.marque}</div>
                  <div className="text-xs text-gray-400">
                    {(item.prix_reference * (1 - item.reduction / 100)).toFixed(2)}€ × {item.quantite_achat}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateQuantity(index, item.quantite_achat - 1);
                    }}
                    className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center text-sm"
                    disabled={item.quantite_achat <= 1}
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantite_achat}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateQuantity(index, item.quantite_achat + 1);
                    }}
                    className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center text-sm"
                  >
                    +
                  </button>
                </div>
                
                <span className="font-bold text-purple-700 min-w-[60px] text-right">
                  {(item.prix_reference * (1 - item.reduction / 100) * item.quantite_achat).toFixed(2)}€
                </span>
                
                <motion.button
                  className="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromCart(index);
                  }}
                >
                  ✕
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
      
      {cart.length > 0 && (
        <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
          <div className="flex justify-between items-center text-lg font-bold text-gray-800">
            <span>Total:</span>
            <span className="text-purple-700">{total.toFixed(2)} €</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function CategoryFilter({ selectedCat, setSelectedCat }: any) {
  return (
    <div className="flex flex-wrap gap-2 mb-6 justify-center">
      {categories.map((cat, index) => (
        <motion.button
          key={cat}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
            selectedCat === cat 
              ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg" 
              : "bg-white/80 text-gray-700 hover:bg-purple-100 border border-purple-200"
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSelectedCat(selectedCat === cat ? null : cat)}
        >
          {cat}
        </motion.button>
      ))}
      {selectedCat && (
        <motion.button
          className="rounded-full px-4 py-2 text-sm font-semibold bg-gray-200 text-gray-600 hover:bg-gray-300"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => setSelectedCat(null)}
        >
          Tous les produits
        </motion.button>
      )}
    </div>
  );
}

// 🆕 Bouton admin discret
function DiscreteAdminButton({ setAdmin }: { setAdmin: (admin: boolean) => void }) {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [attempts, setAttempts] = useState(0);

  const handlePasswordSubmit = () => {
    if (password.trim().toLowerCase() === SHOP_CONFIG.adminCode) {
      setAdmin(true);
      setShowPasswordModal(false);
      setPassword("");
      setAttempts(0);
    } else {
      setAttempts(prev => prev + 1);
      setPassword("");
      
      if (attempts >= 2) {
        alert("Trop de tentatives incorrectes. Accès bloqué temporairement.");
        setShowPasswordModal(false);
        setAttempts(0);
      } else {
        alert(`Code incorrect. ${3 - attempts - 1} tentative(s) restante(s).`);
      }
    }
  };

  return (
    <>
      {/* Bouton discret en bas à gauche */}
      <motion.button
        className="fixed bottom-6 left-6 w-3 h-3 bg-gray-300 rounded-full opacity-100 hover:opacity-100 hover:scale-150 transition-all duration-300 z-30"
        whileHover={{ 
          backgroundColor: "#7c3aed",
          boxShadow: "0 0 20px rgba(124, 58, 237, 0.5)"
        }}
        onClick={() => setShowPasswordModal(true)}
        title="Accès administrateur"
      />

      {/* Modal de mot de passe */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-white rounded-2xl p-6 max-w-sm w-full"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-white">🔐</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Accès Administrateur</h3>
                <p className="text-sm text-gray-600">Entrez le code d'accès</p>
                {attempts > 0 && (
                  <p className="text-red-500 text-xs mt-2">
                    Tentative {attempts}/3 - Code incorrect
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                  className="w-full border border-gray-300 rounded-lg p-3 text-center focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="••••••••"
                  autoFocus
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPassword("");
                      setAttempts(0);
                    }}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handlePasswordSubmit}
                    className="flex-1 py-2 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all duration-300"
                  >
                    Valider
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ProductModal({ product, onSave, onClose }: any) {
  const [formData, setFormData] = useState(product || {
    id: '',
    nom: '',
    marque: '',
    categorie: categories[0],
    prix_reference: 0,
    quantite_web: 0,
    quantite_reelle: 0,
    stock: 0,
    reduction: 0,
    description: '',
    emplacement: '',
    image: 'https://images.pexels.com/photos/2533266/pexels-photo-2533266.jpeg?auto=compress&cs=tinysrgb&w=400'
  });

  // Calcul automatique du prix final basé sur les quantités et réduction
  const calculateFinalPrice = () => {
    if (formData.quantite_web > 0 && formData.quantite_reelle > 0 && formData.prix_reference > 0) {
      // Prix au prorata de la quantité réelle
      const prixProrata = (formData.prix_reference * formData.quantite_reelle) / formData.quantite_web;
      // Application de la réduction
      const prixFinal = prixProrata * (1 - (formData.reduction || 0) / 100);
      return prixFinal.toFixed(2);
    }
    return '0.00';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom || !formData.marque) {
      alert('Veuillez remplir les champs obligatoires');
      return;
    }
    
    const productData = {
      ...formData,
      id: formData.id || Date.now().toString(),
      prix_reference: parseFloat(calculateFinalPrice()),
      quantite_web: parseInt(formData.quantite_web) || 0,
      quantite_reelle: parseInt(formData.stock) || 0, // Le stock devient la quantité réelle
      reduction: parseInt(formData.reduction) || 0,
      quantite_produit: 1
    };
    
    onSave(productData);
  };

  const handleImageChange = (newImageUrl: string) => {
    setFormData({ ...formData, image: newImageUrl });
  };

  return (
    <motion.div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-blue-800">
            {product ? 'Modifier le produit' : 'Ajouter un produit'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Composant de capture/upload d'image */}
          <ImageCapture
            currentImage={formData.image}
            onImageChange={handleImageChange}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du produit *
            </label>
            <input
              type="text"
              value={formData.nom}
              onChange={(e) => setFormData({...formData, nom: e.target.value})}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marque *
            </label>
            <input
              type="text"
              value={formData.marque}
              onChange={(e) => setFormData({...formData, marque: e.target.value})}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie
            </label>
            <select
              value={formData.categorie}
              onChange={(e) => setFormData({...formData, categorie: e.target.value})}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Section prix web et quantité web */}
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
            <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
              🌐 Référence Web
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix web (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.prix_reference}
                  onChange={(e) => setFormData({...formData, prix_reference: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 39.90"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantité web (ml/g)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.quantite_web}
                  onChange={(e) => setFormData({...formData, quantite_web: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 50"
                />
              </div>
            </div>
            <div className="text-xs text-blue-600 mt-2">
              Prix et quantité trouvés sur internet (référence)
            </div>
          </div>

          {/* Section produit détenu */}
          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
            <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
              📦 Produit Détenu
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantité réelle (ml/g)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.quantite_reelle}
                  onChange={(e) => setFormData({...formData, quantite_reelle: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock (unités)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({...formData, stock: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 5"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 mt-3">
                Réduction (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.reduction}
                onChange={(e) => setFormData({...formData, reduction: e.target.value})}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 10"
              />
            </div>
            
            <div className="text-xs text-green-600 mt-2">
              Quantité et stock de votre produit physique
            </div>
          </div>

          {/* Affichage du prix calculé */}
          {formData.quantite_web > 0 && formData.quantite_reelle > 0 && formData.prix_reference > 0 && (
            <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
              <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                💰 Prix Calculé
              </h4>
              <div className="text-2xl font-bold text-purple-700 mb-2">
                {calculateFinalPrice()}€
              </div>
              <div className="text-xs text-purple-600 space-y-1">
                <div>• Prix web: {formData.prix_reference}€ pour {formData.quantite_web}ml/g</div>
                <div>• Prix au prorata: {((formData.prix_reference * formData.quantite_reelle) / formData.quantite_web).toFixed(2)}€ pour {formData.quantite_reelle}ml/g</div>
                {formData.reduction > 0 && (
                  <div>• Avec réduction {formData.reduction}%: {calculateFinalPrice()}€</div>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Emplacement
            </label>
            <input
              type="text"
              value={formData.emplacement}
              onChange={(e) => setFormData({...formData, emplacement: e.target.value})}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
              placeholder="ex: A1, B5..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {product ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// Modal de détail de commande pour admin avec validation individuelle des produits
function OrderDetailModal({ order, onClose, onUpdateStatus, onToggleItemPrepared }: { 
  order: Order; 
  onClose: () => void; 
  onUpdateStatus: (orderId: string, status: string) => void;
  onToggleItemPrepared: (orderId: string, itemId: string) => void;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'preparing': return 'En préparation';
      case 'ready': return 'Prêt';
      case 'delivered': return 'Livré';
      default: return status;
    }
  };

  // Vérifier si un produit est marqué comme préparé
  const isItemPrepared = (itemId: string) => {
    return order.preparedItems?.[itemId] || false;
  };

  // Compter les produits préparés
  const preparedCount = order.items.reduce((count, item) => {
    return count + (isItemPrepared(item.id) ? item.quantite_achat : 0);
  }, 0);

  const totalItems = order.items.reduce((sum, item) => sum + item.quantite_achat, 0);

  return (
    <motion.div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-auto"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-blue-800 text-center flex-1">Détail Commande #{order.id}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl ml-4"
          >
            ✕
          </button>
        </div>

        {/* Informations générales - Centrées */}
        <div className="bg-blue-50 p-4 rounded-xl mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-center">
            <div>
              <div className="text-sm text-gray-600">Date de commande</div>
              <div className="font-semibold">{order.date}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Statut</div>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {getStatusLabel(order.status)}
              </span>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total commande</div>
              <div className="font-bold text-lg text-blue-700">{order.total.toFixed(2)}€</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Mode de paiement</div>
              <div className="font-semibold">{order.paymentMode}</div>
            </div>
          </div>
        </div>

        {/* Coordonnées client - Centrées */}
        {order.customerInfo && (
          <div className="bg-green-50 p-4 rounded-xl mb-6 border-l-4 border-green-400">
            <h4 className="font-semibold text-green-800 mb-3 flex items-center justify-center gap-2">
              👤 Informations Client
            </h4>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-center gap-3">
                <span className="text-green-600">👤</span>
                <div className="text-center">
                  <span className="font-medium text-sm">Nom:</span>
                  <span className="ml-2">
                    {order.customerInfo.nom && order.customerInfo.prenom 
                      ? `${order.customerInfo.prenom} ${order.customerInfo.nom}`
                      : order.customerInfo.nom || order.customerInfo.prenom || 'Non renseigné'
                    }
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-3">
                <span className="text-green-600">📧</span>
                <div className="text-center">
                  <span className="font-medium text-sm">Email:</span>
                  <span className="ml-2">{order.customerInfo.email || 'Non renseigné'}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-3">
                <span className="text-green-600">📱</span>
                <div className="text-center">
                  <span className="font-medium text-sm">Téléphone:</span>
                  <span className="ml-2">{order.customerInfo.phone || 'Non renseigné'}</span>
                </div>
              </div>
              
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-green-600">📍</span>
                  <span className="font-medium text-sm">Adresse de livraison:</span>
                </div>
                <div className="p-2 bg-white rounded border text-sm text-center max-w-xs">
                  {order.customerInfo.address || 'Non renseignée'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progression de préparation */}
        <div className="bg-orange-50 p-4 rounded-xl mb-6 border-l-4 border-orange-400">
          <h4 className="font-semibold text-orange-800 mb-3 flex items-center justify-center gap-2">
            📋 Progression de préparation
          </h4>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-700 mb-2">
              {preparedCount} / {totalItems}
            </div>
            <div className="text-sm text-orange-600">
              articles préparés
            </div>
            <div className="w-full bg-orange-200 rounded-full h-3 mt-3">
              <div 
                className="bg-orange-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${totalItems > 0 ? (preparedCount / totalItems) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Produits de la commande avec validation individuelle */}
        <div className="bg-purple-50 p-4 rounded-xl mb-6">
          <h4 className="font-semibold text-purple-800 mb-4 flex items-center justify-center gap-2">
            📦 Produits à préparer ({totalItems} articles)
          </h4>
          <div className="space-y-3">
            {order.items.map((item, index) => {
              const isPrepared = isItemPrepared(item.id);
              return (
                <div key={index} className={`bg-white p-4 rounded-lg border-2 transition-all duration-300 ${
                  isPrepared ? 'border-green-400 bg-green-50' : 'border-gray-200'
                }`}>
                  <div className="flex items-center gap-4">
                    {/* Coche de validation */}
                    <motion.button
                      onClick={() => onToggleItemPrepared(order.id, item.id)}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                        isPrepared 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
                      }`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title={isPrepared ? 'Marquer comme non préparé' : 'Marquer comme préparé'}
                    >
                      {isPrepared && <span className="text-lg">✓</span>}
                    </motion.button>

                    {/* Image du produit */}
                    <img 
                      src={item.image} 
                      alt={item.nom}
                      className={`w-16 h-16 object-cover rounded-lg transition-all duration-300 ${
                        isPrepared ? 'opacity-75' : ''
                      }`}
                    />
                    
                    {/* Informations du produit */}
                    <div className="flex-1 text-center">
                      <h5 className={`font-semibold transition-all duration-300 ${
                        isPrepared ? 'text-green-700 line-through' : 'text-gray-800'
                      }`}>
                        {item.nom}
                      </h5>
                      <p className="text-sm text-gray-600">{item.marque} - {item.categorie}</p>
                      <div className="flex flex-col items-center gap-2 mt-2 text-sm">
                        <span>Quantité: <strong className="text-purple-600">{item.quantite_achat}</strong></span>
                        <span>Emplacement: <strong className="text-red-600 bg-red-100 px-2 py-1 rounded">{item.emplacement}</strong></span>
                      </div>
                    </div>

                    {/* Statut de préparation */}
                    <div className="text-center">
                      {isPrepared ? (
                        <div className="text-green-600 font-semibold text-sm">
                          ✅ Préparé
                        </div>
                      ) : (
                        <div className="text-orange-600 font-semibold text-sm">
                          ⏳ À préparer
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions de gestion - Centrées */}
        <div className="bg-gray-50 p-4 rounded-xl">
          <h4 className="font-semibold text-gray-800 mb-3 text-center">Actions de gestion</h4>
          <div className="flex flex-col gap-3">
            {order.status === 'pending' && (
              <button
                onClick={() => onUpdateStatus(order.id, 'preparing')}
                className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                🔄 Commencer préparation
              </button>
            )}
            {order.status === 'preparing' && (
              <button
                onClick={() => onUpdateStatus(order.id, 'ready')}
                className="w-full bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                disabled={preparedCount < totalItems}
                title={preparedCount < totalItems ? 'Tous les produits doivent être préparés' : 'Marquer comme prêt'}
              >
                ✅ Marquer comme prêt {preparedCount < totalItems && `(${preparedCount}/${totalItems})`}
              </button>
            )}
            {order.status === 'ready' && (
              <button
                onClick={() => onUpdateStatus(order.id, 'delivered')}
                className="w-full bg-purple-500 text-white px-4 py-3 rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
              >
                🚚 Marquer comme livré
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full bg-gray-500 text-white px-4 py-3 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AdminPanel({ products, setProducts, orders, setOrders }: any) {
  const [activeTab, setActiveTab] = useState('products');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const tabs = [
    { id: 'products', label: '📦 Produits', icon: '📦' },
    { id: 'orders', label: '📋 Commandes', icon: '📋' },
    { id: 'stats', label: '📊 Statistiques', icon: '📊' }
  ];

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const handleSaveProduct = (productData: Product) => {
    if (editingProduct) {
      setProducts(products.map((p: Product) => 
        p.id === editingProduct.id ? productData : p
      ));
    } else {
      setProducts([...products, productData]);
    }
    setShowProductModal(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      setProducts(products.filter((p: Product) => p.id !== id));
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) {
      setOrders(orders.filter((order: Order) => order.id !== orderId));
    }
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: string) => {
    setOrders(orders.map((order: Order) => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
    // Fermer le modal si ouvert
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({...selectedOrder, status: newStatus});
    }
  };

  const handleToggleItemPrepared = (orderId: string, itemId: string) => {
    setOrders(orders.map((order: Order) => {
      if (order.id === orderId) {
        const preparedItems = order.preparedItems || {};
        const newPreparedItems = {
          ...preparedItems,
          [itemId]: !preparedItems[itemId]
        };
        
        const updatedOrder = { ...order, preparedItems: newPreparedItems };
        
        // Mettre à jour le modal si ouvert
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(updatedOrder);
        }
        
        return updatedOrder;
      }
      return order;
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'preparing': return 'En préparation';
      case 'ready': return 'Prêt';
      case 'delivered': return 'Livré';
      default: return status;
    }
  };

  const getCustomerName = (customerInfo: any) => {
    if (!customerInfo) return 'Client anonyme';
    
    if (customerInfo.nom && customerInfo.prenom) {
      return `${customerInfo.prenom} ${customerInfo.nom}`;
    }
    
    if (customerInfo.nom) return customerInfo.nom;
    if (customerInfo.prenom) return customerInfo.prenom;
    if (customerInfo.email) return customerInfo.email.split('@')[0];
    if (customerInfo.phone) return customerInfo.phone;
    
    return 'Client anonyme';
  };

  const totalRevenue = orders.reduce((sum: number, order: Order) => sum + order.total, 0);
  const totalProducts = products.reduce((sum: number, product: Product) => sum + product.quantite_reelle, 0);

  return (
    <motion.div 
      className="bg-white border-2 border-blue-300 p-6 rounded-2xl mt-6 shadow-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h2 className="text-2xl font-bold text-blue-800 mb-4 flex items-center gap-2">
        🔐 Panneau Administrateur - {SHOP_CONFIG.name}
      </h2>
      
      <div className="flex gap-2 mb-4">
        {tabs.map(tab => (
          <motion.button
            key={tab.id}
            className={`px-4 py-2 rounded-xl font-semibold transition-all ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white' 
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
            whileHover={{ scale: 1.05 }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </motion.button>
        ))}
      </div>

      <div className="bg-blue-50 p-4 rounded-xl">
        {activeTab === 'products' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Gestion des produits</h3>
              <button
                onClick={handleAddProduct}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                ➕ Ajouter produit
              </button>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {products.map((product: Product) => (
                <div key={product.id} className="bg-white p-4 rounded-lg border">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3 flex-1">
                      <img 
                        src={product.image} 
                        alt={product.nom}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-800">{product.nom}</h4>
                        <p className="text-sm text-gray-600">{product.marque} - {product.categorie}</p>
                        <p className="text-sm text-gray-500">Stock: {product.quantite_reelle} | Prix: {product.prix_reference}€ | Emplacement: {product.emplacement}</p>
                        {product.reduction > 0 && (
                          <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded mt-1">
                            -{product.reduction}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'orders' && (
          <div>
            <h3 className="font-bold text-lg mb-4 text-center">Gestion des commandes</h3>
            {orders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📦</div>
                <p>Aucune commande pour le moment</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {orders.map((order: Order) => (
                  <div key={order.id} className="bg-white p-4 rounded-lg border">
                    {/* Interface mobile optimisée et centrée */}
                    <div className="flex flex-col gap-3">
                      {/* Informations principales - centrées */}
                      <div className="flex items-center justify-center">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-blue-800">#{order.id}</h4>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Détails commande - centrés */}
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 text-center">
                        <span>👤 <strong>{getCustomerName(order.customerInfo)}</strong></span>
                        <span>📅 {order.date}</span>
                        <span>💰 {order.total.toFixed(2)}€</span>
                        <span>📦 {order.items.reduce((sum, item) => sum + item.quantite_achat, 0)} articles</span>
                      </div>
                      
                      {/* Actions centrées */}
                      <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center gap-2"
                          title="Voir détails de la commande"
                        >
                          👁️ Détails
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm flex items-center gap-2"
                          title="Supprimer la commande"
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'stats' && (
          <div>
            <h3 className="font-bold text-lg mb-4">Statistiques</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">{totalProducts}</div>
                <div className="text-sm text-gray-600">Produits en stock</div>
              </div>
              <div className="bg-white p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">€{totalRevenue.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Chiffre d'affaires</div>
              </div>
              <div className="bg-white p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{orders.length}</div>
                <div className="text-sm text-gray-600">Commandes totales</div>
              </div>
              <div className="bg-white p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">{products.length}</div>
                <div className="text-sm text-gray-600">Produits référencés</div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Répartition par catégorie</h4>
              {categories.map(cat => {
                const count = products.filter((p: Product) => p.categorie === cat).length;
                return (
                  <div key={cat} className="flex justify-between items-center py-1">
                    <span className="text-sm">{cat}</span>
                    <span className="text-sm font-medium">{count} produit(s)</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showProductModal && (
          <ProductModal
            product={editingProduct}
            onSave={handleSaveProduct}
            onClose={() => {
              setShowProductModal(false);
              setEditingProduct(null);
            }}
          />
        )}
        
        {selectedOrder && (
          <OrderDetailModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onUpdateStatus={handleUpdateOrderStatus}
            onToggleItemPrepared={handleToggleItemPrepared}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const App: React.FC = () => {
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [admin, setAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [products, setProducts] = useState<Product[]>(() => {
    // Charger les produits depuis localStorage ou utiliser les données initiales
    return loadFromStorage(STORAGE_KEYS.PRODUCTS, initialProducts);
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    // Charger les commandes depuis localStorage
    return loadFromStorage(STORAGE_KEYS.ORDERS, []);
  });

  // 🔥 Fonction de synchronisation des données CORRIGÉE
  const handleDataSync = (syncData: SyncData) => {
    // Validation des données avant synchronisation
    if (!syncData.products || !Array.isArray(syncData.products) ||
        !syncData.orders || !Array.isArray(syncData.orders)) {
      console.error('Données de synchronisation invalides');
      return;
    }

    console.log('🔄 Application de la synchronisation:', {
      currentProducts: products.length,
      currentOrders: orders.length,
      newProducts: syncData.products.length,
      newOrders: syncData.orders.length
    });

    // 🔥 REMPLACER complètement les données locales
    setProducts(syncData.products);
    setOrders(syncData.orders);
    
    // Sauvegarder immédiatement dans localStorage
    saveToStorage(STORAGE_KEYS.PRODUCTS, syncData.products);
    saveToStorage(STORAGE_KEYS.ORDERS, syncData.orders);
    saveToStorage(STORAGE_KEYS.SYNC_TIMESTAMP, syncData.timestamp);
    
    // Mettre à jour les métadonnées de modification
    const lastModified = {
      products: syncData.timestamp,
      orders: syncData.timestamp
    };
    saveToStorage(STORAGE_KEYS.LAST_MODIFIED, lastModified);
    
    console.log('✅ Synchronisation terminée:', {
      products: syncData.products.length,
      orders: syncData.orders.length,
      timestamp: new Date(syncData.timestamp).toLocaleString('fr-FR'),
      deviceId: syncData.deviceId
    });
  };

  // 🆕 Fonction de réinitialisation forcée
  const handleForceSync = () => {
    // Réinitialiser avec les données d'origine
    setProducts(initialProducts);
    setOrders([]);
    
    // Nettoyer le localStorage
    saveToStorage(STORAGE_KEYS.PRODUCTS, initialProducts);
    saveToStorage(STORAGE_KEYS.ORDERS, []);
    saveToStorage(STORAGE_KEYS.SYNC_TIMESTAMP, Date.now());
    
    const lastModified = {
      products: Date.now(),
      orders: Date.now()
    };
    saveToStorage(STORAGE_KEYS.LAST_MODIFIED, lastModified);
    
    console.log('🔄 Magasin réinitialisé avec les données d\'origine');
  };

  // 🔥 DÉTECTION AUTOMATIQUE des données synchronisées dans l'URL au chargement - CORRIGÉE
  useEffect(() => {
    const syncData = extractSyncDataFromUrl();
    if (syncData) {
      // 🔥 TOUJOURS appliquer les données reçues via QR code (pas de vérification de timestamp)
      console.log('🔍 Données de synchronisation détectées dans l\'URL:', {
        syncTimestamp: new Date(syncData.timestamp).toLocaleString('fr-FR'),
        products: syncData.products.length,
        orders: syncData.orders.length,
        deviceId: syncData.deviceId
      });
      
      // 🔥 APPLIQUER IMMÉDIATEMENT la synchronisation
      handleDataSync(syncData);
      
      // Nettoyer l'URL après synchronisation
      const url = new URL(window.location.href);
      url.searchParams.delete('sync');
      window.history.replaceState({}, '', url.toString());
      
      // Notifier l'utilisateur avec plus de détails
      setTimeout(() => {
        alert(`✅ Synchronisation automatique réussie !\n\n📦 ${syncData.products.length} produits importés\n📋 ${syncData.orders.length} commandes importées\n🕒 ${new Date(syncData.timestamp).toLocaleString('fr-FR')}\n📱 Depuis: ${syncData.deviceId || 'Appareil inconnu'}\n\n🔄 Ce magasin est maintenant synchronisé !`);
      }, 1000);
    }
  }, []);

  // Sauvegarder les produits dans localStorage à chaque modification
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PRODUCTS, products);
    // Mettre à jour le timestamp de modification
    const lastModified = loadFromStorage(STORAGE_KEYS.LAST_MODIFIED, { products: 0, orders: 0 });
    lastModified.products = Date.now();
    saveToStorage(STORAGE_KEYS.LAST_MODIFIED, lastModified);
  }, [products]);

  // Sauvegarder les commandes dans localStorage à chaque modification
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ORDERS, orders);
    // Mettre à jour le timestamp de modification
    const lastModified = loadFromStorage(STORAGE_KEYS.LAST_MODIFIED, { products: 0, orders: 0 });
    lastModified.orders = Date.now();
    saveToStorage(STORAGE_KEYS.LAST_MODIFIED, lastModified);
  }, [orders]);

  const addToCart = (product: Product) => {
    if (product.quantite_reelle <= 0) {
      alert('Produit en rupture de stock');
      return;
    }
    
    // Vérifier si le produit est déjà dans le panier
    const existingItemIndex = cart.findIndex(item => item.id === product.id);
    
    if (existingItemIndex !== -1) {
      // Mettre à jour la quantité
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantite_achat += 1;
      setCart(updatedCart);
    } else {
      // Ajouter nouveau produit avec quantité 1
      setCart([...cart, { ...product, quantite_achat: 1 }]);
    }
    
    // Décrémenter le stock
    setProducts(products.map(p => 
      p.id === product.id 
        ? { ...p, quantite_reelle: p.quantite_reelle - 1 }
        : p
    ));
  };

  const removeFromCart = (index: number) => {
    const removedItem = cart[index];
    setCart(cart.filter((_, i) => i !== index));
    // Réincrémenter le stock
    setProducts(products.map(p => 
      p.id === removedItem.id 
        ? { ...p, quantite_reelle: p.quantite_reelle + removedItem.quantite_achat }
        : p
    ));
  };

  const updateCartQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(index);
      return;
    }

    const item = cart[index];
    const currentQuantity = item.quantite_achat;
    const difference = newQuantity - currentQuantity;
    
    // Vérifier le stock disponible
    const product = products.find(p => p.id === item.id);
    if (product && difference > 0 && product.quantite_reelle < difference) {
      alert('Stock insuffisant');
      return;
    }

    // Mettre à jour le panier
    const updatedCart = [...cart];
    updatedCart[index].quantite_achat = newQuantity;
    setCart(updatedCart);

    // Mettre à jour le stock
    setProducts(products.map(p => 
      p.id === item.id 
        ? { ...p, quantite_reelle: p.quantite_reelle - difference }
        : p
    ));
  };

  const handleCheckout = (customerInfo: any) => {
    const total = cart.reduce((sum, item) => 
      sum + (item.prix_reference * (1 - item.reduction / 100) * item.quantite_achat), 0
    );

    const newOrder: Order = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      items: [...cart],
      total,
      status: 'pending',
      paymentMode: 'espece',
      customerInfo,
      preparedItems: {} // Initialiser avec aucun produit préparé
    };

    setOrders([newOrder, ...orders]);
    setCart([]);
    setShowCheckout(false);
    
    const customerName = customerInfo.nom && customerInfo.prenom 
      ? `${customerInfo.prenom} ${customerInfo.nom}`
      : customerInfo.nom || customerInfo.prenom || 'Client';
    
    alert(`Commande validée pour ${customerName}!\nNuméro: #${newOrder.id}\nPaiement en espèces à la livraison.`);
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = !selectedCat || product.categorie === selectedCat;
    const matchesSearch = !searchTerm || 
      product.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.marque.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  useEffect(() => {
    document.title = `${SHOP_CONFIG.name} - ${SHOP_CONFIG.subtitle}`;
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
      </div>
      
      <div className="relative z-10 font-sans pt-8 pb-12 px-4 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 drop-shadow-lg">
            {SHOP_CONFIG.name}
          </h1>
          <p className="text-lg text-gray-600 italic">{SHOP_CONFIG.subtitle}</p>
          
          {/* 🔥 Search bar avec QR Code synchronisation CORRIGÉE */}
          <SearchWithQR 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm}
            products={products}
            orders={orders}
            onDataSync={handleDataSync}
            onForceSync={handleForceSync}
          />
        </motion.div>

        {/* Category Filter */}
        <CategoryFilter selectedCat={selectedCat} setSelectedCat={setSelectedCat} />

        {/* Products Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
          layout
        >
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
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucun produit trouvé</h3>
            <p className="text-gray-500">Essayez de modifier vos critères de recherche</p>
          </motion.div>
        )}

        {/* Cart */}
        <Cart 
          cart={cart} 
          removeFromCart={removeFromCart} 
          updateQuantity={updateCartQuantity}
        />

        {/* 🆕 Bouton admin discret + Panneau admin */}
        {!admin && (
          <DiscreteAdminButton setAdmin={setAdmin} />
        )}
        
        {admin && (
          <AdminPanel 
            products={products}
            setProducts={setProducts}
            orders={orders}
            setOrders={setOrders}
          />
        )}

        {/* Floating Cart Icon */}
        <AnimatePresence>
          <FloatingCartIcon 
            cart={cart} 
            onClick={() => setShowCheckout(true)}
          />
        </AnimatePresence>

        {/* Checkout Modal */}
        <AnimatePresence>
          {showCheckout && (
            <CheckoutModal
              cart={cart}
              onClose={() => setShowCheckout(false)}
              onConfirm={handleCheckout}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default App;
