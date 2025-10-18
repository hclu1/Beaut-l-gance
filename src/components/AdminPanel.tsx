import React, { useState } from 'react';
import { Product, Order } from '../types';
import { ProductService } from '../services/productService';

interface AdminPanelProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  onReloadProducts?: () => void;
  setAdmin: React.Dispatch<React.SetStateAction<boolean>>;
}
const AdminPanel: React.FC<AdminPanelProps> = ({ 
  products = [], 
  setProducts, 
  orders = [], 
  setOrders,
  onReloadProducts,
  setAdmin
}) => {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [showQR, setShowQR] = useState(false);
  
  // États pour la gestion des variantes
  const [addingVariant, setAddingVariant] = useState<boolean>(false);
  const [variantBaseProduct, setVariantBaseProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);

  // États pour le filtre de marque/emplacement combiné
  const [selectedBrandOrEmplacement, setSelectedBrandOrEmplacement] = useState<string>('all');

  const allBrands = Array.from(new Set(products.map(p => p.marque))).sort();
  const allEmplacements = Array.from(new Set(products.map(p => p.emplacement_stock).filter(e => e))).sort();

  const [newProduct, setNewProduct] = useState({
    nom: '',
    marque: '',
    prix_reference: 0,
    reduction: 0,
    image_url: '',
    categorie: 'makeup' as const,
    quantite_reference: 100,
    quantite_reelle: 100,
    stock_unite: 0,
    emplacement_stock: '',
    description: ''
  });

  const currentProduct = editingProduct || newProduct;

  // 🖼️ Fonction de compression d'image
  const compressImage = (file: File, maxWidth: number, quality: number): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Impossible de créer le contexte canvas'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Erreur lors de la compression'));
                return;
              }
              
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^.]+$/, '.webp'),
                { type: 'image/webp' }
              );
              
              resolve(compressedFile);
            },
            'image/webp',
            quality
          );
        };
        
        img.onerror = () => reject(new Error('Erreur lors du chargement de l\'image'));
        img.src = e.target?.result as string;
      };
      
      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
      reader.readAsDataURL(file);
    });
  };

  // Upload d'image avec compression
  const handleImageUpload = async (file: File, isEditing = false) => {
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('Veuillez sélectionner un fichier image');
    return;
  }

  try {
    setUploadingImage(true);
    console.log(`📤 Fichier original: ${file.name} - ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    
    const compressedFile = await compressImage(file, 800, 0.8);
    console.log(`✅ Fichier compressé: ${compressedFile.name} - ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
    
    const imageUrl = await ProductService.uploadImage(compressedFile);
    console.log(`🎯 URL récupérée:`, imageUrl);
    
    // 🚀 CRITIQUE : Mettre à jour le preview immédiatement
    setPreviewImageUrl(imageUrl);
    
    if (isEditing && editingProduct) {
      console.log('📝 Mode édition - Mise à jour editingProduct');
      setEditingProduct({...editingProduct, image_url: imageUrl});
    } else {
      console.log('➕ Mode ajout - Mise à jour newProduct');
      setNewProduct(prev => ({...prev, image_url: imageUrl}));
    }

    alert(`✅ Image uploadée avec succès !`);
  } catch (error) {
    console.error('❌ Erreur:', error);
    alert('Erreur lors de l\'upload de l\'image');
  } finally {
    setUploadingImage(false);
  }
};

  // Vérifier les doublons
  const checkForDuplicates = async () => {
    if (!newProduct.nom || !newProduct.marque) {
      alert('Veuillez entrer un nom et une marque pour vérifier les doublons');
      return;
    }

    const searchTerm = `${newProduct.nom.toLowerCase()} ${newProduct.marque.toLowerCase()}`;
    const duplicates = products.filter(p => {
      const productTerm = `${p.nom.toLowerCase()} ${p.marque.toLowerCase()}`;
      return productTerm.includes(searchTerm) || searchTerm.includes(productTerm);
    });

    if (duplicates.length > 0) {
      const message = `⚠️ ${duplicates.length} produit(s) similaire(s) trouvé(s) :\n\n` +
        duplicates.map(p => 
          `• ${p.nom} (${p.marque}) - ${p.quantite_reelle}ml - ${p.emplacement_stock || 'Sans emplacement'}`
        ).join('\n') +
        '\n\nVoulez-vous quand même ajouter ce produit ?';
      
      return confirm(message);
    } else {
      alert('✅ Aucun doublon trouvé !');
      return true;
    }
  };

