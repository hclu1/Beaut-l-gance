// components/Header.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Product, Order, SyncData } from '../types';
import { SHOP_CONFIG } from '../constants';
import SearchWithQR from './SearchWithQR';

interface HeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  products: Product[];
  orders: Order[];
  onDataSync: (syncData: SyncData) => void;
  onForceSync: () => void;
}

const Header: React.FC<HeaderProps> = ({
  searchTerm,
  setSearchTerm,
  products,
  orders,
  onDataSync,
  onForceSync
}) => {
  return (
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
      
      <SearchWithQR 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm}
        products={products}
        orders={orders}
        onDataSync={onDataSync}
        onForceSync={onForceSync}
      />
    </motion.div>
  );
};

export default Header;