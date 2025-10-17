// src/lib/imageUtils.ts

// 🚀 OPTIMISATION: Utiliser les transformations natives de Supabase Storage
export function getOptimizedImageUrl(imagePath: string | null, options = {}) {
  if (!imagePath) return null;
  
  const {
    width = 800,
    height = 600,
    format = 'webp', // WebP par défaut pour meilleure compression
    quality = 80,
    resize = 'contain'
  } = options;

  // Si l'image est déjà une URL complète Supabase
  if (imagePath.includes('supabase.co/storage')) {
    // Ajouter les paramètres de transformation Supabase
    const url = new URL(imagePath);
    url.searchParams.set('width', width.toString());
    url.searchParams.set('height', height.toString());
    url.searchParams.set('quality', quality.toString());
    url.searchParams.set('resize', resize);
    
    // 🚀 Ajouter le format si supporté
    if (format === 'webp' && !imagePath.endsWith('.svg')) {
      url.searchParams.set('format', 'webp');
    }
    
    return url.toString();
  }

  // Sinon construire l'URL avec les transformations
  const baseUrl = imagePath.startsWith('http') 
    ? imagePath 
    : `https://rvakasbhpggvxdnlqxpz.supabase.co/storage/v1/object/public/product-images/${imagePath}`;

  const url = new URL(baseUrl);
  url.searchParams.set('width', width.toString());
  url.searchParams.set('height', height.toString());
  url.searchParams.set('quality', quality.toString());
  url.searchParams.set('resize', resize);
  
  if (format === 'webp' && !imagePath.endsWith('.svg')) {
    url.searchParams.set('format', 'webp');
  }

  return url.toString();
}

// 🚀 OPTIMISATION: Presets adaptés aux besoins réels
export const imagePresets = {
  thumbnail: { width: 200, height: 200, quality: 70, resize: 'cover' },
  card: { width: 400, height: 400, quality: 75, resize: 'contain' },
  modal: { width: 800, height: 800, quality: 85, resize: 'contain' },
  zoom: { width: 1200, height: 1200, quality: 90, resize: 'contain' }
};

// 🚀 NOUVELLE FONCTION: Preload des images critiques
export function preloadImage(url: string | null): void {
  if (!url) return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = url;
  document.head.appendChild(link);
}

// 🚀 NOUVELLE FONCTION: Lazy loading avec Intersection Observer
export function setupLazyLoading(imgSelector = 'img[loading="lazy"]'): void {
  if ('IntersectionObserver' in window) {
    const images = document.querySelectorAll(imgSelector);
    
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          imageObserver.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px' // Charger 50px avant que l'image soit visible
    });
    
    images.forEach(img => imageObserver.observe(img));
  }
}
