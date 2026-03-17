// components/DiscreteAdminButton.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SHOP_CONFIG } from '../constants';

interface DiscreteAdminButtonProps {
  setAdmin: (admin: boolean) => void;
}

const DiscreteAdminButton: React.FC<DiscreteAdminButtonProps> = ({ setAdmin }) => {
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
      <motion.button
        className="fixed bottom-6 left-6 w-3 h-3 bg-gray-300 rounded-full opacity-100 hover:opacity-100 hover:scale-150 transition-all duration-300 z-30"
        whileHover={{ 
          backgroundColor: "#7c3aed",
          boxShadow: "0 0 20px rgba(124, 58, 237, 0.5)"
        }}
        onClick={() => setShowPasswordModal(true)}
        title="Accès administrateur"
      />

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
};

export default DiscreteAdminButton;