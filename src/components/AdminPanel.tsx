import React, { useState } from 'react';
import { Product, Order } from '../types';
import { ProductService } from '../services/productService';

interface AdminPanelProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  onReloadProducts?: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  products, 
  setProducts, 
  orders, 
  setOrders,
  onReloadProducts 
}) => {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [newProduct, setNewProduct] = useState({
    nom: '',
    marque: '',
    prix_reference: 0,
    reduction: 0,
    image_url: '',
    categorie: 'makeup',
    quantite_reference: 100, // ml ou gr de référence
    quantite_reelle: 100,    // ml ou gr réellement
    stock_unite: 0,          // nombre d'unités en stock
    emplacement_stock: '',   // emplacement dans le stock
    description: ''
  });

  // Fonction pour calculer le prix réel
  const calculateRealPrice = (product: any) => {
    if (product.quantite_reference > 0) {
      return (product.prix_reference / product.quantite_reference) * product.quantite_reelle;
    }
    return product.prix_reference;
  };

  // Upload d'image vers Supabase Storage
  const handleImageUpload = async (file: File, isEditing = false) => {
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image');
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('L\'image doit faire moins de 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      console.log('Upload image en cours...', file.name);
      
      const imageUrl = await ProductService.uploadImage(file);
      
      if (isEditing && editingProduct) {
        setEditingProduct({...editingProduct, image_url: imageUrl});
      } else {
        setNewProduct({...newProduct, image_url: imageUrl});
      }

      alert('Image uploadée avec succès !');
    } catch (error) {
      console.error('Erreur upload image:', error);
      alert('Erreur lors de l\'upload de l\'image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Ajouter un produit dans Supabase
  const handleAddProduct = async () => {
    if (!newProduct.nom || !newProduct.marque || newProduct.prix_reference <= 0) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      console.log('Ajout produit dans Supabase...');
      const addedProduct = await ProductService.addProduct(newProduct);
      
      // Mettre à jour l'état local
      setProducts([...products, addedProduct]);
      
      // Réinitialiser le formulaire
      setNewProduct({
        nom: '',
        marque: '',
        prix_reference: 0,
        reduction: 0,
        image_url: '',
        categorie: 'makeup',
        quantite_reference: 100,
        quantite_reelle: 100,
        stock_unite: 0,
        emplacement_stock: '',
        description: ''
      });

      alert('Produit ajouté avec succès dans Supabase !');
    } catch (error) {
      console.error('Erreur ajout produit:', error);
      alert('Erreur lors de l\'ajout du produit');
    }
  };

  // Modifier un produit dans Supabase
  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    try {
      console.log('Modification produit dans Supabase...');
      await ProductService.updateProduct(editingProduct.id, editingProduct);
      
      // Mettre à jour l'état local
      setProducts(products.map(p => 
        p.id === editingProduct.id ? editingProduct : p
      ));
      
      setEditingProduct(null);
      alert('Produit modifié avec succès dans Supabase !');
    } catch (error) {
      console.error('Erreur modification produit:', error);
      alert('Erreur lors de la modification du produit');
    }
  };

  // Supprimer un produit de Supabase
  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      return;
    }

    try {
      console.log('Suppression produit de Supabase...');
      await ProductService.deleteProduct(productId);
      
      // Mettre à jour l'état local
      setProducts(products.filter(p => p.id !== productId));
      
      alert('Produit supprimé avec succès de Supabase !');
    } catch (error) {
      console.error('Erreur suppression produit:', error);
      alert('Erreur lors de la suppression du produit');
    }
  };

  // Marquer un item comme préparé/non préparé
  const toggleItemPrepared = (orderId: string, productId: number) => {
    const updatedOrders = orders.map(order => {
      if (order.id === orderId) {
        const updatedItems = order.items.map(item => 
          item.id === productId 
            ? { ...item, prepared: !item.prepared }
            : item
        );
        
        // Vérifier si tous les items sont préparés pour changer le statut
        const allPrepared = updatedItems.every(item => item.prepared);
        const newStatus = allPrepared ? 'completed' : 
                         updatedItems.some(item => item.prepared) ? 'preparation' : 'pending';
        
        return { ...order, items: updatedItems, status: newStatus };
      }
      return order;
    });
    
    setOrders(updatedOrders);
  };

  // Changer le statut d'une commande avec sauvegarde Supabase - CORRIGÉ
  const changeOrderStatus = async (orderId: string, newStatus: 'pending' | 'preparation' | 'completed' | 'deleted') => {
    console.log('Début changeOrderStatus:', orderId, 'vers', newStatus);
    
    try {
      // Mettre à jour dans Supabase d'abord
      console.log('Appel ProductService.updateOrderStatus...');
      await ProductService.updateOrderStatus(orderId, newStatus);
      console.log('Supabase mis à jour avec succès');
      
      // Puis mettre à jour l'état local
      const updatedOrders = orders.map(order => {
        if (order.id === orderId) {
          // Si on passe en completed, marquer tous les items comme préparés
          if (newStatus === 'completed') {
            const updatedItems = order.items.map(item => ({ ...item, prepared: true }));
            return { ...order, status: newStatus, items: updatedItems };
          }
          // Si on passe en pending, marquer tous les items comme non préparés
          if (newStatus === 'pending') {
            const updatedItems = order.items.map(item => ({ ...item, prepared: false }));
            return { ...order, status: newStatus, items: updatedItems };
          }
          return { ...order, status: newStatus };
        }
        return order;
      });
      
      setOrders(updatedOrders);
      console.log(`Statut commande ${orderId} mis à jour vers ${newStatus}`);
      
    } catch (error) {
      console.error('ERREUR changeOrderStatus:', error);
      alert('Erreur lors de la mise à jour du statut: ' + error.message);
    }
  };

  // Supprimer définitivement une commande avec Supabase - CORRIGÉ
  const deleteOrder = async (orderId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement cette commande ?')) {
      return;
    }

    try {
      console.log('Suppression commande:', orderId);
      // Supprimer de Supabase d'abord
      await ProductService.deleteOrder(orderId);
      
      // Puis mettre à jour l'état local
      setOrders(orders.filter(order => order.id !== orderId));
      alert('Commande supprimée définitivement');
    } catch (error) {
      console.error('Erreur suppression commande:', error);
      alert('Erreur lors de la suppression de la commande: ' + error.message);
    }
  };

  // Recharger tous les produits depuis Supabase
  const handleReloadProducts = async () => {
    try {
      console.log('Rechargement produits depuis Supabase...');
      const data = await ProductService.getAllProducts();
      setProducts(data);
      alert(`${data.length} produits rechargés depuis Supabase !`);
    } catch (error) {
      console.error('Erreur rechargement:', error);
      alert('Erreur lors du rechargement');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-6xl max-h-[90vh] overflow-y-auto w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Panel Administrateur</h2>
          <div className="flex gap-2">
            <button
              onClick={handleReloadProducts}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Recharger Supabase
            </button>
            <button
              onClick={() => {
                setEditingProduct(null);
                if (onReloadProducts) onReloadProducts();
                window.dispatchEvent(new CustomEvent('closeAdmin'));
              }}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Fermer
            </button>
          </div>
        </div>

        {/* Onglets */}
        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-t-lg font-medium ${
              activeTab === 'products'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Produits ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-t-lg font-medium ${
              activeTab === 'orders'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Commandes ({orders.length})
          </button>
        </div>

        {/* Contenu selon l'onglet actif */}
        {activeTab === 'products' ? (
          <>
            {/* Statistiques Produits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-100 p-4 rounded">
                <h3 className="font-semibold">Produits</h3>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
              <div className="bg-purple-100 p-4 rounded">
                <h3 className="font-semibold">Stock Total</h3>
                <p className="text-2xl font-bold">
                  {products.reduce((sum, p) => sum + (p.stock_unite || 0), 0)}
                </p>
              </div>
              <div className="bg-orange-100 p-4 rounded">
                <h3 className="font-semibold">Valeur Stock</h3>
                <p className="text-2xl font-bold">
                  {products.reduce((sum, p) => sum + (calculateRealPrice(p) * (p.stock_unite || 0)), 0).toFixed(0)}€
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Formulaire d'ajout/modification */}
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="text-lg font-semibold mb-4">
                  {editingProduct ? 'Modifier le produit' : 'Ajouter un nouveau produit'}
                </h3>
                
                {(() => {
                  const currentProduct = editingProduct || newProduct;
                  const setCurrentProduct = editingProduct 
                    ? (updates: any) => setEditingProduct({...editingProduct, ...updates})
                    : (updates: any) => setNewProduct({...newProduct, ...updates});

                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Nom du produit (ex: Rouge à lèvres mat)"
                          value={currentProduct.nom}
                          onChange={(e) => setCurrentProduct({nom: e.target.value})}
                          className="p-2 border rounded"
                        />
                        <input
                          type="text"
                          placeholder="Marque (ex: Beauté-légance)"
                          value={currentProduct.marque}
                          onChange={(e) => setCurrentProduct({marque: e.target.value})}
                          className="p-2 border rounded"
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Prix internet en € (ex: 15.99)"
                          value={currentProduct.prix_reference || ''}
                          onChange={(e) => setCurrentProduct({prix_reference: parseFloat(e.target.value) || 0})}
                          className="p-2 border rounded"
                        />
                        <input
                          type="number"
                          placeholder="Quantité référence ml/gr (ex: 15)"
                          value={currentProduct.quantite_reference || ''}
                          onChange={(e) => setCurrentProduct({quantite_reference: parseInt(e.target.value) || 100})}
                          className="p-2 border rounded"
                        />
                        <input
                          type="number"
                          placeholder="Quantité réelle ml/gr (ex: 12)"
                          value={currentProduct.quantite_reelle || ''}
                          onChange={(e) => setCurrentProduct({quantite_reelle: parseInt(e.target.value) || 100})}
                          className="p-2 border rounded"
                        />
                        <input
                          type="number"
                          placeholder="Réduction en % (ex: 10)"
                          value={currentProduct.reduction || ''}
                          onChange={(e) => setCurrentProduct({reduction: parseInt(e.target.value) || 0})}
                          className="p-2 border rounded"
                        />
                        <input
                          type="number"
                          placeholder="Stock (nb unités) (ex: 25)"
                          value={currentProduct.stock_unite || ''}
                          onChange={(e) => setCurrentProduct({stock_unite: parseInt(e.target.value) || 0})}
                          className="p-2 border rounded"
                        />
                        <input
                          type="text"
                          placeholder="Emplacement (ex: A1-R2)"
                          value={currentProduct.emplacement_stock || ''}
                          onChange={(e) => setCurrentProduct({emplacement_stock: e.target.value})}
                          className="p-2 border rounded"
                        />
                        <select
                          value={currentProduct.categorie}
                          onChange={(e) => setCurrentProduct({categorie: e.target.value})}
                          className="p-2 border rounded"
                        >
                          <option value="makeup">Maquillage</option>
                          <option value="skincare">Soins Visage</option>
                          <option value="bodycare">Soins Corps</option>
                          <option value="haircare">Cheveux</option>
                          <option value="fragrance">Parfums</option>
                          <option value="accessories">Accessoires</option>
                        </select>
                        
                        {/* Affichage du prix réel calculé */}
                        <div className="p-2 border rounded bg-gray-100">
                          <span className="text-sm text-gray-600">Prix réel calculé:</span>
                          <div className="font-bold text-green-600">
                            {calculateRealPrice(currentProduct).toFixed(2)}€
                          </div>
                        </div>
                      </div>

                      {/* Section image */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Image du produit
                        </label>
                        
                        {/* Zone d'upload */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          {currentProduct.image_url ? (
                            <div className="space-y-2">
                              <img 
                                src={currentProduct.image_url} 
                                alt="Aperçu" 
                                className="w-32 h-32 object-cover rounded border mx-auto"
                              />
                              <button
                                type="button"
                                onClick={() => setCurrentProduct({image_url: ''})}
                                className="text-red-500 text-sm hover:underline"
                              >
                                Supprimer l'image
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="text-gray-400 text-4xl">📸</div>
                              <p className="text-gray-500">Cliquez pour ajouter une image</p>
                            </div>
                          )}
                          
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(file, !!editingProduct);
                              }
                            }}
                            className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                            disabled={uploadingImage}
                          />
                          
                          {uploadingImage && (
                            <p className="text-purple-600 text-sm mt-2">
                              Upload en cours...
                            </p>
                          )}
                        </div>
                      </div>

                      <textarea
                        placeholder="Description du produit"
                        value={currentProduct.description || ''}
                        onChange={(e) => setCurrentProduct({description: e.target.value})}
                        className="w-full p-2 border rounded"
                        rows={2}
                      />
                    </div>
                  );
                })()}

                <div className="flex gap-2 mt-4">
                  {editingProduct ? (
                    <>
                      <button
                        onClick={handleUpdateProduct}
                        className="px-6 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                      >
                        Modifier dans Supabase
                      </button>
                      <button
                        onClick={() => setEditingProduct(null)}
                        className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                      >
                        Annuler
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleAddProduct}
                      className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Ajouter dans Supabase
                    </button>
                  )}
                </div>
              </div>

              {/* Liste des produits */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Produits actuels ({products.length})</h3>
                <div className="max-h-96 overflow-y-auto bg-white border rounded">
                  {products.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Aucun produit. Cliquez sur "Recharger Supabase" ou ajoutez-en un.
                    </div>
                  ) : (
                    products.map(product => (
                      <div key={product.id} className="flex items-center justify-between p-3 border-b hover:bg-gray-50">
                        <div className="flex items-center space-x-3 flex-1">
                          {/* Miniature du produit */}
                          <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                            {product.image_url ? (
                              <img 
                                src={product.image_url} 
                                alt={product.nom}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.currentTarget as HTMLImageElement;
                                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjI0IiBjeT0iMjQiIHI9IjE2IiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIvPgo8Y2lyY2xlIGN4PSIyNCIgY3k9IjI0IiByPSI2IiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                📷
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="font-medium">{product.nom}</div>
                            <div className="text-sm text-gray-600">
                              {product.marque} • {calculateRealPrice(product).toFixed(2)}€ (réel) • Stock: {product.stock_unite} • {product.emplacement_stock}
                            </div>
                            <div className="text-xs text-gray-500">
                              {product.quantite_reelle}ml/gr réel ({product.quantite_reference}ml/gr ref. = {product.prix_reference}€)
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingProduct(product)}
                            className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
                            title="Modifier ce produit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                            title="Supprimer ce produit"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Statistiques Commandes */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-100 p-4 rounded">
                <h3 className="font-semibold">Total Commandes</h3>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>
              <div className="bg-yellow-100 p-4 rounded">
                <h3 className="font-semibold">En attente</h3>
                <p className="text-2xl font-bold">
                  {orders.filter(o => o.status === 'pending').length}
                </p>
              </div>
              <div className="bg-orange-100 p-4 rounded">
                <h3 className="font-semibold">En préparation</h3>
                <p className="text-2xl font-bold">
                  {orders.filter(o => o.status === 'preparation').length}
                </p>
              </div>
              <div className="bg-purple-100 p-4 rounded">
                <h3 className="font-semibold">CA Total</h3>
                <p className="text-2xl font-bold">
                  {orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}€
                </p>
              </div>
            </div>

            {/* Liste des commandes avec gestion préparation */}
            <div className="bg-white border rounded-lg">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold">Gestion des commandes</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {orders.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    Aucune commande pour le moment
                  </div>
                ) : (
                  orders.map(order => (
                    <div key={order.id} className={`border-b p-4 ${
                      order.status === 'pending' ? 'bg-yellow-50' : 
                      order.status === 'preparation' ? 'bg-orange-50' : 
                      order.status === 'completed' ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-semibold">Commande #{order.id}</div>
                          <div className="text-sm text-gray-600">{order.date}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            Client: {order.customerInfo?.nom || order.customerInfo?.prenom || 'Client'} 
                            {order.customerInfo?.email && (
                              <span> • {order.customerInfo.email}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600 mb-2">{order.total.toFixed(2)}€</div>
                          
                          <div className="flex items-center space-x-2">
                            {/* Sélecteur de statut */}
                            <select
                              value={order.status}
                              onChange={(e) => changeOrderStatus(order.id, e.target.value as any)}
                              className={`text-xs px-2 py-1 rounded border ${
                                order.status === 'pending' 
                                  ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 
                                order.status === 'preparation'
                                  ? 'bg-orange-100 text-orange-800 border-orange-300' :
                                order.status === 'completed'
                                  ? 'bg-green-100 text-green-800 border-green-300' :
                                  'bg-red-100 text-red-800 border-red-300'
                              }`}
                            >
                              <option value="pending">⏳ En attente</option>
                              <option value="preparation">🔄 En préparation</option>
                              <option value="completed">✅ Terminée</option>
                              <option value="deleted">❌ Supprimée</option>
                            </select>
                            
                            {/* Petite icône suppression */}
                            <button
                              onClick={() => deleteOrder(order.id)}
                              className="w-6 h-6 bg-red-500 text-white rounded hover:bg-red-600 flex items-center justify-center text-xs"
                              title="Supprimer définitivement cette commande"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Liste des articles avec coches de préparation */}
                      <div className="space-y-2">
                        <div className="font-medium text-sm mb-2">Articles à préparer :</div>
                        {order.items.map((item, idx) => (
                          <div key={idx} className={`flex items-center justify-between p-2 rounded border ${
                            item.prepared ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                          }`}>
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={item.prepared || false}
                                onChange={() => toggleItemPrepared(order.id, item.id)}
                                className="w-4 h-4 text-green-600"
                              />
                              
                              {/* Miniature du produit */}
                              <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                {item.image_url ? (
                                  <img 
                                    src={item.image_url} 
                                    alt={item.nom}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.currentTarget as HTMLImageElement;
                                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEwIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIvPgo8Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSI0IiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K';
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                    📷
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex-1">
                                <div className="font-medium text-sm">{item.nom}</div>
                                <div className="text-xs text-gray-600">
                                  {item.marque} • Quantité: {item.quantite_achat} • {calculateRealPrice(item).toFixed(2)}€/unité
                                </div>
                                {/* Afficher l'emplacement du produit - TOUJOURS affiché */}
                                {(() => {
                                  const product = products.find(p => p.id === item.id);
                                  return (
                                    <div className="text-xs text-blue-600 font-medium mt-1">
                                      📍 Emplacement: {product?.emplacement_stock || 'Non défini'}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                            <div className={`text-xs px-2 py-1 rounded ${
                              item.prepared 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {item.prepared ? '✓ Préparé' : '⏳ À préparer'}
                            </div>
                          </div>
                        ))}
                        
                        {/* Indicateur de progression */}
                        <div className="mt-3 pt-2 border-t">
                          <div className="flex justify-between text-sm">
                            <span>Progression:</span>
                            <span>{order.items.filter(item => item.prepared).length} / {order.items.length} articles</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-green-600 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${(order.items.filter(item => item.prepared).length / order.items.length) * 100}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;