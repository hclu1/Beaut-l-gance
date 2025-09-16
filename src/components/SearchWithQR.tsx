// components/SearchWithQR.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product, Order, SyncData } from '../types';
import { SHOP_CONFIG } from '../constants';
import { generateSyncUrl, getDeviceId } from '../utils';

interface SearchWithQRProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  products: Product[];
  orders: Order[];
  onDataSync: (syncData: SyncData) => void;
  onForceSync: () => void;
}

const SearchWithQR: React.FC<SearchWithQRProps> = ({
  searchTerm,
  setSearchTerm,
  products,
  orders,
  onDataSync,
  onForceSync
}) => {
  const [showQR, setShowQR] = useState(false);
  const [qrMode, setQrMode] = useState<'sync' | 'share'>('sync');
  const [lastSyncStats, setLastSyncStats] = useState<{ 
    products: number; 
    orders: number; 
    date: string;
    deviceId: string;
  } | null>(null);

  const getAppUrl = () => {
    return window.location.origin + window.location.pathname;
  };

  const getSyncUrl = () => {
    console.log('🔄 Génération URL de sync avec état actuel:', {
      products: products.length,
      orders: orders.length,
      totalStock: products.reduce((sum, p) => sum + p.quantite_reelle, 0)
    });
    return generateSyncUrl(products, orders);
  };

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

  const shareData = async () => {
    const url = getSyncUrl();
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

  const forceSyncReset = () => {
    if (confirm('⚠️ Attention !\n\nCette action va remettre à zéro toutes les données de ce magasin (retour aux données initiales).\n\nContinuer ?')) {
      onForceSync();
      alert('✅ Magasin réinitialisé avec les données d\'origine.');
      setShowQR(false);
    }
  };

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
                  
                  {/* QR Code */}
                  <div className="bg-white p-3 rounded-lg shadow-inner mb-4 border">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
                        qrMode === 'share' ? getAppUrl() : getSyncUrl()
                      )}&size=150x150&bgcolor=ffffff&color=${
                        qrMode === 'share' ? '3b82f6' : '7c3aed'
                      }&margin=0&ecc=M`}
                      alt={`QR code ${qrMode === 'share' ? 'partage application' : 'synchronisation'} ${SHOP_CONFIG.name}`}
                      className="w-32 h-32 mx-auto"
                      style={{ imageRendering: 'auto' }}
                      key={`${qrMode}-${Date.now()}`}
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

                  {lastSyncStats && qrMode === 'sync' && (
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

                  {/* Debug info */}
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
};

export default SearchWithQR;