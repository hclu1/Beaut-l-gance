// components/AdminPanel.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product, Order } from '../types';
import { categories, SHOP_CONFIG } from '../constants';
import { getStatusColor, getStatusLabel, getCustomerName } from '../utils';
import ProductModal from './ProductModal';
import OrderDetailModal from './OrderDetailModal';

interface AdminPanelProps {
  products: Product[];
  setProducts: (products: Product[]) => void;
  orders: Order[];
  setOrders: (orders: Order[]) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ products, setProducts, orders, setOrders }) => {
  const [activeTab, setActiveTab] = useState('products');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
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
      setProducts(products.map((p) => 
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
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) {
      setOrders(orders.filter((order) => order.id !== orderId));
    }
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: string) => {
    setOrders(orders.map((order) => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({...selectedOrder, status: newStatus});
    }
  };

  const handleToggleItemPrepared = (orderId: string, itemId: string) => {
    setOrders(orders.map((order) => {
      if (order.id === orderId) {
        const preparedItems = order.preparedItems || {};
        const newPreparedItems = {
          ...preparedItems,
          [itemId]: !preparedItems[itemId]
        };
        
        const updatedOrder = { ...order, preparedItems: newPreparedItems };
        
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(updatedOrder);
        }
        
        return updatedOrder;
      }
      return order;
    }));
  };

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalProducts = products.reduce((sum, product) => sum + product.quantite_reelle, 0);

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
              {products.map((product) => (
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
                {orders.map((order) => (
                  <div key={order.id} className="bg-white p-4 rounded-lg border">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-center">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-blue-800">#{order.id}</h4>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 text-center">
                        <span>👤 <strong>{getCustomerName(order.customerInfo)}</strong></span>
                        <span>📅 {order.date}</span>
                        <span>💰 {order.total.toFixed(2)}€</span>
                        <span>📦 {order.items.reduce((sum, item) => sum + item.quantite_achat, 0)} articles</span>
                      </div>
                      
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
                const count = products.filter((p) => p.categorie === cat).length;
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
};

export default AdminPanel;