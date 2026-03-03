import { X } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import CustomVideoPlayer from './CustomVideoPlayer';

/**
 * @file MediaViewer.jsx
 * @description Visor de medios para imágenes y videos.
 * @param {object} props - Propiedades del componente.
 * @param {object} props.file - El archivo a visualizar.
 * @param {function} props.onClose - Función para cerrar el visor.
 * @returns {JSX.Element|null} El componente del visor de medios.
 */
export default function MediaViewer({ file, onClose }) {
  const [showTitle, setShowTitle] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleMouseMove = () => {
    setShowTitle(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setShowTitle(false);
    }, 2000);
  };

  const handleMouseLeave = () => {
    setShowTitle(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  if (!file) return null;

  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');

  return (
    <div 
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 md:p-10 backdrop-blur-sm transition-opacity duration-300"
      onClick={onClose} 
    >
      <button 
        onClick={onClose}
        className="fixed top-4 right-4 z-[60] bg-theme p-2.5 rounded-full border-2 border-secondary shadow-lg text-theme hover:border-accent hover:text-accent transition-all duration-200"
        title="Cerrar (Esc)"
      >
        <X size={24} strokeWidth={2.5} />
      </button>

      <div 
        className="relative flex items-center justify-center animate-zoom-in group rounded-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()} 
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div 
          className={`absolute top-0 left-0 right-0 z-10 px-4 pt-3 pb-12 bg-gradient-to-b from-black/80 to-transparent text-white transition-all duration-300 pointer-events-none rounded-t-xl
            ${showTitle 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 -translate-y-2'  
            }`}
        >
          <div className="font-medium text-sm truncate max-w-[90%] text-center md:text-left drop-shadow-md">
            {file.name}
          </div>
        </div>

        {isImage && (
          <img 
            src={file.url} 
            alt={file.name} 
            className="block w-auto h-auto max-w-[95vw] max-h-[90vh] rounded-xl shadow-2xl object-contain border-4 border-secondary transition-all"
          />
        )}

        {isVideo && (
          <CustomVideoPlayer src={file.url} />
        )}
      </div>
    </div>
  );
}