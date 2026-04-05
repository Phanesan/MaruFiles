import React, { useState, useEffect, useRef } from 'react';
import { X, Pencil, Check } from 'lucide-react';

export default function RenameModal({ isOpen, onClose, onConfirm, currentItem }) {
  const [newName, setNewName] = useState('');
  const [wasOpen, setWasOpen] = useState(false);
  const inputRef = useRef(null);

  if (isOpen && !wasOpen) {
    setWasOpen(true);
    setNewName(currentItem?.name || '');
  } else if (!isOpen && wasOpen) {
    setWasOpen(false);
  }

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = newName.trim();
    
    if (trimmedName && trimmedName !== currentItem.name && !trimmedName.includes('/')) {
      onConfirm(trimmedName);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md flex flex-col border border-gray-100 dark:border-gray-800">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between p-5 border-b border-secondary/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
              <Pencil size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-theme">Renombrar</h2>
              <p className="text-xs text-secondary truncate max-w-[200px]">{currentItem?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary/10 text-secondary transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          <div className="p-5">
            <label className="block text-sm font-medium text-theme mb-2">Nuevo nombre</label>
            <input 
              ref={inputRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-secondary/5 border border-secondary/20 text-theme focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              placeholder="Escribe el nuevo nombre..."
            />
            {newName.includes('/') && (
              <p className="text-red-500 text-xs mt-2">El nombre no puede contener el carácter "/"</p>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-secondary/20 flex justify-end gap-3 bg-secondary/5 rounded-b-2xl">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-medium text-primary hover:bg-secondary/20 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={!newName.trim() || newName === currentItem?.name || newName.includes('/')}
              className="flex items-center gap-2 px-6 py-2 rounded-lg font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-transform active:scale-95 shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              <Check size={18} />
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}