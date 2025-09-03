
// ============================================================================
// 🔍 UTILITAIRE DE COMPARAISON D'IMAGES AMÉLIORÉ - VERSION CORRIGÉE
// ============================================================================
// Ce fichier gère la comparaison d'images pour détecter les doublons de produits
// 
// 🔧 AMÉLIORATIONS APPORTÉES :
// - ✅ Algorithme de comparaison plus précis
// - ✅ Gestion robuste des erreurs d'images
// - ✅ Multiples méthodes de comparaison
// - ✅ Seuils de similarité ajustables
// - ✅ Meilleure détection des produits similaires
// 
// 🔧 PARAMÈTRES MODIFIABLES :
// - Seuils de similarité (ligne 45-50)
// - Taille des images pour comparaison (ligne 85)
// - Nombre de couleurs dominantes (ligne 200)
// ============================================================================

interface ImageHash {
  hash: string
  url: string
  productId: string
}

interface ComparisonResult {
  isMatch: boolean
  similarity: number
  matchedProduct?: any
  confidence: 'high' | 'medium' | 'low'
}

export class ImageComparator {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  // ============================================================================
  // 🎯 SEUILS DE DÉTECTION - MODIFIABLES
  // ============================================================================
  // 🔧 VOUS POUVEZ AJUSTER CES VALEURS :
  private readonly SIMILARITY_THRESHOLDS = {
    HIGH_CONFIDENCE: 85,    // 🔧 Seuil pour confiance élevée (85%)
    MEDIUM_CONFIDENCE: 75,  // 🔧 Seuil pour confiance moyenne (75%)
    MATCH_THRESHOLD: 65,    // 🔧 Seuil minimum pour considérer un match (65%)
    COLOR_WEIGHT: 0.4,      // 🔧 Poids de la comparaison couleur (40%)
    HASH_WEIGHT: 0.6        // 🔧 Poids de la comparaison hash (60%)
  }

  constructor() {
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')!
    
    if (!this.ctx) {
      throw new Error('Impossible d\'initialiser le contexte Canvas pour la comparaison d\'images')
    }
  }

