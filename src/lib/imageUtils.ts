// src/lib/imageUtils.ts
export function getOptimizedImageUrl(imagePath: string | null, options = {}) {
  if (!imagePath) return null;
  
  const {
    width = 800,
    height = 600,
    format = 'webp',
    quality = 80,
    resize = 'contain'
  } = options;

  // Si l'image est déjà une URL complète, l'utiliser directement
  const baseUrl = imagePath.startsWith('http') 
    ? imagePath 
    : `https://rvakasbhpggvxdnlqxpz.supabase.co/storage/v1/object/public/product-images/${imagePath}`;

  return `${baseUrl}?width=${width}&height=${height}&format=${format}&quality=${quality}&resize=${resize}`;
}

export const imagePresets = {
  thumbnail: { width: 300, height: 300, quality: 70 },
  card: { width: 400, height: 400, quality: 75 },
  modal: { width: 800, height: 800, quality: 85 },
  zoom: { width: 1200, height: 1200, quality: 90 }
};