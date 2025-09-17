import { supabase } from '../lib/supabase'

export class ProductService {
  static async getAllProducts() {
    console.log('ProductService: Tentative de connexion...')
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('actif', true)
        .order('nom')
      
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

  static async addProduct(productData: any) {
    try {
      // D'abord, récupérer l'ID de la catégorie
      const { data: category, error: catError } = await supabase
        .from('categories')
        .select('id')
        .eq('nom', productData.categorie)
        .single()

      if (catError) throw catError

      const { data, error } = await supabase
        .from('products')
        .insert([{
          nom: productData.nom,
          marque: productData.marque,
          categorie_id: category.id,
          image_url: productData.image,
          emplacement: productData.emplacement,
          prix_reference: productData.prix_reference,
          quantite_web: productData.quantite_web,
          quantite_reelle: productData.quantite_reelle,
          reduction: productData.reduction,
          description: productData.description,
          quantite_produit: productData.quantite_produit,
          actif: true
        }])
        .select()

      if (error) throw error
      console.log('Produit ajouté:', data[0])
      return data[0]
    } catch (err) {
      console.error('Erreur ajout produit:', err)
      throw err
    }
  }

  static async updateStock(id: string, newStock: number) {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({ quantite_reelle: newStock })
        .eq('id', id)
        .select()

      if (error) throw error
      console.log('Stock mis à jour:', data)
      return data[0]
    } catch (err) {
      console.error('Erreur mise à jour stock:', err)
      throw err
    }
  }

  static async deleteProduct(id: string) {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({ actif: false })
        .eq('id', id)

      if (error) throw error
      console.log('Produit désactivé:', id)
      return data
    } catch (err) {
      console.error('Erreur suppression produit:', err)
      throw err
    }
  }
}