  // ============================================================================
  // 🔐 GÉNÉRATION DE HASH PERCEPTUEL AMÉLIORÉ
  // ============================================================================
  // Cette méthode crée une "empreinte" unique de l'image
  async generateImageHash(imageUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      // ============================================================================
      // ⏱️ TIMEOUT POUR ÉVITER LES BLOCAGES
      // ============================================================================
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout lors du chargement de l'image: ${imageUrl}`))
      }, 10000) // 10 secondes maximum

      img.onload = () => {
        clearTimeout(timeout)
        try {
          // 🔧 TAILLE DU HASH - MODIFIABLE
          const hashSize = 16 // Plus grand = plus précis mais plus lent
          
          this.canvas.width = hashSize
          this.canvas.height = hashSize
          
          // Dessiner l'image redimensionnée avec lissage
          this.ctx.imageSmoothingEnabled = true
          this.ctx.imageSmoothingQuality = 'high'
          this.ctx.drawImage(img, 0, 0, hashSize, hashSize)
          
          // Récupérer les données de pixels
          const imageData = this.ctx.getImageData(0, 0, hashSize, hashSize)
          const pixels = imageData.data
          
          // ============================================================================
          // 🧮 CALCUL DE LA LUMINOSITÉ MOYENNE AMÉLIORÉ
          // ============================================================================
          let totalLuminosity = 0
          const pixelCount = pixels.length / 4
          
          for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i]
            const g = pixels[i + 1]
            const b = pixels[i + 2]
            // Formule de luminosité perceptuelle plus précise
            const luminosity = 0.299 * r + 0.587 * g + 0.114 * b
            totalLuminosity += luminosity
          }
          
          const avgLuminosity = totalLuminosity / pixelCount
          
          // ============================================================================
          // 🔢 GÉNÉRATION DU HASH BINAIRE
          // ============================================================================
          let hash = ''
          for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i]
            const g = pixels[i + 1]
            const b = pixels[i + 2]
            const luminosity = 0.299 * r + 0.587 * g + 0.114 * b
            hash += luminosity > avgLuminosity ? '1' : '0'
          }
          
          console.log(`✅ Hash généré pour ${imageUrl}: ${hash.substring(0, 16)}...`)
          resolve(hash)
          
        } catch (error) {
          clearTimeout(timeout)
          console.error('❌ Erreur lors de la génération du hash:', error)
          reject(error)
        }
      }
      
      img.onerror = () => {
        clearTimeout(timeout)
        const error = new Error(`Impossible de charger l'image: ${imageUrl}`)
        console.error('❌ Erreur de chargement d\'image:', error)
        reject(error)
      }
      
      // Ajouter un timestamp pour éviter le cache
      const separator = imageUrl.includes('?') ? '&' : '?'
      img.src = `${imageUrl}${separator}_t=${Date.now()}`
    })
  }

  // ============================================================================
  // 📏 CALCUL DE LA DISTANCE DE HAMMING OPTIMISÉ
  // ============================================================================
  // Cette fonction mesure la différence entre deux hash
  calculateHammingDistance(hash1: string, hash2: string): number {
    if (!hash1 || !hash2 || hash1.length !== hash2.length) {
      console.warn('⚠️ Hash invalides pour la comparaison')
      return Infinity
    }
    
    let distance = 0
    for (let i = 0; i < hash1.length; i++) {
      if (hash1[i] !== hash2[i]) distance++
    }
    
    return distance
  }

  // ============================================================================
  // 🎨 EXTRACTION DES COULEURS DOMINANTES AMÉLIORÉE
  // ============================================================================
  async extractDominantColors(imageUrl: string, colorCount = 5): Promise<number[][]> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout extraction couleurs: ${imageUrl}`))
      }, 8000)

      img.onload = () => {
        clearTimeout(timeout)
        try {
          // Taille réduite pour performance
          const size = 40
          this.canvas.width = size
          this.canvas.height = size
          
          this.ctx.drawImage(img, 0, 0, size, size)
          const imageData = this.ctx.getImageData(0, 0, size, size)
          const pixels = imageData.data
          
          // ============================================================================
          // 🎨 QUANTIFICATION DES COULEURS
          // ============================================================================
          const colorMap: { [key: string]: number } = {}
          
          for (let i = 0; i < pixels.length; i += 4) {
            // Réduire la précision pour grouper les couleurs similaires
            const r = Math.floor(pixels[i] / 16) * 16
            const g = Math.floor(pixels[i + 1] / 16) * 16
            const b = Math.floor(pixels[i + 2] / 16) * 16
            const alpha = pixels[i + 3]
            
            // Ignorer les pixels transparents
            if (alpha < 128) continue
            
            const key = `${r},${g},${b}`
            colorMap[key] = (colorMap[key] || 0) + 1
          }
          
          // Trier par fréquence et prendre les couleurs dominantes
          const sortedColors = Object.entries(colorMap)
            .sort(([,a], [,b]) => b - a)
            .slice(0, colorCount)
            .map(([color]) => color.split(',').map(Number))
          
          console.log(`🎨 ${sortedColors.length} couleurs dominantes extraites`)
          resolve(sortedColors)
          
        } catch (error) {
          clearTimeout(timeout)
          reject(error)
        }
      }
      
      img.onerror = () => {
        clearTimeout(timeout)
        reject(new Error(`Erreur chargement pour extraction couleurs: ${imageUrl}`))
      }
      
      img.src = imageUrl
    })
  }

  // ============================================================================
  // 🌈 CALCUL DE DISTANCE ENTRE COULEURS
  // ============================================================================
  private calculateColorDistance(color1: number[], color2: number[]): number {
    if (!color1 || !color2 || color1.length !== 3 || color2.length !== 3) {
      return 255 // Distance maximale
    }
    
    // Distance euclidienne dans l'espace RGB
    const rDiff = color1[0] - color2[0]
    const gDiff = color1[1] - color2[1]
    const bDiff = color1[2] - color2[2]
    
    return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff)
  }

  // ============================================================================
  // 🔍 COMPARAISON PAR COULEURS DOMINANTES
  // ============================================================================
  async compareByDominantColors(imageUrl1: string, imageUrl2: string): Promise<number> {
    try {
      console.log('🎨 Début comparaison par couleurs dominantes...')
      
      const [colors1, colors2] = await Promise.all([
        this.extractDominantColors(imageUrl1),
        this.extractDominantColors(imageUrl2)
      ])
      
      if (colors1.length === 0 || colors2.length === 0) {
        console.warn('⚠️ Aucune couleur extraite')
        return 0
      }
      
      // ============================================================================
      // 🧮 CALCUL DE SIMILARITÉ COULEUR
      // ============================================================================
      let totalSimilarity = 0
      let comparisons = 0
      
      // Comparer chaque couleur de la première image avec toutes celles de la seconde
      for (const color1 of colors1) {
        let bestMatch = Infinity
        for (const color2 of colors2) {
          const distance = this.calculateColorDistance(color1, color2)
          if (distance < bestMatch) {
            bestMatch = distance
          }
        }
        
        // Convertir la distance en similarité (0-100%)
        const similarity = Math.max(0, (255 - bestMatch) / 255 * 100)
        totalSimilarity += similarity
        comparisons++
      }
      
      const avgSimilarity = comparisons > 0 ? totalSimilarity / comparisons : 0
      console.log(`🎨 Similarité couleurs: ${avgSimilarity.toFixed(1)}%`)
      
      return avgSimilarity
      
    } catch (error) {
      console.error('❌ Erreur comparaison couleurs:', error)
      return 0
    }
  }

  // ============================================================================
  // 🚀 FONCTION PRINCIPALE : COMPARAISON AVEC PRODUITS EXISTANTS
  // ============================================================================
  async compareWithExistingImages(
    newImageUrl: string, 
    existingProducts: any[]
  ): Promise<ComparisonResult> {
    try {
      console.log(`🔍 Début comparaison avec ${existingProducts.length} produits existants...`)
      
      if (!newImageUrl || existingProducts.length === 0) {
        return {
          isMatch: false,
          similarity: 0,
          confidence: 'low'
        }
      }

      // ============================================================================
      // 🧮 GÉNÉRATION DU HASH DE LA NOUVELLE IMAGE
      // ============================================================================
      let newHash: string
      try {
        newHash = await this.generateImageHash(newImageUrl)
      } catch (error) {
        console.error('❌ Erreur génération hash nouvelle image:', error)
        return {
          isMatch: false,
          similarity: 0,
          confidence: 'low'
        }
      }
      
      let bestMatch: any = null
      let bestSimilarity = 0
      let bestHashSimilarity = 0
      let bestColorSimilarity = 0
      
      // ============================================================================
      // 🔄 COMPARAISON AVEC CHAQUE PRODUIT EXISTANT
      // ============================================================================
      for (const product of existingProducts) {
        if (!product.imageUrl) {
          console.log(`⏭️ Produit ${product.name} ignoré (pas d'image)`)
          continue
        }
        
        try {
          console.log(`🔍 Comparaison avec: ${product.name}`)
          
          // ============================================================================
          // 📊 MÉTHODE 1 : COMPARAISON PAR HASH
          // ============================================================================
          let hashSimilarity = 0
          try {
            const existingHash = await this.generateImageHash(product.imageUrl)
            const distance = this.calculateHammingDistance(newHash, existingHash)
            const maxBits = newHash.length
            hashSimilarity = ((maxBits - distance) / maxBits) * 100
            console.log(`📊 Hash similarity: ${hashSimilarity.toFixed(1)}%`)
          } catch (error) {
            console.warn(`⚠️ Erreur hash pour ${product.name}:`, error)
            hashSimilarity = 0
          }
          
          // ============================================================================
          // 🎨 MÉTHODE 2 : COMPARAISON PAR COULEURS
          // ============================================================================
          let colorSimilarity = 0
          try {
            colorSimilarity = await this.compareByDominantColors(newImageUrl, product.imageUrl)
            console.log(`🎨 Color similarity: ${colorSimilarity.toFixed(1)}%`)
          } catch (error) {
            console.warn(`⚠️ Erreur couleurs pour ${product.name}:`, error)
            colorSimilarity = 0
          }
          
          // ============================================================================
          // 🧮 CALCUL DE SIMILARITÉ COMBINÉE
          // ============================================================================
          const combinedSimilarity = (
            hashSimilarity * this.SIMILARITY_THRESHOLDS.HASH_WEIGHT +
            colorSimilarity * this.SIMILARITY_THRESHOLDS.COLOR_WEIGHT
          )
          
          console.log(`📈 Similarité combinée: ${combinedSimilarity.toFixed(1)}%`)
          
          // Mettre à jour le meilleur match
          if (combinedSimilarity > bestSimilarity) {
            bestSimilarity = combinedSimilarity
            bestHashSimilarity = hashSimilarity
            bestColorSimilarity = colorSimilarity
            bestMatch = product
          }
          
        } catch (error) {
          console.warn(`⚠️ Erreur lors de la comparaison avec ${product.name}:`, error)
          continue
        }
      }
      
      // ============================================================================
      // 🎯 DÉTERMINATION DU RÉSULTAT FINAL
      // ============================================================================
      const isMatch = bestSimilarity >= this.SIMILARITY_THRESHOLDS.MATCH_THRESHOLD
      
      let confidence: 'high' | 'medium' | 'low' = 'low'
      if (bestSimilarity >= this.SIMILARITY_THRESHOLDS.HIGH_CONFIDENCE) {
        confidence = 'high'
      } else if (bestSimilarity >= this.SIMILARITY_THRESHOLDS.MEDIUM_CONFIDENCE) {
        confidence = 'medium'
      }
      
      const result: ComparisonResult = {
        isMatch,
        similarity: Math.round(bestSimilarity * 10) / 10, // Arrondir à 1 décimale
        matchedProduct: isMatch ? bestMatch : undefined,
        confidence
      }
      
      // ============================================================================
      // 📊 LOGS DE RÉSULTAT DÉTAILLÉS
      // ============================================================================
      if (isMatch) {
        console.log(`✅ MATCH DÉTECTÉ!`)
        console.log(`📦 Produit: ${bestMatch?.name}`)
        console.log(`📊 Similarité: ${bestSimilarity.toFixed(1)}%`)
        console.log(`🔢 Hash: ${bestHashSimilarity.toFixed(1)}%`)
        console.log(`🎨 Couleurs: ${bestColorSimilarity.toFixed(1)}%`)
        console.log(`🎯 Confiance: ${confidence}`)
      } else {
        console.log(`❌ Aucun doublon détecté (meilleur score: ${bestSimilarity.toFixed(1)}%)`)
      }
      
      return result
      
    } catch (error) {
      console.error('❌ Erreur générale lors de la comparaison d\'images:', error)
      return {
        isMatch: false,
        similarity: 0,
        confidence: 'low'
      }
    }
  }

  // ============================================================================
  // 🛠️ MÉTHODE DE DIAGNOSTIC POUR DÉBOGAGE
  // ============================================================================
  async debugImageComparison(imageUrl1: string, imageUrl2: string): Promise<void> {
    console.log('🔧 DIAGNOSTIC DE COMPARAISON D\'IMAGES')
    console.log('=====================================')
    
    try {
      console.log('📷 Image 1:', imageUrl1)
      console.log('📷 Image 2:', imageUrl2)
      
      // Test des hash
      const hash1 = await this.generateImageHash(imageUrl1)
      const hash2 = await this.generateImageHash(imageUrl2)
      console.log('🔢 Hash 1:', hash1.substring(0, 32) + '...')
      console.log('🔢 Hash 2:', hash2.substring(0, 32) + '...')
      
      const distance = this.calculateHammingDistance(hash1, hash2)
      const hashSimilarity = ((hash1.length - distance) / hash1.length) * 100
      console.log('📊 Similarité hash:', hashSimilarity.toFixed(1) + '%')
      
      // Test des couleurs
      const colorSimilarity = await this.compareByDominantColors(imageUrl1, imageUrl2)
      console.log('🎨 Similarité couleurs:', colorSimilarity.toFixed(1) + '%')
      
      // Similarité combinée
      const combined = hashSimilarity * 0.6 + colorSimilarity * 0.4
      console.log('🎯 Similarité combinée:', combined.toFixed(1) + '%')
      
    } catch (error) {
      console.error('❌ Erreur diagnostic:', error)
    }
  }
}

// ============================================================================
// 🚀 EXPORT DE L'INSTANCE SINGLETON
// ============================================================================
export const imageComparator = new ImageComparator()
