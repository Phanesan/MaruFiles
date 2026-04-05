import React, { useState } from 'react';
import { X, Folder, FolderInput, Check, FolderOpen } from 'lucide-react';
import { s3Client, BUCKET_NAME } from '../utils/minioClient';
import { ListObjectsV2Command } from "@aws-sdk/client-s3";

/**
 * @file MoveModal.jsx
 * @description Modal de árbol de directorios recursivo (Tree View) con diseño de líneas punteadas.
 */
const treeViewStyles = `
  ul.tree-ul {
    list-style-type: none;
    padding-left: 24px;
    margin: 0;
    position: relative;
  }
  
  ul.tree-root {
    padding-left: 0;
  }

  li.tree-li {
    position: relative;
    margin: 0;
    padding-top: 2px;
    padding-bottom: 2px;
  }

  li.tree-li::before {
    content: '';
    position: absolute;
    top: -4px;
    bottom: 0;
    left: -12px;
    border-left: 1px dotted #888;
  }

  li.tree-li::after {
    content: '';
    position: absolute;
    top: 16px;
    left: -12px;
    width: 12px;
    border-top: 1px dotted #888;
  }

  li.tree-li:last-child::before {
    bottom: auto;
    height: 20px;
  }

  ul.tree-root > li.tree-li::before,
  ul.tree-root > li.tree-li::after {
    display: none;
  }

  .dark li.tree-li::before,
  .dark li.tree-li::after {
    border-color: #666;
  }
`;

const FolderTreeItem = ({ prefix, name, currentSelected, onSelect, disablePrefixes }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasBeenFetched, setHasBeenFetched] = useState(false);
  
  const isDisabled = disablePrefixes.some(disabledPref => prefix.startsWith(disabledPref));
  const isSelected = currentSelected === prefix;

  const handleRowClick = async (e) => {
    e.stopPropagation();
    if (isDisabled) return;

    onSelect(prefix);

    if (isExpanded && isSelected) {
      setIsExpanded(false);
      return;
    }

    if (!hasBeenFetched) {
      setIsLoading(true);
      try {
        const command = new ListObjectsV2Command({
          Bucket: BUCKET_NAME,
          Prefix: prefix,
          Delimiter: '/'
        });
        const response = await s3Client.send(command);
        
        if (response.CommonPrefixes) {
          const folders = response.CommonPrefixes.map(p => ({
            prefix: p.Prefix,
            name: p.Prefix.replace(prefix, '').replace('/', '')
          }));
          setChildren(folders);
        }
        setHasBeenFetched(true);
      } catch (error) {
        console.error("Error cargando subcarpetas:", error);
      } finally {
        setIsLoading(false);
      }
    }

    setIsExpanded(true);
  };

  return (
    <li className="tree-li">
      <div 
        onClick={handleRowClick}
        className={`flex items-center gap-2 px-2 h-8 rounded-lg cursor-pointer transition-colors select-none
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-secondary/10'}
          ${isSelected && !isDisabled ? 'bg-accent/10 text-accent' : 'text-primary'}`}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin ml-1" />
        ) : isExpanded ? (
          <FolderOpen size={18} className={isSelected && !isDisabled ? "text-accent fill-accent/20" : "text-secondary fill-secondary/20"} />
        ) : (
          <Folder size={18} className={isSelected && !isDisabled ? "text-accent fill-accent/20" : "text-secondary fill-secondary/20"} />
        )}
        <span className="truncate font-medium text-sm flex-1">{name}</span>
      </div>
      
      {isExpanded && !isDisabled && children.length > 0 && (
        <ul className="tree-ul">
          {children.map(child => (
            <FolderTreeItem 
              key={child.prefix} 
              prefix={child.prefix} 
              name={child.name} 
              currentSelected={currentSelected} 
              onSelect={onSelect}
              disablePrefixes={disablePrefixes}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export default function MoveModal({ isOpen, onClose, onConfirm, selectedFiles }) {
  const [selectedDestination, setSelectedDestination] = useState('');
  
  const foldersBeingMoved = selectedFiles
    .filter(f => f.isFolder)
    .map(f => f.id);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      
      <style>{treeViewStyles}</style>
      
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh] border border-gray-100 dark:border-gray-800">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between p-5 border-b border-secondary/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
              <FolderInput size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-theme">Mover {selectedFiles.length} elemento(s)</h2>
              <p className="text-xs text-secondary">Selecciona la carpeta de destino</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary/10 text-secondary transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo (Árbol) */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          
          <ul className="tree-ul tree-root">
            {/* Nodo Raíz Fijo */}
            <li className="tree-li">
              <div 
                onClick={() => setSelectedDestination('')}
                className={`flex items-center gap-2 px-2 h-8 rounded-lg cursor-pointer transition-colors select-none mb-1
                  ${selectedDestination === '' ? 'bg-accent/10 text-accent' : 'hover:bg-secondary/10 text-primary'}`}
              >
                <FolderOpen size={20} className={selectedDestination === '' ? "text-accent fill-accent/20" : "text-secondary fill-secondary/20"} />
                <span className="font-bold text-sm">Raíz de MaruFiles</span>
              </div>
              
              {/* Contenido partiendo desde la raíz */}
              <ul className="tree-ul">
                <FolderTreeItem 
                  prefix="" 
                  name="Explorar carpetas..." 
                  currentSelected={selectedDestination} 
                  onSelect={setSelectedDestination}
                  disablePrefixes={foldersBeingMoved}
                />
              </ul>
            </li>
          </ul>

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-secondary/20 flex justify-end gap-3 bg-secondary/5 rounded-b-2xl">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-medium text-primary hover:bg-secondary/20 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={() => onConfirm(selectedDestination)}
            className="flex items-center gap-2 px-6 py-2 rounded-lg font-medium bg-accent text-white hover:bg-accent/90 transition-transform active:scale-95 shadow-lg shadow-accent/30"
          >
            <Check size={18} />
            Mover aquí
          </button>
        </div>
      </div>
    </div>
  );
}