const handleAddProduct = async () => {
  if (!newProduct.nom || !newProduct.marque) {
    alert('Nom et marque requis');
    return;
  }

  const duplicatesConfirmed = await checkForDuplicates();
  if (!duplicatesConfirmed) return;

  try {
    const productToAdd = {
      ...newProduct,
      image_url: previewImageUrl || newProduct.image_url, // 🚀 UTILISER previewImageUrl en priorité
      id: Date.now().toString()
    };

    await ProductService.addProduct(productToAdd);
    console.log('Produit ajouté dans Supabase');

    if (onReloadProducts) {
      await onReloadProducts();
    }

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
    
    setPreviewImageUrl(''); // 🚀 Réinitialiser le preview

    alert('Produit ajouté avec succès !');
  } catch (error) {
    console.error('Erreur ajout produit:', error);
    alert('Erreur lors de l\'ajout du produit dans Supabase');
  }
};


  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    try {
      await ProductService.updateProduct(editingProduct);
      console.log('Produit mis à jour dans Supabase');

      if (onReloadProducts) {
        await onReloadProducts();
      }

      setEditingProduct(null);
      setPreviewImageUrl(''); // ✅ Réinitialiser le preview
      alert('Produit mis à jour avec succès !');
    } catch (error) {
      console.error('Erreur mise à jour produit:', error);
      alert('Erreur lors de la mise à jour du produit dans Supabase');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return;

    try {
      await ProductService.deleteProduct(id);
      console.log('Produit supprimé de Supabase');

      if (onReloadProducts) {
        await onReloadProducts();
      }

      alert('Produit supprimé avec succès !');
    } catch (error) {
      console.error('Erreur suppression produit:', error);
      alert('Erreur lors de la suppression du produit de Supabase');
    }
  };

  const handleOrderStatusChange = async (orderId: string, newStatus: string) => {
    const updatedOrders = orders.map(o =>
      o.id === orderId ? { ...o, status: newStatus } : o
    );
    setOrders(updatedOrders);

    try {
      await ProductService.updateOrderStatus(orderId, newStatus);
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Supprimer cette commande ?')) return;

    try {
      await ProductService.deleteOrder(orderId);
      setOrders(orders.filter(o => o.id !== orderId));
      alert('Commande supprimée avec succès !');
    } catch (error) {
      console.error('Erreur suppression commande:', error);
      alert('Erreur lors de la suppression de la commande');
    }
  };

  const togglePreparedItem = async (orderId: string, productId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const newPreparedItems = { ...order.preparedItems };
    newPreparedItems[productId] = !newPreparedItems[productId];

    const updatedOrders = orders.map(o =>
      o.id === orderId ? { ...o, preparedItems: newPreparedItems } : o
    );

    setOrders(updatedOrders);

    try {
      await ProductService.updateOrderPreparedItems(orderId, newPreparedItems);
    } catch (error) {
      console.error('Erreur mise à jour items préparés:', error);
    }
  };

  const allItemsPrepared = (order: Order) => {
    return order.items.every(item => order.preparedItems?.[item.id] === true);
  };

  const handleFindSimilarProducts = (product: Product) => {
    const similar = products.filter(p => 
      p.id !== product.id &&
      p.nom.toLowerCase() === product.nom.toLowerCase() &&
      p.marque.toLowerCase() === product.marque.toLowerCase()
    );

    if (similar.length === 0) {
      alert('Aucun produit similaire trouvé pour créer une variante');
      return;
    }

    setVariantBaseProduct(product);
    setSimilarProducts(similar);
    setAddingVariant(true);
  };

  const handleCreateVariantGroup = async (selectedProducts: Product[]) => {
    if (selectedProducts.length < 2) {
      alert('Sélectionnez au moins 2 produits pour créer un groupe de variantes');
      return;
    }

    const variantId = `variant_${Date.now()}`;

    try {
      for (const product of selectedProducts) {
        await ProductService.updateProduct({
          ...product,
          variant_id: variantId
        });
      }

      if (onReloadProducts) {
        await onReloadProducts();
      }

      setAddingVariant(false);
      setVariantBaseProduct(null);
      setSimilarProducts([]);

      alert(`✅ Groupe de variantes créé avec succès ! (${selectedProducts.length} produits liés)`);
    } catch (error) {
      console.error('Erreur création groupe variantes:', error);
      alert('Erreur lors de la création du groupe de variantes');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 md:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-3 md:p-4 flex justify-between items-center z-10">
          <h2 className="text-lg md:text-2xl font-bold text-purple-800">Admin Panel</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowQR(!showQR)}
              className="px-3 py-2 md:px-4 md:py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm md:text-base"
            >
              📲 Partager DB
            </button>
            <button
              onClick={() => setAdmin(false)}
              className="px-3 py-2 md:px-4 md:py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm md:text-base"
            >
              Fermer
            </button>
          </div>
        </div>

        {showQR && (
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-bold mb-2 text-sm md:text-base">QR Code de synchronisation (Multi-devices)</h3>
            <p className="text-xs md:text-sm text-gray-600 mb-2">
              Scannez ce QR code avec un autre appareil pour synchroniser produits et commandes.
            </p>
            <div className="bg-white p-4 inline-block rounded border">
              <div className="w-32 h-32 md:w-48 md:h-48 bg-gray-200 flex items-center justify-center">
                QR Code
              </div>
            </div>
          </div>
        )}

        <div className="flex border-b sticky top-[60px] md:top-[72px] bg-white z-10">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 px-3 py-2 md:px-4 md:py-3 font-semibold text-sm md:text-base ${
              activeTab === 'products'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            📦 Produits ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 px-3 py-2 md:px-4 md:py-3 font-semibold text-sm md:text-base ${
              activeTab === 'orders'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            🛒 Commandes ({orders.length})
          </button>
        </div>

        <div className="p-3 md:p-6">
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="bg-purple-50 p-3 md:p-4 rounded border border-purple-200 mb-4">
                <h3 className="font-bold mb-3 text-purple-800 text-sm md:text-base">
                  {editingProduct ? '✏️ Modifier un produit' : '➕ Ajouter un produit'}
                </h3>

                <div className="space-y-4">
                  {/* Section image avec logique simplifiée */}
            <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Image du produit 
    <span className="text-xs text-green-600 ml-2">✨ Optimisation automatique WebP</span>
  </label>
  
  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
    {(() => {
      // 🔍 DEBUG
      console.log('🖼️ États image:', {
        previewImageUrl,
        editingImage: editingProduct?.image_url,
        newProductImage: newProduct.image_url
      });
      
      const imageToShow = previewImageUrl || editingProduct?.image_url || newProduct.image_url;
      
      return imageToShow ? (
        <div className="space-y-2">
          <img 
            src={imageToShow} 
            alt="Aperçu" 
            className="w-32 h-32 object-cover rounded border mx-auto"
            onLoad={() => console.log('✅ Image chargée:', imageToShow)}
            onError={(e) => console.error('❌ Erreur image:', imageToShow)}
          />
          <button
            type="button"
            onClick={() => {
              setPreviewImageUrl('');
              if (editingProduct) {
                setEditingProduct({...editingProduct, image_url: ''});
              } else {
                setNewProduct({...newProduct, image_url: ''});
              }
            }}
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
      );
    })()}
    
    <input
      type="file"
      accept="image/*"
      onChange={async (e) => {
        const file = e.target.files?.[0];
        if (file) {
          await handleImageUpload(file, !!editingProduct);
          e.target.value = '';
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

                  {/* Champs du formulaire */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nom</label>
                      <input
                        type="text"
                        placeholder="Nom du produit"
                        value={currentProduct.nom}
                        onChange={(e) => {
                          if (editingProduct) {
                            setEditingProduct({...editingProduct, nom: e.target.value});
                          } else {
                            setNewProduct({...newProduct, nom: e.target.value});
                          }
                        }}
                        className="w-full p-2 border rounded text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Marque</label>
                      <input
                        type="text"
                        placeholder="Marque"
                        value={currentProduct.marque}
                        onChange={(e) => {
                          if (editingProduct) {
                            setEditingProduct({...editingProduct, marque: e.target.value});
                          } else {
                            setNewProduct({...newProduct, marque: e.target.value});
                          }
                        }}
                        className="w-full p-2 border rounded text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Prix référence (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Prix"
                        value={currentProduct.prix_reference}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          if (editingProduct) {
                            setEditingProduct({...editingProduct, prix_reference: value});
                          } else {
                            setNewProduct({...newProduct, prix_reference: value});
                          }
                        }}
                        className="w-full p-2 border rounded text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Réduction (%)</label>
                      <input
                        type="number"
                        placeholder="Réduction"
                        value={currentProduct.reduction || 0}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          if (editingProduct) {
                            setEditingProduct({...editingProduct, reduction: value});
                          } else {
                            setNewProduct({...newProduct, reduction: value});
                          }
                        }}
                        className="w-full p-2 border rounded text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Catégorie</label>
                      <select
                        value={currentProduct.categorie}
                        onChange={(e) => {
                          if (editingProduct) {
                            setEditingProduct({...editingProduct, categorie: e.target.value as any});
                          } else {
                            setNewProduct({...newProduct, categorie: e.target.value as any});
                          }
                        }}
                        className="w-full p-2 border rounded text-sm"
                      >
                        <option value="makeup">Maquillage</option>
                        <option value="skincare">Soins Visage</option>
                        <option value="bodycare">Soins Corps</option>
                        <option value="haircare">Cheveux</option>
                        <option value="fragrance">Parfums</option>
                        <option value="accessories">Accessoires</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Quantité référence (ml)</label>
                      <input
                        type="number"
                        placeholder="Qté ref"
                        value={currentProduct.quantite_reference}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          if (editingProduct) {
                            setEditingProduct({...editingProduct, quantite_reference: value});
                          } else {
                            setNewProduct({...newProduct, quantite_reference: value});
                          }
                        }}
                        className="w-full p-2 border rounded text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Quantité réelle (ml)</label>
                      <input
                        type="number"
                        placeholder="Qté réelle"
                        value={currentProduct.quantite_reelle}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          if (editingProduct) {
                            setEditingProduct({...editingProduct, quantite_reelle: value});
                          } else {
                            setNewProduct({...newProduct, quantite_reelle: value});
                          }
                        }}
                        className="w-full p-2 border rounded text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Stock (unités)</label>
                      <input
                        type="number"
                        placeholder="Stock"
                        value={currentProduct.stock_unite}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          if (editingProduct) {
                            setEditingProduct({...editingProduct, stock_unite: value});
                          } else {
                            setNewProduct({...newProduct, stock_unite: value});
                          }
                        }}
                        className="w-full p-2 border rounded text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Emplacement stock</label>
                      <input
                        type="text"
                        placeholder="Ex: Étagère A"
                        value={currentProduct.emplacement_stock || ''}
                        onChange={(e) => {
                          if (editingProduct) {
                            setEditingProduct({...editingProduct, emplacement_stock: e.target.value});
                          } else {
                            setNewProduct({...newProduct, emplacement_stock: e.target.value});
                          }
                        }}
                        className="w-full p-2 border rounded text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      placeholder="Description du produit"
                      value={currentProduct.description || ''}
                      onChange={(e) => {
                        if (editingProduct) {
                          setEditingProduct({...editingProduct, description: e.target.value});
                        } else {
                          setNewProduct({...newProduct, description: e.target.value});
                        }
                      }}
                      className="w-full p-2 border rounded text-sm"
                      rows={2}
                    />
                  </div>
                </div>

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
                        onClick={() => {
                          setEditingProduct(null);
                          setPreviewImageUrl(''); // ✅ Réinitialiser le preview
                        }}
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
                        Ajouter
                      </button>
                      <button
                        onClick={checkForDuplicates}
                        className="px-4 py-2 md:px-6 md:py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm md:text-base"
                      >
                        🔍 Vérifier doublons
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                <select
                  value={selectedBrandOrEmplacement}
                  onChange={(e) => setSelectedBrandOrEmplacement(e.target.value)}
                  className="px-3 py-2 border rounded text-sm"
                >
                  <option value="all">Tous les produits</option>
                  <optgroup label="Par marque">
                    {allBrands.map(brand => (
                      <option key={brand} value={`brand:${brand}`}>📦 {brand}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Par emplacement">
                    {allEmplacements.map(emp => (
                      <option key={emp} value={`emp:${emp}`}>📍 {emp}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {products
                  .filter(p => {
                    if (selectedBrandOrEmplacement === 'all') return true;
                    if (selectedBrandOrEmplacement.startsWith('brand:')) {
                      return p.marque === selectedBrandOrEmplacement.replace('brand:', '');
                    }
                    if (selectedBrandOrEmplacement.startsWith('emp:')) {
                      return p.emplacement_stock === selectedBrandOrEmplacement.replace('emp:', '');
                    }
                    return true;
                  })
                  .map(product => (
                    <div key={product.id} className="flex items-center justify-between bg-gray-50 p-2 md:p-3 rounded border text-xs md:text-sm">
                      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                        {product.image_url && (
                          <img src={product.image_url} alt={product.nom} className="w-10 h-10 md:w-12 md:h-12 object-cover rounded" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{product.nom}</p>
                          <p className="text-gray-600 truncate">{product.marque} - {product.quantite_reelle}ml</p>
                          <p className="text-gray-500 truncate">
                            Stock: {product.stock_unite} | {product.emplacement_stock || 'Sans emplacement'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 md:gap-2 flex-shrink-0">
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            setPreviewImageUrl(''); // ✅ Réinitialiser le preview quand on passe en édition
                          }}
                          className="px-2 py-1 md:px-3 md:py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="px-2 py-1 md:px-3 md:py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                        >
                          🗑️
                        </button>
                        <button
                          onClick={() => handleFindSimilarProducts(product)}
                          className="px-2 py-1 md:px-3 md:py-1 bg-purple-500 text-white rounded hover:bg-purple-600 text-xs"
                        >
                          🔗
                        </button>
                      </div>
                    </div>
                  ))}
              </div>

              {addingVariant && variantBaseProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                    <h3 className="text-xl font-bold mb-4">
                      Créer un groupe de variantes pour "{variantBaseProduct.nom}"
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Sélectionnez les produits à regrouper comme variantes :
                    </p>
                    
                    <div className="space-y-2 mb-4">
                      {[variantBaseProduct, ...similarProducts].map(product => (
                        <label key={product.id} className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            defaultChecked={product.id === variantBaseProduct.id}
                            className="w-4 h-4"
                          />
                          <div className="flex-1">
                            <p className="font-semibold">{product.nom} ({product.marque})</p>
                            <p className="text-sm text-gray-600">
                              {product.quantite_reelle}ml - Stock: {product.stock_unite} - {product.emplacement_stock}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const selected = [variantBaseProduct, ...similarProducts].filter((_, index) => {
                            const checkbox = document.querySelectorAll('input[type="checkbox"]')[index] as HTMLInputElement;
                            return checkbox?.checked;
                          });
                          handleCreateVariantGroup(selected);
                        }}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Créer le groupe
                      </button>
                      <button
                        onClick={() => {
                          setAddingVariant(false);
                          setVariantBaseProduct(null);
                          setSimilarProducts([]);
                        }}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h3 className="font-bold text-purple-800 text-sm md:text-base">
                📋 Liste des commandes ({orders.length})
              </h3>
              
              {orders.length === 0 ? (
                <p className="text-gray-500 text-center py-8 text-sm">Aucune commande pour le moment</p>
              ) : (
                orders.map(order => (
                  <div key={order.id} className="border rounded p-3 md:p-4 bg-white">
                    <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm md:text-base">
                          Commande #{order.id}
                        </h4>
                        <p className="text-xs md:text-sm text-gray-600">{order.date}</p>
                        <p className="text-xs md:text-sm text-gray-600">
                          Client: {order.customerInfo?.prenom} {order.customerInfo?.nom}
                        </p>
                        {order.customerInfo?.email && (
                          <p className="text-xs text-gray-500">📧 {order.customerInfo.email}</p>
                        )}
                        {order.customerInfo?.telephone && (
                          <p className="text-xs text-gray-500">📞 {order.customerInfo.telephone}</p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <select
                          value={order.status}
                          onChange={(e) => handleOrderStatusChange(order.id, e.target.value)}
                          className={`px-2 py-1 md:px-3 md:py-1 rounded text-xs md:text-sm font-semibold ${
                            order.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : order.status === 'processing'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <option value="pending">En attente</option>
                          <option value="processing">En préparation</option>
                          <option value="completed">Terminée</option>
                        </select>
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="px-2 py-1 md:px-3 md:py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="font-semibold text-xs md:text-sm">Articles ({order.items.length}):</p>
                      {order.items.map((item, index) => {
                        const isPrepared = order.preparedItems?.[item.id] === true;
                        return (
                          <div
                            key={index}
                            className={`flex items-center justify-between p-2 rounded border text-xs md:text-sm ${
                              isPrepared ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <input
                                type="checkbox"
                                checked={isPrepared}
                                onChange={() => togglePreparedItem(order.id, item.id)}
                                className="w-4 h-4 flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className={`truncate ${isPrepared ? 'line-through text-gray-500' : ''}`}>
                                  {item.nom} ({item.marque})
                                </p>
                                <p className="text-gray-600 text-xs">
                                  {item.quantite_reelle}ml × {item.quantite_achat || 1} | {item.emplacement_stock || 'Sans emplacement'}
                                </p>
                              </div>
                            </div>
                            <p className="font-semibold flex-shrink-0 ml-2">
                              {((item.prix_reference / (item.quantite_reference || 1)) * 
                                (item.quantite_reelle || item.quantite_reference) * 
                                (1 - (item.reduction || 0) / 100) * 
                                (item.quantite_achat || 1)).toFixed(2)}€
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-3 pt-3 border-t flex justify-between items-center">
                      <div className="text-xs md:text-sm">
                        {allItemsPrepared(order) && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-semibold">
                            ✅ Tous les articles préparés
                          </span>
                        )}
                      </div>
                      <p className="text-base md:text-lg font-bold text-purple-600">
                        Total: {order.total.toFixed(2)}€
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;