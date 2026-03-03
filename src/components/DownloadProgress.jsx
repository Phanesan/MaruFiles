import { X, Download, Pause, Play, Trash2, CheckCircle, AlertCircle, Trash } from 'lucide-react';

/**
 * @file DownloadProgress.jsx
 * @description Panel que muestra el progreso de las descargas de archivos.
 * @param {object} props - Propiedades del componente.
 * @param {boolean} props.isOpen - Indica si el panel está abierto.
 * @param {Array} props.downloads - La lista de descargas.
 * @param {function} props.onClose - Función para cerrar el panel.
 * @param {function} props.onPause - Función para pausar una descarga.
 * @param {function} props.onResume - Función para reanudar una descarga.
 * @param {function} props.onCancel - Función para cancelar una descarga.
 * @param {function} props.onPauseAll - Función para pausar todas las descargas.
 * @param {function} props.onResumeAll - Función para reanudar todas las descargas.
 * @param {function} props.onCancelAll - Función para cancelar todas las descargas.
 * @param {function} props.onClearCompleted - Función para limpiar las descargas completadas.
 * @returns {JSX.Element|null} El componente del panel de progreso de descargas.
 */
export default function DownloadProgress({ 
  isOpen, downloads, onClose, onPause, onResume, onCancel, onPauseAll, onResumeAll, onCancelAll, onClearCompleted 
}) {
  if (!isOpen || downloads.length === 0) return null;

  const isAllCompletedOrCancelled = downloads.every(d => d.status === 'completed' || d.status === 'cancelled' || d.status === 'error');
  const hasDownloading = downloads.some(d => d.status === 'downloading');

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-theme border border-secondary shadow-2xl rounded-2xl z-50 animate-zoom-in overflow-hidden flex flex-col max-h-[70vh]">
      
      <div className="bg-secondary/10 px-4 py-3 border-b border-secondary">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold flex items-center gap-2 text-theme">
            <Download size={18} className="text-accent" /> 
            Descargas ({downloads.length})
          </h3>
          <button onClick={onClose} className="text-primary hover:text-red-500 transition-colors bg-theme rounded-full p-1" title="Ocultar panel">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-2 text-xs font-medium">
          {!isAllCompletedOrCancelled ? (
            <>
              {hasDownloading ? (
                <button onClick={onPauseAll} className="flex items-center gap-1 text-primary hover:text-accent bg-theme px-2 py-1 rounded shadow-sm">
                  <Pause size={12} /> Pausar
                </button>
              ) : (
                <button onClick={onResumeAll} className="flex items-center gap-1 text-primary hover:text-accent bg-theme px-2 py-1 rounded shadow-sm">
                  <Play size={12} /> Reanudar
                </button>
              )}
              <button onClick={onCancelAll} className="flex items-center gap-1 text-red-400 hover:text-red-600 bg-theme px-2 py-1 rounded shadow-sm ml-auto">
                <Trash2 size={12} /> Cancelar todo
              </button>
            </>
          ) : (
            <button onClick={onClearCompleted} className="flex items-center gap-1 text-primary hover:text-red-500 bg-theme px-2 py-1 rounded shadow-sm w-full justify-center">
              <Trash size={12} /> Limpiar historial
            </button>
          )}
        </div>
      </div>

      <div className="overflow-y-auto p-4 space-y-4">
        {downloads.map((dl) => (
          <div key={dl.id} className="text-sm bg-theme">
            <div className="flex justify-between items-center mb-1">
              <span className="truncate w-48 text-theme font-medium" title={dl.name}>{dl.name}</span>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-primary font-mono w-10 text-right">
                  {dl.status === 'completed' ? '100%' : dl.status === 'cancelled' || dl.status === 'error' ? 'Error' : `${dl.progress}%`}
                </span>
                
                {dl.status === 'downloading' && (
                  <>
                    <button onClick={() => onPause(dl.id)} className="text-primary hover:text-accent"><Pause size={16}/></button>
                    <button onClick={() => onCancel(dl.id)} className="text-primary hover:text-red-500"><X size={16}/></button>
                  </>
                )}
                {dl.status === 'paused' && (
                  <>
                    <button onClick={() => onResume(dl.id)} className="text-accent hover:text-accent/80"><Play size={16}/></button>
                    <button onClick={() => onCancel(dl.id)} className="text-primary hover:text-red-500"><X size={16}/></button>
                  </>
                )}
                {dl.status === 'completed' && <CheckCircle size={16} className="text-green-500" />}
                {dl.status === 'cancelled' && <AlertCircle size={16} className="text-red-500" title="Cancelada" />}
                {dl.status === 'error' && <AlertCircle size={16} className="text-orange-500" title="Error de red" />}
              </div>
            </div>

            <div className="w-full bg-secondary/30 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  dl.status === 'completed' ? 'bg-green-500' : 
                  dl.status === 'cancelled' || dl.status === 'error' ? 'bg-red-500' : 
                  dl.status === 'paused' ? 'bg-secondary' : 'bg-accent'
                }`}
                style={{ width: `${dl.status === 'cancelled' ? 100 : dl.progress}%` }}
              ></div>
            </div>
            
            {dl.status === 'paused' && <span className="text-[10px] text-primary">Pausado...</span>}
            {dl.status === 'cancelled' && <span className="text-[10px] text-red-500">Descarga cancelada</span>}
          </div>
        ))}
      </div>
    </div>
  );
}