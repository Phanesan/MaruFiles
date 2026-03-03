import { X, FolderPlus } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

/**
 * @file CreateFolderModal.jsx
 * @description Modal para crear una nueva carpeta.
 * @param {object} props - Propiedades del componente.
 * @param {boolean} props.isOpen - Indica si el modal está abierto.
 * @param {function} props.onClose - Función para cerrar el modal.
 * @param {function} props.onCreate - Función para crear la carpeta.
 * @returns {JSX.Element|null} El componente del modal para crear carpetas.
 */
export default function CreateFolderModal({ isOpen, onClose, onCreate }) {
  const [folderName, setFolderName] = useState('');
  const inputRef = useRef(null);

  const handleClose = () => {
    setFolderName('');
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (folderName.trim()) {
      onCreate(folderName.trim());
      setFolderName('');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
      onClick={handleClose}
    >
      <div 
        className="bg-theme w-full max-w-md rounded-2xl shadow-2xl border border-secondary p-6 animate-zoom-in relative"
        onClick={(e) => e.stopPropagation()} 
      >
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-primary hover:text-accent transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="bg-accent/10 p-3 rounded-full text-accent">
            <FolderPlus size={24} />
          </div>
          <h2 className="text-xl font-bold text-theme">Crear Nueva Carpeta</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="folderName" className="block text-sm font-medium text-primary mb-2">
              Nombre de la carpeta
            </label>
            <input
              ref={inputRef}
              type="text"
              id="folderName"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Nombre"
              className="w-full px-4 py-2.5 rounded-lg bg-secondary/20 border border-secondary text-theme placeholder:text-primary/50 focus:ring-2 focus:ring-accent focus:border-accent transition-all outline-none"
              required
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-lg font-semibold text-theme bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 rounded-lg font-semibold text-white bg-accent transition-all duration-300
                ${!folderName.trim() 
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer hover:bg-accent/90 hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/40 active:translate-y-0 active:shadow-none'
                }`}
            >
              Crear Carpeta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}