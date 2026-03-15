// utils.ts
import { Product, Order, SyncData } from './types';
import { STORAGE_KEYS } from './constants';

// Fonctions de persistance localStorage
export const saveToStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Erreur sauvegarde localStorage:', error);
  }
};

export const loadFromStorage = (key: string, defaultValue: any) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error('Erreur chargement localStorage:', error);
    return defaultValue;
  }
};

// Génération d'un ID unique pour chaque appareil
export const getDeviceId = (): string => {
  let deviceId = loadFromStorage(STORAGE_KEYS.DEVICE_ID, null);
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    saveToStorage(STORAGE_KEYS.DEVICE_ID, deviceId);
  }
  return deviceId;
};

// Fonctions de synchronisation
export const encodeSyncData = (products: Product[], orders: Order[]): string => {
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

export const decodeSyncData = (encodedData: string): SyncData | null => {
  try {
    const jsonString = decodeURIComponent(atob(encodedData));
    const data = JSON.parse(jsonString);
    
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

export const generateSyncUrl = (products: Product[], orders: Order[]): string => {
  const baseUrl = window.location.origin + window.location.pathname;
  const encodedData = encodeSyncData(products, orders);
  return `${baseUrl}?sync=${encodedData}`;
};

export const extractSyncDataFromUrl = (): SyncData | null => {
  const urlParams = new URLSearchParams(window.location.search);
  const syncParam = urlParams.get('sync');
  
  if (syncParam) {
    return decodeSyncData(syncParam);
  }
  
  return null;
};

// Utilitaires métier
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'preparing': return 'bg-blue-100 text-blue-800';
    case 'ready': return 'bg-green-100 text-green-800';
    case 'delivered': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pending': return 'En attente';
    case 'preparing': return 'En préparation';
    case 'ready': return 'Prêt';
    case 'delivered': return 'Livré';
    default: return status;
  }
};

export const getCustomerName = (customerInfo: any) => {
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