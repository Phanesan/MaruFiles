import { Film, FileText, CheckCircle, Folder, Image as ImageIcon } from 'lucide-react';

/**
 * @file FileItem.jsx
 * @description Componente ultraligero que representa un archivo o carpeta en la cuadrícula.
 */
export default function FileItem({ file, isSelected, onSelect, onClick }) {
  const isImage = file.type?.startsWith('image/');
  const isVideo = file.type?.startsWith('video/');

  return (
    <div 
      className={`relative p-3 flex flex-col rounded-xl cursor-pointer transition-all border-2 group aspect-square
        ${isSelected ? 'border-accent bg-secondary/20 shadow-md' : 'border-transparent bg-secondary/5 hover:bg-secondary/10 hover:shadow-sm'}`}
      onClick={() => onClick(file)}
    >
      {!file.isSystem && (
        <div 
          className={`absolute top-2 left-2 z-10 transition-opacity duration-200 
            ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          onClick={(e) => { e.stopPropagation(); onSelect(file.id); }}
        >
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center bg-theme
            ${isSelected ? 'bg-accent border-accent' : 'border-secondary hover:border-accent'}`}>
            {isSelected && <CheckCircle size={14} color="white" />}
          </div>
        </div>
      )}

      <div className="flex-1 w-full min-h-0 flex items-center justify-center rounded-lg overflow-hidden bg-black/5 dark:bg-black/20 mb-2 border border-secondary/20 relative">
        {file.isFolder ? (
          <Folder className="text-accent fill-accent/20" size={64} strokeWidth={1.5} />
        ) : (isImage || isVideo) && file.thumbUrl ? (
          <>
            <img src={file.thumbUrl} alt={file.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                <Film className="text-white drop-shadow-md" size={32} />
              </div>
            )}
          </>
        ) : isVideo ? (
          <Film className="text-primary" size={40} strokeWidth={1.5} />
        ) : isImage ? (
          <ImageIcon className="text-primary" size={40} strokeWidth={1.5} />
        ) : (
          <FileText className="text-primary" size={40} strokeWidth={1.5} />
        )}
      </div>

      <p className="text-center text-xs md:text-sm font-medium truncate text-theme px-1 mt-auto" title={file.name}>
        {file.name}
      </p>
    </div>
  );
}