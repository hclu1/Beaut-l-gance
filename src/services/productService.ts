import { supabase } from '../lib/supabase'

export class ProductService {
  static async getAllProducts() {
    console.log('ProductService: Tentative de connexion...')
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(5)
      
      if (error) {
        console.error('Erreur Supabase:', error)
        throw error
      }
      
      console.log('ProductService: Données reçues:', data)
      return data
    } catch (err) {
      console.error('ProductService: Exception:', err)
      throw err
    }
  }
}