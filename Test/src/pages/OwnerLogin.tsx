
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Lock, User, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

const OwnerLogin: React.FC = () => {
  const navigate = useNavigate()
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  // Identifiants par défaut (à modifier selon vos besoins)
  const OWNER_CREDENTIALS = {
    username: 'Herve',
    password: 'marina2025'
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulation d'une vérification
    setTimeout(() => {
      if (credentials.username === OWNER_CREDENTIALS.username && 
          credentials.password === OWNER_CREDENTIALS.password) {
        localStorage.setItem('isOwnerAuthenticated', 'true')
        toast.success('Connexion réussie !')
        navigate('/owner/dashboard')
      } else {
        toast.error('Identifiants incorrects')
      }
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Mode Propriétaire</h1>
          <p className="text-gray-600">Accès à la gestion de votre boutique</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom d'utilisateur
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Votre nom d'utilisateur"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Votre mot de passe"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Identifiants par défaut :</h3>
          <p className="text-sm text-blue-700">
            <strong>Utilisateur :</strong> proprietaire<br />
            <strong>Mot de passe :</strong> beaute2025
          </p>
          <p className="text-xs text-blue-600 mt-2">
            💡 Modifiez ces identifiants dans le code pour sécuriser votre accès
          </p>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/boutique')}
            className="text-pink-600 hover:text-pink-700 text-sm font-medium"
          >
            ← Retour à la boutique client
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default OwnerLogin
