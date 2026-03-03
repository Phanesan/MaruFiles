import { X, UploadCloud, Trash2, CheckCircle, AlertCircle, Trash } from 'lucide-react';

/**
 * @file UploadProgress.jsx
 * @description Panel que muestra el progreso de las subidas de archivos.
 * @param {object} props - Propiedades del componente.
 * @param {boolean} props.isOpen - Indica si el panel está abierto.
 * @param {Array} props.uploads - La lista de subidas.
 * @param {function} props.onClose - Función para cerrar el panel.
 * @param {function} props.onCancel - Función para cancelar una subida.
 * @param {function} props.onCancelAll - Función para cancelar todas las subidas.
 * @param {function} props.onClearCompleted - Función para limpiar las subidas completadas.
 * @returns {JSX.Element|null} El componente del panel de progreso de subidas.
 */
export default function UploadProgress({ 
  isOpen, uploads, onClose, onCancel, onCancelAll, onClearCompleted 
}) {
  if (!isOpen || uploads.length === 0) return null;

  const isAllCompletedOrCancelled = uploads.every(u => u.status === 'completed' || u.status === 'cancelled' || u.status === 'error');

  return (
    <div className="fixed bottom-4 left-4 w-96 bg-theme border border-secondary shadow-2xl rounded-2xl z-50 animate-zoom-in overflow-hidden flex flex-col max-h-[70vh]">
      
      <div className="bg-secondary/10 px-4 py-3 border-b border-secondary">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold flex items-center gap-2 text-theme">
            <UploadCloud size={18} className="text-blue-500" /> 
            Subidas ({uploads.length})
          </h3>
          <button onClick={onClose} className="text-primary hover:text-red-500 transition-colors bg-theme rounded-full p-1" title="Ocultar panel">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-2 text-xs font-medium">
          {!isAllCompletedOrCancelled ? (
            <button onClick={onCancelAll} className="flex items-center gap-1 text-red-400 hover:text-red-600 bg-theme px-2 py-1 rounded shadow-sm w-full justify-center">
              <Trash2 size={12} /> Cancelar todas las subidas
            </button>
          ) : (
            <button onClick={onClearCompleted} className="flex items-center gap-1 text-primary hover:text-red-500 bg-theme px-2 py-1 rounded shadow-sm w-full justify-center">
              <Trash size={12} /> Limpiar historial
            </button>
          )}
        </div>
      </div>

      <div className="overflow-y-auto p-4 space-y-4">
        {uploads.map((up) => (
          <div key={up.id} className="text-sm bg-theme">
            <div className="flex justify-between items-center mb-1">
              <span className="truncate w-48 text-theme font-medium" title={up.name}>{up.name}</span>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-primary font-mono w-10 text-right">
                  {up.status === 'completed' ? '100%' : up.status === 'cancelled' || up.status === 'error' ? 'Error' : `${up.progress}%`}
                </span>
                
                {up.status === 'uploading' && (
                  <button onClick={() => onCancel(up.id)} className="text-primary hover:text-red-500"><X size={16}/></button>
                )}
                {up.status === 'completed' && <CheckCircle size={16} className="text-green-500" />}
                {up.status === 'cancelled' && <AlertCircle size={16} className="text-red-500" title="Cancelada" />}
                {up.status === 'error' && <AlertCircle size={16} className="text-orange-500" title="Error de subida" />}
              </div>
            </div>

            <div className="w-full bg-secondary/30 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  up.status === 'completed' ? 'bg-green-500' : 
                  up.status === 'cancelled' || up.status === 'error' ? 'bg-red-500' : 
                  'bg-blue-500'
                }`}
                style={{ width: `${up.status === 'cancelled' ? 100 : up.progress}%` }}
              ></div>
            </div>
            {up.status === 'cancelled' && <span className="text-[10px] text-red-500">Subida cancelada</span>}
          </div>
        ))}
      </div>
    </div>
  );
}