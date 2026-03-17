// components/ImageCapture.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageCaptureProps {
  currentImage: string;
  onImageChange: (imageUrl: string) => void;
}

const ImageCapture: React.FC<ImageCaptureProps> = ({ currentImage, onImageChange }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCapturing(true);
    } catch (error) {
      alert('Impossible d\'accéder à la caméra. Veuillez utiliser l\'upload de fichier.');
      console.error('Erreur caméra:', error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        onImageChange(imageDataUrl);
        stopCamera();
        setShowOptions(false);
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Fichier trop volumineux (max 5MB)');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onImageChange(result);
        setShowOptions(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    onImageChange('https://images.pexels.com/photos/2533266/pexels-photo-2533266.jpeg?auto=compress&cs=tinysrgb&w=400');
    setShowOptions(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Image du produit
      </label>
      
      <div className="relative mb-3">
        <img
          src={currentImage}
          alt="Aperçu produit"
          className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
        />
        <button
          type="button"
          onClick={() => setShowOptions(!showOptions)}
          className="absolute bottom-2 right-2 bg-purple-600 text-white p-2 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
        >
          📷
        </button>
      </div>

      <AnimatePresence>
        {showOptions && (
          <motion.div
            className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {!isCapturing ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={startCamera}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  📷 Prendre une photo
                </button>
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  📁 Choisir un fichier
                </button>
                
                <button
                  type="button"
                  onClick={removeImage}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  🗑️ Image par défaut
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowOptions(false)}
                  className="w-full p-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Annuler
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-48 object-cover rounded-lg bg-black"
                />
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="flex-1 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    📸 Capturer
                  </button>
                  
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="flex-1 p-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default ImageCapture