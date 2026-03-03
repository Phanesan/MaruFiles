import React from 'react';
import { AlertOctagon, RefreshCw, Terminal } from 'lucide-react';

export default function ConnectionErrorModal({ isOpen, errorDetails, onRetry, isRetrying }) {
  if (!isOpen) return null;

  // Extraemos los mensajes dinámicos que enviamos desde App.jsx
  const { message, hint } = errorDetails;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-800">
        
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
            <AlertOctagon size={48} strokeWidth={1.5} />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Error de Conexión
          </h2>
          
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            {message}
          </p>

          <div className="flex flex-col items-center gap-2 text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/30 px-3 py-3 rounded-lg w-full justify-center border border-amber-200 dark:border-amber-900/50">
            <div className="flex items-center gap-1 font-semibold mb-1">
              <Terminal size={14} />
              <span>Diagnóstico:</span>
            </div>
            <span className="text-center">{hint}</span>
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-medium transition-all duration-200
              ${isRetrying 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:shadow-md'
              }`}
          >
            <RefreshCw size={20} className={isRetrying ? 'animate-spin' : ''} />
            {isRetrying ? 'Reconectando...' : 'Reintentar Conexión'}
          </button>
        </div>
      </div>
    </div>
  );
}