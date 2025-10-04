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
  const [showQR, setShowQR] = useState(false);
  
  // NOUVEAUX ÉTATS pour la gestion des variantes
  const [addingVariant, setAddingVariant] = useState<boolean>(false);
  const [variantBaseProduct, setVariantBaseProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  
  // États pour le filtre de marque
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  
  // Extraire toutes les marques uniques des produits
  const allBrands = Array.from(new Set(products.map(p => p.marque).filter(Boolean))).sort();
  
  const [newProduct, setNewProduct] = useState({
    nom: '',
    marque: '',
    prix_reference: 0,
    reduction: 0,
    image_url: '',
    categorie: 'makeup',
    quantite_reference: 0,
    quantite_reelle: 0,
    stock_unite: 0,
    emplacement_stock: '',
    description: ''
  });

  // NOUVELLE FONCTION : Compression d'images
  const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Calculer la nouvelle taille en conservant le ratio
        let { width, height } = img;
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width = (width * maxWidth) / height;
            height = maxWidth;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Dessiner l'image redimensionnée
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir en WebP compressé
        canvas.toBlob((blob) => {
          const compressedFile = new File(
            [blob!], 
            file.name.replace(/\.(jpg|jpeg|png)$/i, '.webp'), 
            { type: 'image/webp' }
          );
          resolve(compressedFile);
        }, 'image/webp', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Fonction QR Code pour partage boutique
  const generateQRCode = () => {
    const currentUrl = window.location.href.split('?')[0];
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentUrl)}`;
  };

  // Fonction pour calculer le prix réel
  const calculateRealPrice = (product: any) => {
    if (product.quantite_reference > 0) {
      return (product.prix_reference / product.quantite_reference) * product.quantite_reelle;
    }
    return product.prix_reference;
  };

  // MODIFIÉE : Upload d'image avec compression
  const handleImageUpload = async (file: File, isEditing = false) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image');
      return;
    }

    try {
      setUploadingImage(true);
      console.log(`Fichier original: ${file.name} - ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      
      // Compresser l'image avant upload
      const compressedFile = await compressImage(file, 800, 0.8);
      console.log(`Fichier compressé: ${compressedFile.name} - ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
      
      // Uploader l'image compressée
      const imageUrl = await ProductService.uploadImage(compressedFile);
      
      if (isEditing && editingProduct) {
        setEditingProduct({...editingProduct, image_url: imageUrl});
      } else {
        setNewProduct({...newProduct, image_url: imageUrl});
      }

      alert(`Image optimisée et uploadée avec succès !\nTaille réduite de ${(file.size / 1024 / 1024).toFixed(2)} MB à ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
    } catch (error) {
      console.error('Erreur compression/upload image:', error);
      alert('Erreur lors de l\'optimisation/upload de l\'image');
    } finally {
      setUploadingImage(false);
    }
  };

  // NOUVELLE FONCTION pour vérifier les doublons
  const checkForDuplicates = async () => {
    if (!newProduct.nom || !newProduct.marque) {
      alert('Veuillez entrer un nom et une marque pour vérifier les doublons');
      return;
    }

    try {
      const similarProducts = await ProductService.getSimilarProducts(newProduct.nom, newProduct.marque);
      setSimilarProducts(similarProducts);
      
      if (similarProducts.length > 0) {
        alert(`Produits similaires trouvés (${similarProducts.length}):\n` +
          similarProducts.map(p => `- ${p.nom} (${p.quantite_reelle}ml/gr)`).join('\n') +
          '\n\nVous pouvez ajouter une nouvelle variante à ce produit.');
        
        // Pré-remplir le formulaire pour ajouter une variante
        setVariantBaseProduct(similarProducts[0]);
        setAddingVariant(true);
        
        setNewProduct({
          ...similarProducts[0],
          quantite_reelle: 0,
          stock_unite: 0,
          id: 0, // Pour forcer la création d'un nouveau produit
        });
      } else {
        alert('Aucun produit similaire trouvé. Vous pouvez ajouter un nouveau produit.');
        setAddingVariant(false);
        setVariantBaseProduct(null);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des doublons:', error);
      alert('Erreur lors de la vérification des doublons');
    }
  };

  // NOUVELLE FONCTION pour ajouter une variante
  const handleAddVariant = (product: Product) => {
    setVariantBaseProduct(product);
    setAddingVariant(true);
    
    // Pré-remplir le formulaire avec les données du produit de base
    setNewProduct({
      ...product,
      quantite_reelle: 0,
      stock_unite: 0,
      id: 0, // Pour forcer la création d'un nouveau produit
    });
    
    // Faire défiler jusqu'au formulaire
    setTimeout(() => {
      document.querySelector('.add-product-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // MODIFIÉE : Ajouter un produit dans Supabase avec gestion des variantes
  const handleAddProduct = async () => {
    if (!newProduct.nom || !newProduct.marque || newProduct.prix_reference <= 0) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      console.log('Ajout produit dans Supabase...');
      
      let addedProduct;
      
      if (addingVariant && variantBaseProduct) {
        // Ajout d'une variante à un produit existant
        addedProduct = await ProductService.addProductWithVariant({
          ...newProduct,
          variant_id: variantBaseProduct.variant_id
        });
        
        alert('Variante ajoutée avec succès !');
      } else {
        // Ajout d'un nouveau produit
        addedProduct = await ProductService.addProduct(newProduct);
        alert('Produit ajouté avec succès dans Supabase !');
      }
      
      setProducts([...products, addedProduct]);
      
      // Réinitialiser le formulaire
      setNewProduct({
        nom: '',
        marque: '',
        prix_reference: 0,
        reduction: 0,
        image_url: '',
        categorie: 'makeup',
        quantite_reference: 0,
        quantite_reelle: 0,
        stock_unite: 0,
        emplacement_stock: '',
        description: ''
      });
      
      // Réinitialiser les états de variante
      setAddingVariant(false);
      setVariantBaseProduct(null);
      setSimilarProducts([]);
      
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
        
        const allPrepared = updatedItems.every(item => item.prepared);
        const newStatus = allPrepared ? 'completed' : 
                         updatedItems.some(item => item.prepared) ? 'preparation' : 'pending';
        
        return { ...order, items: updatedItems, status: newStatus };
      }
      return order;
    });
    
    setOrders(updatedOrders);
  };

  // Changer le statut d'une commande avec sauvegarde Supabase
  const changeOrderStatus = async (orderId: string, newStatus: 'pending' | 'preparation' | 'completed' | 'deleted') => {
    console.log('Début changeOrderStatus:', orderId, 'vers', newStatus);
    
    try {
      console.log('Appel ProductService.updateOrderStatus...');
      await ProductService.updateOrderStatus(orderId, newStatus);
      console.log('Supabase mis à jour avec succès');
      
      const updatedOrders = orders.map(order => {
        if (order.id === orderId) {
          if (newStatus === 'completed') {
            const updatedItems = order.items.map(item => ({ ...item, prepared: true }));
            return { ...order, status: newStatus, items: updatedItems };
          }
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

  // Supprimer définitivement une commande avec Supabase
  const deleteOrder = async (orderId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement cette commande ?')) {
      return;
    }

    try {
      console.log('Suppression commande:', orderId);
      await ProductService.deleteOrder(orderId);
      
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-lg p-4 md:p-6 max-w-6xl max-h-[95vh] overflow-y-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-xl md:text-2xl font-bold">Panel Administrateur</h2>
          <div className="flex gap-2 self-end md:self-auto">
            <button
              onClick={() => setShowQR(!showQR)}
              className="px-3 py-2 md:px-4 md:py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm md:text-base"
            >
              📱 QR Code
            </button>
            <button
              onClick={handleReloadProducts}
              className="px-3 py-2 md:px-4 md:py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm md:text-base"
            >
              Recharger
            </button>
            <button
              onClick={() => {
                setEditingProduct(null);
                if (onReloadProducts) onReloadProducts();
                window.dispatchEvent(new CustomEvent('closeAdmin'));
              }}
              className="px-3 py-2 md:px-4 md:py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm md:text-base"
            >
              Fermer
            </button>
          </div>
        </div>

        {/* Modal QR Code */}
        {showQR && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 text-center max-w-sm w-full">
              <h3 className="text-lg font-bold mb-4">QR Code - Partager la boutique</h3>
              <img 
                src={generateQRCode()}
                alt="QR Code Boutique"
                className="mx-auto mb-4 border rounded"
              />
              <p className="text-sm text-gray-600 mb-4">
                Scannez ce code pour accéder à votre boutique Beauté&Élégance
              </p>
              <button
                onClick={() => setShowQR(false)}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Fermer
              </button>
            </div>
          </div>
        )}

        {/* Onglets */}
        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-3 py-2 md:px-4 md:py-2 rounded-t-lg font-medium text-sm md:text-base ${
              activeTab === 'products'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Produits ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-2 md:px-4 md:py-2 rounded-t-lg font-medium text-sm md:text-base ${
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
            {/* Statistiques côte à côte et responsive */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              <div className="bg-blue-100 p-3 rounded text-center">
                <h3 className="font-semibold text-sm">Produits</h3>
                <p className="text-xl md:text-2xl font-bold">{products.length}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded text-center">
                <h3 className="font-semibold text-sm">Stock Total</h3>
                <p className="text-xl md:text-2xl font-bold">
                  {products.reduce((sum, p) => sum + (p.stock_unite ?? 0), 0)}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded text-center">
                <h3 className="font-semibold text-sm">Valeur Stock</h3>
                <p className="text-xl md:text-2xl font-bold">
                  {products.reduce((sum, p) => sum + (calculateRealPrice(p) * (p.stock_unite || 0)), 0).toFixed(0)}€
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Formulaire d'ajout/modification */}
              <div className="bg-gray-50 p-4 rounded add-product-form">
                <h3 className="text-lg font-semibold mb-4">
                  {addingVariant ? 'Ajouter une variante' : (editingProduct ? 'Modifier le produit' : 'Ajouter un nouveau produit')}
                </h3>
                
                {/* Indicateur si on ajoute une variante */}
                {addingVariant && variantBaseProduct && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-blue-700">
                      <strong>Ajout d'une variante à:</strong> {variantBaseProduct.nom} ({variantBaseProduct.marque})
                    </p>
                    <p className="text-blue-600 text-sm">
                      Les informations de base sont pré-remplies. Modifiez uniquement la quantité réelle et le stock.
                    </p>
                  </div>
                )}
                
                {(() => {
                  const currentProduct = editingProduct || newProduct;
                  const setCurrentProduct = editingProduct 
                    ? (updates: any) => setEditingProduct({...editingProduct, ...updates})
                    : (updates: any) => setNewProduct({...newProduct, ...updates});

                  return (
                    <div className="space-y-4">
                      {/* Section image EN PREMIER avec indicateur d'optimisation */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Image du produit 
                          <span className="text-xs text-green-600 ml-2">✨ Optimisation automatique WebP</span>
                        </label>
                        
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
                              <p className="text-xs text-green-600">
                                L'image sera automatiquement optimisée et convertie en WebP
                              </p>
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
                              🔄 Optimisation et upload en cours...
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Nom du produit JUSTE APRÈS l'image */}
                      <input
                        type="text"
                        placeholder="Nom du produit (ex: Rouge à lèvres mat)"
                        value={currentProduct.nom}
                        onChange={(e) => setCurrentProduct({nom: e.target.value})}
                        className="w-full p-2 border rounded text-sm"
                      />

                      {/* Autres champs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Sélecteur de marque amélioré */}
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Marque
                          </label>
                          <div className="space-y-2">
                            <select
                              value={currentProduct.marque && allBrands.includes(currentProduct.marque) ? currentProduct.marque : 'custom'}
                              onChange={(e) => {
                                if (e.target.value === 'custom') {
                                  setCurrentProduct({marque: ''});
                                } else {
                                  setCurrentProduct({marque: e.target.value});
                                }
                              }}
                              className="w-full p-2 border rounded text-sm"
                            >
                              <option value="custom">➕ Nouvelle marque (saisir ci-dessous)</option>
                              {allBrands.length > 0 && <option disabled>─────────────────</option>}
                              {allBrands.map(brand => (
                                <option key={brand} value={brand}>{brand}</option>
                              ))}
                            </select>
                            
                            {/* Champ de saisie pour nouvelle marque */}
                            {(!currentProduct.marque || !allBrands.includes(currentProduct.marque)) && (
                              <input
                                type="text"
                                placeholder="Saisir la nouvelle marque"
                                value={currentProduct.marque}
                                onChange={(e) => setCurrentProduct({marque: e.target.value})}
                                className="w-full p-2 border rounded text-sm border-blue-300 bg-blue-50"
                                autoFocus
                              />
                            )}
                          </div>
                        </div>
                        
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Prix internet en € (ex: 15.99)"
                          value={currentProduct.prix_reference || ''}
                          onChange={(e) => setCurrentProduct({prix_reference: parseFloat(e.target.value) || 0})}
                          className="p-2 border rounded text-sm"
                        />
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Quantité référence (ml/gr)</label>
                          <input
                            type="number"
                            placeholder="0"
                            value={currentProduct.quantite_reference || ''}
                            onChange={(e) => setCurrentProduct({quantite_reference: parseInt(e.target.value) || 0})}
                            className="w-full p-2 border rounded text-sm text-gray-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Quantité réelle (ml/gr)</label>
                          <input
                            type="number"
                            placeholder="0"
                            value={currentProduct.quantite_reelle || ''}
                            onChange={(e) => setCurrentProduct({quantite_reelle: parseInt(e.target.value) || 0})}
                            className="w-full p-2 border rounded text-sm text-gray-500"
                          />
                        </div>
                        <input
                          type="number"
                          placeholder="Réduction en % (ex: 10)"
                          value={currentProduct.reduction || ''}
                          onChange={(e) => setCurrentProduct({reduction: parseInt(e.target.value) || 0})}
                          className="p-2 border rounded text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Stock (nb unités) (ex: 25)"
                          value={currentProduct.stock_unite || ''}
                          onChange={(e) => setCurrentProduct({stock_unite: parseInt(e.target.value) || 0})}
                          className="p-2 border rounded text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Emplacement (ex: A1-R2)"
                          value={currentProduct.emplacement_stock || ''}
                          onChange={(e) => setCurrentProduct({emplacement_stock: e.target.value})}
                          className="p-2 border rounded text-sm"
                        />
                        <select
                          value={currentProduct.categorie}
                          onChange={(e) => setCurrentProduct({categorie: e.target.value})}
                          className="p-2 border rounded text-sm"
                        >
                          <option value="makeup">Maquillage</option>
                          <option value="skincare">Soins Visage</option>
                          <option value="bodycare">Soins Corps</option>
                          <option value="haircare">Cheveux</option>
                          <option value="fragrance">Parfums</option>
                          <option value="accessories">Accessoires</option>
                        </select>
                        
                        <div className="p-2 border rounded bg-gray-100">
                          <span className="text-sm text-gray-600">Prix réel calculé:</span>
                          <div className="font-bold text-green-600">
                            {calculateRealPrice(currentProduct).toFixed(2)}€
                          </div>
                        </div>
                      </div>

                      <textarea
                        placeholder="Description du produit"
                        value={currentProduct.description || ''}
                        onChange={(e) => setCurrentProduct({description: e.target.value})}
                        className="w-full p-2 border rounded text-sm"
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
                        className="px-4 py-2 md:px-6 md:py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm md:text-base"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => setEditingProduct(null)}
                        className="px-4 py-2 md:px-6 md:py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm md:text-base"
                      >
                        Annuler
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleAddProduct}
                        className="px-4 py-2 md:px-6 md:py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm md:text-base"
                      >
                        {addingVariant ? 'Ajouter la variante' : 'Ajouter'}
                      </button>
                      
                      {addingVariant && (
                        <button
                          onClick={() => {
                            setAddingVariant(false);
                            setVariantBaseProduct(null);
                            setNewProduct({
                              nom: '',
                              marque: '',
                              prix_reference: 0,
                              reduction: 0,
                              image_url: '',
                              categorie: 'makeup',
                              quantite_reference: 0,
                              quantite_reelle: 0,
                              stock_unite: 0,
                              emplacement_stock: '',
                              description: ''
                            });
                          }}
                          className="px-4 py-2 md:px-6 md:py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm md:text-base"
                        >
                          Annuler
                        </button>
                      )}
                    </>
                  )}
                </div>
                
                {/* Bouton de vérification des doublons */}
                {!editingProduct && !addingVariant && (
                  <button
                    type="button"
                    onClick={checkForDuplicates}
                    className="w-full py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 mt-2"
                  >
                    Vérifier les doublons
                  </button>
                )}
              </div>

              {/* Liste des produits - MODIFIÉE pour grouper les variantes */}
              <div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
                  <h3 className="text-lg font-semibold">
                    Produits actuels 
                    {selectedBrand !== 'all' && ` - ${selectedBrand}`}
                  </h3>
                  
                  {/* Filtre par marque */}
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="px-3 py-2 border rounded text-sm bg-white w-full md:w-auto"
                  >
                    <option value="all">📦 Toutes les marques ({products.length})</option>
                    {allBrands.length > 0 && <option disabled>─────────────────</option>}
                    {allBrands.map(brand => {
                      const count = products.filter(p => p.marque === brand).length;
                      return (
                        <option key={brand} value={brand}>
                          {brand} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>
                
                <div className="max-h-96 overflow-y-auto bg-white border rounded">
                  {products.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Aucun produit. Cliquez sur "Recharger" ou ajoutez-en un.
                    </div>
                  ) : (
                    (() => {
                      const filteredProducts = products.filter(p => selectedBrand === 'all' || p.marque === selectedBrand);
                      const groupedProducts = filteredProducts.reduce((acc, product) => {
                        const key = product.variant_id || `product-${product.id}`;
                        if (!acc[key]) acc[key] = [];
                        acc[key].push(product);
                        return acc;
                      }, {} as Record<string, Product[]>);
                      
                      if (Object.keys(groupedProducts).length === 0) {
                        return (
                          <div className="p-4 text-center text-gray-500">
                            Aucun produit pour la marque "{selectedBrand}"
                          </div>
                        );
                      }
                      
                      return Object.entries(groupedProducts).map(([variantId, variants]) => (
                        <div key={variantId} className="border-b hover:bg-gray-50">
                          {/* En-tête du groupe de variantes */}
                          <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-3 bg-gray-100">
                            <div className="flex items-center space-x-3 flex-1">
                              <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                {variants[0].image_url ? (
                                  <img 
                                    src={variants[0].image_url} 
                                    alt={variants[0].nom}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                    📷
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex-1">
                                <div className="font-medium text-sm md:text-base">{variants[0].nom}</div>
                                <div className="text-xs md:text-sm text-gray-600">
                                  {variants[0].marque} • {variants.length} variante{variants.length > 1 ? 's' : ''}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex gap-2 self-end md:self-auto mt-2 md:mt-0">
                              <button
                                onClick={() => handleAddVariant(variants[0])}
                                className="px-2 py-1 md:px-3 md:py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                                title="Ajouter une variante"
                              >
                                ➕ Variante
                              </button>
                            </div>
                          </div>
                          
                          {/* Liste des variantes */}
                          {variants.map((product) => (
                            <div key={product.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-3 pl-8 border-t hover:bg-gray-50 gap-2">
                              <div className="flex items-center space-x-3 flex-1">
                                <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                  {product.image_url ? (
                                    <img 
                                      src={product.image_url} 
                                      alt={product.nom}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                      📷
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex-1">
                                  <div className="font-medium text-sm md:text-base">
                                    {product.quantite_reelle}ml/gr
                                  </div>
                                  <div className="text-xs md:text-sm text-gray-600">
                                    Prix: {calculateRealPrice(product).toFixed(2)}€ • Stock: {product.stock_unite ?? 0} • {product.emplacement_stock}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2 self-end md:self-auto">
                                <button
                                  onClick={() => setEditingProduct(product)}
                                  className="px-2 py-1 md:px-3 md:py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
                                  title="Modifier cette variante"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="px-2 py-1 md:px-3 md:py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                                  title="Supprimer cette variante"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ));
                    })()
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

            {/* Liste des commandes */}
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
                      <div className="flex flex-col md:flex-row justify-between items-start mb-3 gap-2">
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