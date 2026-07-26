import React, { useEffect } from 'react'
import { X, ZoomIn } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ImageLightboxProps {
  src: string | null
  alt?: string
  onClose: () => void
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({ src, alt, onClose }) => {
  useEffect(() => {
    if (!src) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [src, onClose])

  return (
    <AnimatePresence>
      {src && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          onClick={onClose}
        >
          <motion.img
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            src={src}
            alt={alt || 'Image'}
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl select-none"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-sm"
            title="Close"
          >
            <X size={20} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ImageLightbox
