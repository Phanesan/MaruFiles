import { X, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

/**
 * @file ConfirmDeleteModal.jsx
 * @description Modal de confirmación para eliminar archivos y carpetas.
 * @param {object} props - Propiedades del componente.
 * @param {boolean} props.isOpen - Indica si el modal está abierto.
 * @param {function} props.onClose - Función para cerrar el modal.
 * @param {function} props.onConfirm - Función para confirmar la eliminación.
 * @param {number} props.count - El número de elementos a eliminar.
 * @returns {JSX.Element|null} El componente del modal de confirmación.
 */
export default function ConfirmDeleteModal({ isOpen, onClose, onConfirm, count }) {
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-theme w-full max-w-md rounded-2xl shadow-2xl border border-secondary p-6 animate-zoom-in relative"
        onClick={(e) => e.stopPropagation()} 
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-primary hover:text-red-500 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="bg-red-500/10 p-3 rounded-full text-red-500">
            <AlertTriangle size={24} />
          </div>
          <h2 className="text-xl font-bold text-theme">Confirmar Eliminación</h2>
        </div>

        <div className="mb-8 text-primary">
          <p className="text-theme font-medium mb-2">
            ¿Estás seguro de que deseas eliminar <strong>{count}</strong> elemento(s)?
          </p>
          <p className="text-sm">
            Esta acción también eliminará todo el contenido interno si hay carpetas seleccionadas y <strong className="text-red-500 font-medium">no se puede deshacer</strong>.
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg font-semibold text-theme bg-secondary/30 hover:bg-secondary/50 transition-colors"
          >
            Cancelar
          </button>
          
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-5 py-2.5 rounded-lg font-semibold text-white bg-red-500 transition-all duration-300 hover:bg-red-600 hover:-translate-y-1 hover:shadow-lg hover:shadow-red-500/40 active:translate-y-0 active:shadow-none"
          >
            Sí, Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}