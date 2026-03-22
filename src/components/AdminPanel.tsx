import React, { useState, useEffect } from 'react';
import { Product, Order } from '../types';
import { ProductService } from '../services/productService';
import { QRCodeSVG } from 'qrcode.react';

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
  // États
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [showQR, setShowQR] = useState(false);
  const [formCollapsed, setFormCollapsed] = useState(false);

  const [addingVariant, setAddingVariant] = useState<boolean>(false);
  const [variantBaseProduct, setVariantBaseProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);

  const [selectedBrandOrEmplacement, setSelectedBrandOrEmplacement] = useState<string>('all');

  const [isAddingNewBrand, setIsAddingNewBrand] = useState(false);
  const [newBrandInput, setNewBrandInput] = useState('');

  // État pour l'URL
  const [syncUrl, setSyncUrl] = useState<string>('');

  const allBrands = Array.from(new Set(products.map(p => p.marque))).sort();
  const allEmplacements = Array.from(new Set(products.map(p => p.emplacement_stock).filter(e => e))).sort();

  const [newProduct, setNewProduct] = useState({
    nom: '',
    marque: '',
    prix_reference: 0,
    image_url: '',
    categorie: 'makeup' as const,
    quantite_reference: 0,
    quantite_reelle: 0,
    stock_unite: 0,
    emplacement_stock: '',
    reduction: 50,
    description: ''
  });

  // Initialisation de l'URL
  useEffect(() => {
    // Sur Vercel ou en ligne, window.location.href est la bonne adresse publique
    setSyncUrl(window.location.href);
  }, []);

  useEffect(() => {
    if (!editingProduct) {
      setNewProduct({
        nom: '', marque: '', prix_reference: 0,
        image_url: '', categorie: 'makeup', quantite_reference: 0,
        quantite_reelle: 0, stock_unite: 0, emplacement_stock: '', reduction: 50, description: ''
      });
      setPreviewImageUrl('');
      setIsAddingNewBrand(false);
    }
  }, [editingProduct]);

  const calculateRealPrice = (prixReference: number, quantiteReference: number, quantiteReelle: number, reduction: number): number => {
    if (!quantiteReference || quantiteReference === 0) return 0;
    const prixParMl = prixReference / quantiteReference;
    const prixBrut = prixParMl * quantiteReelle;
    const prixFinal = prixBrut * (1 - reduction / 100);
    return parseFloat(prixFinal.toFixed(2));
  };

  const compressImage = (file: File, maxWidth: number, quality: number): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          if (img.width <= maxWidth) { resolve(file); return; }
          const canvas = document.createElement('canvas');
          const scale = maxWidth / img.width;
          canvas.width = maxWidth;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          if (!ctx) { reject(new Error('Canvas error')); return; }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (!blob) { reject(new Error('Compression error')); return; }
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }));
          }, 'image/webp', quality);
        };
        img.onerror = () => reject(new Error('Image load error'));
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (file: File, isEditing = false) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Image requise'); return; }
    try {
      setUploadingImage(true);
      const compressedFile = await compressImage(file, 800, 0.8);
      const imageUrl = await ProductService.uploadImage(compressedFile);
      setPreviewImageUrl(imageUrl);
      if (isEditing && editingProduct) { setEditingProduct({ ...editingProduct, image_url: imageUrl }); }
      else { setNewProduct(prev => ({ ...prev, image_url: imageUrl })); }
      alert('Image uploadée !');
    } catch (error) { console.error(error); alert('Erreur upload'); }
    finally { setUploadingImage(false); }
  };

  const checkForDuplicates = async (): Promise<boolean> => {
    if (!newProduct.nom || !newProduct.marque) { alert('Nom et marque requis'); return false; }
    const searchTerm = `${newProduct.nom.toLowerCase()} ${newProduct.marque.toLowerCase()}`;
    const duplicates = products.filter(p => {
      const pt = `${p.nom.toLowerCase()} ${p.marque.toLowerCase()}`;
      return pt.includes(searchTerm) || searchTerm.includes(pt);
    });
    if (duplicates.length > 0) {
      return confirm(`${duplicates.length} doublons trouvés. Continuer ?`);
    }
    return true;
  };

  const handleAddProduct = async () => {
    if (!newProduct.nom || !newProduct.marque) { alert('Nom et marque requis'); return; }
    if (newProduct.quantite_reference <= 0 || newProduct.quantite_reelle <= 0) { alert('Quantités invalides'); return; }
    if (newProduct.stock_unite < 0) { alert('Stock invalide'); return; }
    if (!(await checkForDuplicates())) return;
    try {
      const productToAdd = { ...newProduct, image_url: previewImageUrl || newProduct.image_url, id: Date.now().toString() };
      await ProductService.addProduct(productToAdd);
      if (onReloadProducts) await onReloadProducts();
      setNewProduct({ nom: '', marque: '', prix_reference: 0, image_url: '', categorie: 'makeup', quantite_reference: 0, quantite_reelle: 0, stock_unite: 0, emplacement_stock: '', reduction: 50, description: '' });
      setPreviewImageUrl('');
      setIsAddingNewBrand(false);
      setNewBrandInput('');
      alert('Produit ajouté !');
    } catch (e) { console.error(e); alert('Erreur ajout'); }
  };

  const handleAnnulerAjout = () => {
    setNewProduct({ nom: '', marque: '', prix_reference: 0, image_url: '', categorie: 'makeup', quantite_reference: 0, quantite_reelle: 0, stock_unite: 0, emplacement_stock: '', reduction: 50, description: '' });
    setPreviewImageUrl('');
    setIsAddingNewBrand(false);
    setNewBrandInput('');
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    try {
      const updates = {
        nom: editingProduct.nom, marque: editingProduct.marque, prix_reference: editingProduct.prix_reference,
        reduction: editingProduct.reduction, image_url: previewImageUrl || editingProduct.image_url,
        categorie: editingProduct.categorie, quantite_reference: editingProduct.quantite_reference,
        quantite_reelle: editingProduct.quantite_reelle, stock_unite: editingProduct.stock_unite,
        emplacement_stock: editingProduct.emplacement_stock, description: editingProduct.description
      };
      await ProductService.updateProduct(editingProduct.id, updates);
      if (onReloadProducts) await onReloadProducts();
      setEditingProduct(null);
      setPreviewImageUrl('');
      alert('Modifié !');
    } catch (e) { console.error(e); alert('Erreur modif'); }
  };

  const handleDeleteProduct = async (id: string | number) => {
    if (!confirm('Supprimer ?')) return;
    try { await ProductService.deleteProduct(id); if (onReloadProducts) await onReloadProducts(); alert('Supprimé'); }
    catch (e) { console.error(e); alert('Erreur suppression'); }
  };

  const handleOrderStatusChange = async (orderId: string, newStatus: string) => {
    const updatedOrders = orders.map(o => o.id === orderId ? { ...o, status: newStatus as Order['status'] } : o);
    setOrders(updatedOrders);
    try { await ProductService.updateOrderStatus(orderId, newStatus); } catch (e) { console.error(e); }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Supprimer commande ?')) return;
    try { await ProductService.deleteOrder(orderId); setOrders(orders.filter(o => o.id !== orderId)); } catch (e) { console.error(e); }
  };

  const togglePreparedItem = async (orderId: string, productId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const newPreparedItems = { ...order.preparedItems };
    newPreparedItems[productId] = !newPreparedItems[productId];
    const updatedOrders = orders.map(o => o.id === orderId ? { ...o, preparedItems: newPreparedItems } : o);
    setOrders(updatedOrders);
    try { await ProductService.updateOrderPreparedItems(orderId, newPreparedItems); } catch (e) { console.error(e); }
  };

  const allItemsPrepared = (order: Order) => (order.items ?? []).every(item => order.preparedItems?.[String(item.id)] === true);

  const handleDuplicateProduct = (product: Product) => {
    setNewProduct({
      nom: product.nom, marque: product.marque, prix_reference: product.prix_reference, image_url: product.image_url,
      categorie: product.categorie, quantite_reference: product.quantite_reference, quantite_reelle: product.quantite_reelle,
      stock_unite: product.stock_unite, emplacement_stock: product.emplacement_stock || '', reduction: product.reduction, description: product.description || ''
    });
    setPreviewImageUrl(product.image_url || '');
    setFormCollapsed(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFindSimilarProducts = (product: Product) => {
    const similar = products.filter(p => p.id !== product.id && p.nom.toLowerCase() === product.nom.toLowerCase() && p.marque.toLowerCase() === product.marque.toLowerCase());
    if (similar.length === 0) { alert('Aucun similaire'); return; }
    setVariantBaseProduct(product); setSimilarProducts(similar); setAddingVariant(true);
  };

  const handleCreateVariantGroup = async (selectedProducts: Product[]) => {
    if (selectedProducts.length < 2) return;
    const variantId = `variant_${Date.now()}`;
    try {
      for (const p of selectedProducts) { await ProductService.updateProduct(p.id, { ...p, variant_id: variantId }); }
      if (onReloadProducts) await onReloadProducts();
      setAddingVariant(false); setVariantBaseProduct(null); setSimilarProducts([]);
      alert('Groupe créé !');
    } catch (e) { console.error(e); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-start justify-center z-50 p-2 md:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-6xl my-2 md:my-4">
        <div className="sticky top-0 bg-white border-b p-3 md:p-4 flex justify-between items-center z-10">
          <h2 className="text-lg md:text-2xl font-bold text-purple-800">Admin Panel</h2>
          <div className="flex gap-2">
            <button onClick={() => setShowQR(!showQR)} className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">📲 Partager DB</button>
            <button onClick={() => setAdmin(false)} className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600">Fermer</button>
          </div>
        </div>

        {/* SECTION QR CODE (SIMPLIFIÉ POUR VERCEL) */}
        {showQR && (
          <div className="p-4 border-b bg-gray-50 text-center">
            <h3 className="font-bold mb-2">QR Code d'accès</h3>
            <p className="text-sm text-gray-600 mb-4">
              Scannez ce code pour ouvrir l'application sur un autre appareil.
            </p>

            <div className="flex flex-col items-center justify-center gap-4">
              {syncUrl && (
                <div className="bg-white p-4 rounded border shadow-sm">
                  <QRCodeSVG value={syncUrl} size={180} level={"M"} includeMargin={true} />
                </div>
              )}

              <div className="w-full max-w-md">
                <input
                  type="text"
                  value={syncUrl}
                  readOnly
                  className="w-full p-2 border rounded text-xs text-gray-600 font-mono bg-gray-100 text-center"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex border-b sticky top-[60px] md:top-[72px] bg-white z-10">
          <button onClick={() => setActiveTab('products')} className={`flex-1 px-3 py-2 font-semibold ${activeTab === 'products' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
            📦 Produits ({products.length})
          </button>
          <button onClick={() => setActiveTab('orders')} className={`flex-1 px-3 py-2 font-semibold ${activeTab === 'orders' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
            🛒 Commandes ({orders.length})
          </button>
        </div>

        <div className="p-3 md:p-6">
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="bg-purple-50 p-3 md:p-4 rounded border border-purple-200 mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-purple-800">{editingProduct ? '✏️ Modifier' : '➕ Ajouter'}</h3>
                  <button onClick={() => setFormCollapsed(!formCollapsed)} className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs">{formCollapsed ? '▼ Développer' : '▲ Réduire'}</button>
                </div>
                {!formCollapsed && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        {(() => {
                          const img = previewImageUrl || editingProduct?.image_url || newProduct.image_url;
                          return img ? (
                            <div className="space-y-2"><img src={img} className="w-32 h-32 object-cover rounded border mx-auto" /><button onClick={() => { setPreviewImageUrl(''); if (editingProduct) setEditingProduct({ ...editingProduct, image_url: '' }); else setNewProduct({ ...newProduct, image_url: '' }); }} className="text-red-500 text-sm">Supprimer</button></div>
                          ) : (
                            <div className="text-gray-400 text-4xl">📸</div>
                          );
                        })()}
                        <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { await handleImageUpload(f, !!editingProduct); e.target.value = ''; } }} className="mt-2 block w-full text-sm" disabled={uploadingImage} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium text-gray-700">Nom</label><input type="text" value={editingProduct?.nom ?? newProduct.nom} onChange={e => { if (editingProduct) setEditingProduct({ ...editingProduct, nom: e.target.value }); else setNewProduct({ ...newProduct, nom: e.target.value }); }} className="w-full p-2 border rounded text-sm" /></div>
                      <div><label className="block text-sm font-medium text-gray-700">Marque</label>
                        {!isAddingNewBrand ? (
                          <select value={editingProduct?.marque ?? newProduct.marque} onChange={e => { const v = e.target.value; if (v === '__custom__') { setIsAddingNewBrand(true); setNewBrandInput(''); } else { setIsAddingNewBrand(false); if (editingProduct) setEditingProduct({ ...editingProduct, marque: v }); else setNewProduct({ ...newProduct, marque: v }); } }} className="w-full p-2 border rounded text-sm">
                            <option value="">-- Sélectionner --</option>
                            {allBrands.map(b => <option key={b} value={b}>{b}</option>)}
                            <option value="__custom__">+ Nouvelle</option>
                          </select>
                        ) : (
                          <div className="flex gap-2"><input value={newBrandInput} onChange={e => setNewBrandInput(e.target.value)} className="flex-1 p-2 border rounded text-sm border-green-500" /><button onClick={() => { if (newBrandInput.trim()) { if (editingProduct) setEditingProduct({ ...editingProduct, marque: newBrandInput.trim() }); else setNewProduct({ ...newProduct, marque: newBrandInput.trim() }); } setIsAddingNewBrand(false); setNewBrandInput(''); }} className="bg-green-500 text-white px-2 rounded">✓</button></div>
                        )}
                      </div>
                      <div><label className="block text-sm font-medium text-gray-700">Prix Ref (€)</label><input type="number" step="0.01" value={editingProduct?.prix_reference ?? newProduct.prix_reference} onChange={e => { const v = parseFloat(e.target.value); if (editingProduct) setEditingProduct({ ...editingProduct, prix_reference: isNaN(v) ? 0 : v }); else setNewProduct({ ...newProduct, prix_reference: isNaN(v) ? 0 : v }); }} className="w-full p-2 border rounded text-sm" /></div>
                      <div><label className="block text-sm font-medium text-gray-700">Qté Ref (ml)</label><input type="number" value={editingProduct?.quantite_reference ?? newProduct.quantite_reference} onChange={e => { const v = parseFloat(e.target.value); if (editingProduct) setEditingProduct({ ...editingProduct, quantite_reference: isNaN(v) ? 0 : v }); else setNewProduct({ ...newProduct, quantite_reference: isNaN(v) ? 0 : v }); }} className="w-full p-2 border rounded text-sm" /></div>
                      <div><label className="block text-sm font-medium text-gray-700">Qté Réelle (ml)</label><input type="number" value={editingProduct?.quantite_reelle ?? newProduct.quantite_reelle} onChange={e => { const v = parseFloat(e.target.value); if (editingProduct) setEditingProduct({ ...editingProduct, quantite_reelle: isNaN(v) ? 0 : v }); else setNewProduct({ ...newProduct, quantite_reelle: isNaN(v) ? 0 : v }); }} className="w-full p-2 border rounded text-sm" /></div>
                      <div><label className="block text-sm font-medium text-gray-700">Réduction (%)</label><input type="number" value={editingProduct?.reduction ?? newProduct.reduction} onChange={e => { const v = parseInt(e.target.value); if (editingProduct) setEditingProduct({ ...editingProduct, reduction: isNaN(v) ? 0 : v }); else setNewProduct({ ...newProduct, reduction: isNaN(v) ? 0 : v }); }} className="w-full p-2 border rounded text-sm" /></div>
                      <div><label className="block text-sm font-medium text-gray-700">Catégorie</label><select value={editingProduct?.categorie ?? newProduct.categorie} onChange={e => { if (editingProduct) setEditingProduct({ ...editingProduct, categorie: e.target.value as any }); else setNewProduct({ ...newProduct, categorie: e.target.value as any }); }} className="w-full p-2 border rounded text-sm"><option value="makeup">Maquillage</option><option value="skincare">Soins Visage</option><option value="bodycare">Soins Corps</option><option value="haircare">Cheveux</option><option value="fragrance">Parfums</option><option value="accessories">Accessoires</option></select></div>
                    </div>
                    <div className="bg-green-50 p-4 rounded border-2 border-green-300">
                      <label className="text-sm font-bold text-green-800">Prix Final</label>
                      <div className="text-2xl font-bold text-green-600">
                        {calculateRealPrice(parseFloat(String(editingProduct?.prix_reference ?? newProduct.prix_reference)) || 0, parseFloat(String(editingProduct?.quantite_reference ?? newProduct.quantite_reference)) || 1, parseFloat(String(editingProduct?.quantite_reelle ?? newProduct.quantite_reelle)) || 1, editingProduct?.reduction ?? newProduct.reduction).toFixed(2)}€
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium text-gray-700">Stock</label><input type="number" value={editingProduct?.stock_unite ?? newProduct.stock_unite} onChange={e => { const v = parseInt(e.target.value); if (editingProduct) setEditingProduct({ ...editingProduct, stock_unite: isNaN(v) ? 0 : v }); else setNewProduct({ ...newProduct, stock_unite: isNaN(v) ? 0 : v }); }} className="w-full p-2 border rounded text-sm" /></div>
                      <div><label className="block text-sm font-medium text-gray-700">Emplacement</label><input type="text" value={(editingProduct?.emplacement_stock ?? newProduct.emplacement_stock) || ''} onChange={e => { if (editingProduct) setEditingProduct({ ...editingProduct, emplacement_stock: e.target.value }); else setNewProduct({ ...newProduct, emplacement_stock: e.target.value }); }} className="w-full p-2 border rounded text-sm" /></div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700">Description</label><textarea value={editingProduct?.description ?? newProduct.description} onChange={e => { if (editingProduct) setEditingProduct({ ...editingProduct, description: e.target.value }); else setNewProduct({ ...newProduct, description: e.target.value }); }} className="w-full p-2 border rounded text-sm" rows={3} /></div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {editingProduct ? (
                        <><button onClick={handleUpdateProduct} className="px-4 py-2 bg-orange-500 text-white rounded">Modifier</button><button onClick={() => { setEditingProduct(null); setPreviewImageUrl(''); }} className="px-4 py-2 bg-gray-500 text-white rounded">Annuler</button></>
                      ) : (
                        <><button onClick={handleAddProduct} className="px-4 py-2 bg-green-500 text-white rounded">Ajouter</button><button onClick={handleAnnulerAjout} className="px-4 py-2 bg-red-500 text-white rounded">Annuler</button><button onClick={checkForDuplicates} className="px-4 py-2 bg-blue-500 text-white rounded">Vérifier</button></>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="mb-4 flex gap-2">
                <select value={selectedBrandOrEmplacement} onChange={e => { setSelectedBrandOrEmplacement(e.target.value); if (e.target.value !== 'all') setFormCollapsed(true); }} className="px-3 py-2 border rounded text-sm">
                  <option value="all">Tous</option>
                  <optgroup label="Marque">{allBrands.map(b => <option key={b} value={`brand:${b}`}>{b}</option>)}</optgroup>
                  <optgroup label="Emplacement">{allEmplacements.map(e => <option key={e} value={`emp:${e}`}>{e}</option>)}</optgroup>
                </select>
              </div>
              <div className="space-y-2">
                {products.filter(p => {
                  if (selectedBrandOrEmplacement === 'all') return true;
                  if (selectedBrandOrEmplacement.startsWith('brand:')) return p.marque === selectedBrandOrEmplacement.replace('brand:', '');
                  if (selectedBrandOrEmplacement.startsWith('emp:')) return p.emplacement_stock === selectedBrandOrEmplacement.replace('emp:', '');
                  return true;
                }).map(product => (
                  <div key={product.id} className="flex justify-between bg-gray-50 p-3 rounded border text-sm">
                    <div className="flex gap-3 overflow-hidden">
                      {product.image_url && <img src={product.image_url} className="w-10 h-10 rounded object-cover" />}
                      <div className="min-w-0">
                        <p className="font-bold truncate">{product.nom}</p>
                        <p className="text-xs text-gray-500">{product.marque} - {product.quantite_reelle}ml</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingProduct(product); setPreviewImageUrl(product.image_url || ''); }} className="bg-blue-500 text-white px-2 py-1 rounded text-xs">✏️</button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="bg-red-500 text-white px-2 py-1 rounded text-xs">🗑️</button>
                      <button onClick={() => handleDuplicateProduct(product)} className="bg-purple-500 text-white px-2 py-1 rounded text-xs">🔗</button>
                    </div>
                  </div>
                ))}
              </div>
              {addingVariant && variantBaseProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50">
                  <div className="bg-white p-6 rounded max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                    <h3 className="font-bold mb-4">Variantes pour {variantBaseProduct.nom}</h3>
                    <div className="space-y-2 mb-4">
                      {[variantBaseProduct, ...similarProducts].map(p => (
                        <label key={p.id} className="flex items-center gap-3 p-2 border rounded"><input type="checkbox" defaultChecked={p.id === variantBaseProduct.id} className="w-4 h-4" /><span>{p.nom} ({p.marque})</span></label>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { const c = document.querySelectorAll('input[type="checkbox"]'); const s = [variantBaseProduct, ...similarProducts].filter((_, i) => i < c.length && (c[i] as HTMLInputElement).checked); handleCreateVariantGroup(s); }} className="bg-green-500 text-white px-4 py-2 rounded">Créer</button>
                      <button onClick={() => { setAddingVariant(false); setVariantBaseProduct(null); }} className="bg-gray-500 text-white px-4 py-2 rounded">Annuler</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h3 className="font-bold text-purple-800">Commandes ({orders.length})</h3>
              {orders.length === 0 ? <p className="text-center py-8">Aucune commande</p> : orders.map(order => (
                <div key={order.id} className="border rounded p-4 bg-white">
                  <div className="flex justify-between mb-3">
                    <div>
                      <h4 className="font-bold">#{order.id} - {order.customerInfo?.prenom} {order.customerInfo?.nom}</h4>
                      <p className="text-xs text-gray-500">{order.date}</p>
                    </div>
                    <div className="flex gap-2">
                      <select value={order.status} onChange={e => handleOrderStatusChange(order.id, e.target.value)} className={`px-2 py-1 rounded text-xs font-bold ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' : order.status === 'ready' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}><option value="pending">En attente</option><option value="preparing">En préparation</option><option value="ready">Prêt</option><option value="delivered">Livré</option></select>
                      <button onClick={() => handleDeleteOrder(order.id)} className="bg-red-500 text-white px-2 py-1 rounded text-xs">🗑️</button>
                    </div>
                  </div>
                  <div className="space-y-2 mb-3">
                    {(order.items || []).map((item, i) => {
                      const isPrepared = order.preparedItems?.[String(item.id)];
                      return (
                        <div key={i} className={`flex justify-between p-2 rounded text-xs border ${isPrepared ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                          <div className="flex items-center gap-2"><input type="checkbox" checked={!!isPrepared} onChange={() => togglePreparedItem(order.id, String(item.id))} className="w-4 h-4" /><span className={isPrepared ? 'line-through text-gray-500' : ''}>{item.nom} x{item.quantite_achat || 1}</span></div>
                          <span className="font-bold">{((item.prix_reference / (item.quantite_reference || 1)) * (item.quantite_reelle || item.quantite_reference) * (1 - (item.reduction || 0) / 100) * (item.quantite_achat || 1)).toFixed(2)}€</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="border-t pt-2 flex justify-between items-center">
                    <span className="text-xs">{allItemsPrepared(order) && <span className="bg-green-100 text-green-800 px-2 py-1 rounded">✅ Prêt</span>}</span>
                    <span className="font-bold text-purple-600">Total: {order.total.toFixed(2)}€</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;