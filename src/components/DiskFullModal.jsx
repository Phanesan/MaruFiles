import React from 'react';
import { HardDrive, XCircle } from 'lucide-react';

export default function DiskFullModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-800">
        
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
            <HardDrive size={48} strokeWidth={1.5} />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Almacenamiento Lleno
          </h2>
          
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            La subida ha fallado porque el disco del servidor MinIO se ha quedado sin espacio físico disponible.
          </p>

          <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs px-4 py-3 rounded-lg w-full border border-red-200 dark:border-red-900/50">
            <strong>Acción requerida:</strong> Elimina archivos grandes de MaruFiles o contacta al administrador para aumentar el volumen de Docker.
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-medium bg-red-600 hover:bg-red-700 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
          >
            <XCircle size={20} />
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}