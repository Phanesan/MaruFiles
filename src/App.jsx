import { useState, useContext, useEffect, useCallback, useRef } from 'react';
import { ThemeContext } from './context/ThemeContext';
import { Upload, Trash2, Moon, Sun, Download as DownloadIcon, Loader2, CheckSquare, Square, FolderPlus, ChevronRight, Home, FolderUp, Archive, UploadCloud } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import FileItem from './components/FileItem';
import DownloadProgress from './components/DownloadProgress';
import MediaViewer from './components/MediaViewer';
import CreateFolderModal from './components/CreateFolderModal';
import UploadProgress from './components/UploadProgress';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import ConnectionErrorModal from './components/ConnectionErrorModal';
import DiskFullModal from './components/DiskFullModal';
import { generateVideoThumbnail, generateImageThumbnail, dataUrlToUint8Array } from './utils/mediaUtils';

import { s3Client, BUCKET_NAME } from './utils/minioClient';
import { ListObjectsV2Command, PutObjectCommand, DeleteObjectsCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { Upload as S3Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import JSZip from 'jszip';

import logo from '/logo192.ico';

/**
 * @file App.jsx
 * @description Componente principal de la aplicación de gestión de archivos.
 * @version 1.0.0
 * @license MIT
 */

function App() {
  const { isDark, toggleTheme } = useContext(ThemeContext);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPath = searchParams.get('path') || '';
  const previewId = searchParams.get('preview') || null;

  const [files, setFiles] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const dlRefs = useRef({});
  const [isDownloadsOpen, setIsDownloadsOpen] = useState(false);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploads, setUploads] = useState([]);
  const [isUploadsOpen, setIsUploadsOpen] = useState(false);
  const upRefs = useRef({});
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [connectionError, setConnectionError] = useState({ isError: false, message: '', hint: '' });
  const [isRetrying, setIsRetrying] = useState(false);
  const [isDiskFullModalOpen, setIsDiskFullModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);

  /**
   * @function fetchFiles
   * @description Obtiene TODOS los archivos y carpetas, sin importar si son más de 1000.
   */
  const fetchFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      
      let allCommonPrefixes = [];
      let allContents = [];
      let isTruncated = true;
      let continuationToken = undefined;

      // 1. Bucle para traer absolutamente todo de MinIO
      while (isTruncated) {
        const command = new ListObjectsV2Command({ 
          Bucket: BUCKET_NAME,
          Prefix: currentPath, 
          Delimiter: '/',
          ContinuationToken: continuationToken
        });
        
        const response = await s3Client.send(command);
        
        if (response.CommonPrefixes) {
          allCommonPrefixes.push(...response.CommonPrefixes);
        }
        if (response.Contents) {
          allContents.push(...response.Contents);
        }

        isTruncated = response.IsTruncated;
        continuationToken = response.NextContinuationToken;
      }
      
      setConnectionError({ isError: false, message: '', hint: '' });

      // 2. Procesar las carpetas
      const folders = allCommonPrefixes.map(p => ({
        id: p.Prefix,
        name: p.Prefix.replace(currentPath, '').replace('/', ''),
        isFolder: true,
        type: 'folder'
      }));

      // 3. Separar thumbnails y archivos principales
      const thumbItems = allContents.filter(item => item.Key.endsWith('_thumb.webp'));
      const mainItems = allContents.filter(item => !item.Key.endsWith('_thumb.webp') && item.Key !== currentPath);

      // 4. Mapear y firmar URLs
      const fileList = await Promise.all(mainItems.map(async (item) => {
        const getCommand = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: item.Key });
        const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
        
        const ext = item.Key.split('.').pop().toLowerCase();
        let type = 'application/octet-stream';
        if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) type = `image/${ext}`;
        if (['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'].includes(ext)) type = `video/${ext}`;

        const expectedThumbKey = `${item.Key}_thumb.webp`;
        const hasThumb = thumbItems.some(t => t.Key === expectedThumbKey);
        
        let thumbUrl = null;
        if (hasThumb) {
          const thumbCommand = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: expectedThumbKey });
          thumbUrl = await getSignedUrl(s3Client, thumbCommand, { expiresIn: 3600 });
        }

        return {
          id: item.Key,
          name: item.Key.replace(currentPath, ''), 
          type: type,
          url: url,
          thumbUrl: thumbUrl,
          size: item.Size
        };
      }));
      
      setFiles([...folders, ...fileList]);
    } catch (error) {
      // ... (Aquí mantienes tu bloque de manejo de errores idéntico al que ya tenías)
      let uiMessage = "No pudimos establecer conexión con el servidor MinIO.";
      let uiHint = "Revisa la consola (F12) para más detalles técnicos.";

      if (!import.meta.env.VITE_MINIO_ENDPOINT || !import.meta.env.VITE_MINIO_ACCESS_KEY) {
        uiMessage = "Faltan variables de entorno (.env).";
        uiHint = "💡 Pista: Asegúrate de que VITE_MINIO_ENDPOINT y las credenciales existan.";
      } else if (error.name === 'NoSuchBucket') {
        uiMessage = `El bucket "${BUCKET_NAME}" no existe.`;
        uiHint = "💡 Pista: Verifica VITE_MINIO_BUCKET_NAME o ve a la consola de MinIO a crearlo.";
      } else if (error.name === 'InvalidAccessKeyId' || error.name === 'SignatureDoesNotMatch') {
        uiMessage = "Credenciales de acceso incorrectas (Access/Secret Key).";
        uiHint = "💡 Pista: Verifica los valores en tu archivo .env y reinicia el servidor Vite.";
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        uiMessage = "El servidor MinIO es inalcanzable.";
        uiHint = "💡 Pista: El Endpoint es incorrecto, MinIO está apagado o falta configurar CORS.";
      }

      setConnectionError({ isError: true, message: uiMessage, hint: uiHint });
      console.error("🔴 [MaruFiles] Error Crítico:", error);
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  }, [currentPath]);

  useEffect(() => {
    fetchFiles();
    setSelectedIds([]); 
  }, [fetchFiles]);

  useEffect(() => {
    if (previewId && files.length > 0) {
      const fileToPreview = files.find(f => f.id === previewId);
      if (fileToPreview && !fileToPreview.isFolder) {
        setMediaPreview(fileToPreview);
      }
    }
  }, [previewId, files]);

  /**
   * @function finalizeCreateFolder
   * @description Crea una nueva carpeta en el bucket de S3.
   * @param {string} folderName - El nombre de la carpeta a crear.
   * @returns {void}
   */
  const finalizeCreateFolder = async (folderName) => {
    try {
      setIsLoading(true);
      const folderKey = `${currentPath}${folderName}/`;
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: folderKey,
        Body: new Uint8Array(0),
      });
      await s3Client.send(command);
      
      setIsFolderModalOpen(false);
      fetchFiles();
    } catch (err) {
      console.error("Error al crear carpeta", err);
    } finally {
        setIsLoading(false);
    }
  };

  /**
   * @function handleFileUpload
   * @description Sube archivos al bucket de S3 con seguimiento del progreso.
   * @param {Event} e - El evento del input de tipo archivo.
   * @returns {void}
   */
  const handleFileUpload = async (e) => {
    const uploadedFiles = Array.from(e.target.files);
    if (uploadedFiles.length === 0) return;
    
    setIsUploadsOpen(true);

    for (const file of uploadedFiles) {
      const upId = Math.random().toString(36).substring(2, 9);
      const newUp = { id: upId, name: file.name, progress: 0, status: 'uploading' };
      setUploads(prev => [...prev, newUp]);

      try {
        // --- PREPARAR THUMBNAIL ANTES DE SUBIR ---
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        let thumbBlob = null;

        if (isImage || isVideo) {
          const objectUrl = URL.createObjectURL(file);
          const thumbDataUrl = isImage 
            ? await generateImageThumbnail(objectUrl) 
            : await generateVideoThumbnail(objectUrl);
            
          if (thumbDataUrl) {
            thumbBlob = await dataUrlToUint8Array(thumbDataUrl);
          }
          URL.revokeObjectURL(objectUrl);
        }

        // --- SUBIR ARCHIVO PRINCIPAL ---
        const uploadTask = new S3Upload({
          client: s3Client,
          params: {
            Bucket: BUCKET_NAME,
            Key: `${currentPath}${file.name}`,
            Body: file,
            ContentType: file.type,
          },
        });

        upRefs.current[upId] = uploadTask;

        uploadTask.on("httpUploadProgress", (p) => {
          if (p.total) {
            const progress = Math.round((p.loaded / p.total) * 100);
            setUploads(prev => prev.map(u => u.id === upId ? { ...u, progress } : u));
          }
        });

        await uploadTask.done();

        if (thumbBlob) {
          const thumbUploadTask = new S3Upload({
            client: s3Client,
            params: {
              Bucket: BUCKET_NAME,
              Key: `${currentPath}${file.name}_thumb.webp`,
              Body: thumbBlob,
              ContentType: 'image/webp',
            },
          });
          await thumbUploadTask.done();
        }

        setUploads(prev => prev.map(u => u.id === upId ? { ...u, progress: 100, status: 'completed' } : u));
      } catch (err) {
        const isDiskFull = 
          err.$metadata?.httpStatusCode === 507 || 
          err.name === 'XMinioStorageFull' || 
          (err.message && (err.message.toLowerCase().includes('space') || err.message.toLowerCase().includes('storage full')));

        if (isDiskFull) {
          console.error("🔴 ERROR CRÍTICO: El disco del servidor MinIO está lleno.");
          setIsDiskFullModalOpen(true);
          setUploads(prev => prev.map(u => u.id === upId ? { ...u, status: 'error' } : u));
          break; 
        } 
        
        else if (err.name === 'AbortError' || err.message?.includes('aborted')) {
          setUploads(prev => prev.map(u => u.id === upId ? { ...u, status: 'cancelled' } : u));
        } else {
          console.error("Error de subida:", err);
          setUploads(prev => prev.map(u => u.id === upId ? { ...u, status: 'error' } : u));
        }
      }
    }
    fetchFiles(); 
  };

  const handleRetryConnection = () => {
    setIsRetrying(true);
    fetchFiles();
  };

  /**
   * @function handleFolderUpload
   * @description Sube carpetas completas al bucket de S3 con seguimiento del progreso.
   * @param {Event} e - El evento del input de tipo archivo.
   * @returns {void}
   */
  const handleFolderUpload = async (e) => {
    const uploadedFiles = Array.from(e.target.files);
    if (uploadedFiles.length === 0) return;
    
    setIsUploadsOpen(true);

    for (const file of uploadedFiles) {
      const filePath = file.webkitRelativePath || file.name;
      const upId = Math.random().toString(36).substring(2, 9);
      const newUp = { id: upId, name: filePath, progress: 0, status: 'uploading' };
      
      setUploads(prev => [...prev, newUp]);

      try {
        const uploadTask = new S3Upload({
          client: s3Client,
          params: {
            Bucket: BUCKET_NAME,
            Key: `${currentPath}${filePath}`,
            Body: file,
            ContentType: file.type,
          },
        });

        upRefs.current[upId] = uploadTask;

        uploadTask.on("httpUploadProgress", (p) => {
          if (p.total) {
            const progress = Math.round((p.loaded / p.total) * 100);
            setUploads(prev => prev.map(u => u.id === upId ? { ...u, progress } : u));
          }
        });

        await uploadTask.done();
        setUploads(prev => prev.map(u => u.id === upId ? { ...u, progress: 100, status: 'completed' } : u));
      } catch (err) {
        const isDiskFull = 
          err.$metadata?.httpStatusCode === 507 || 
          err.name === 'XMinioStorageFull' || 
          (err.message && (err.message.toLowerCase().includes('space') || err.message.toLowerCase().includes('storage full')));

        if (isDiskFull) {
          console.error("🔴 ERROR CRÍTICO: El disco del servidor MinIO está lleno.");
          setIsDiskFullModalOpen(true);
          setUploads(prev => prev.map(u => u.id === upId ? { ...u, status: 'error' } : u));
          break; 
        } 

        else if (err.name === 'AbortError' || err.message?.includes('aborted')) {
          setUploads(prev => prev.map(u => u.id === upId ? { ...u, status: 'cancelled' } : u));
        } else {
          console.error("Error de subida:", err);
          setUploads(prev => prev.map(u => u.id === upId ? { ...u, status: 'error' } : u));
        }
      }
    }
    fetchFiles(); 
  };

  /**
   * @function cancelUpload
   * @description Cancela una subida en progreso.
   * @param {string} id - El ID de la subida a cancelar.
   * @returns {void}
   */
  const cancelUpload = (id) => {
    if (upRefs.current[id]) upRefs.current[id].abort();
  };
  const cancelAllUploads = () => uploads.forEach(u => { if (u.status === 'uploading') cancelUpload(u.id); });
  const clearCompletedUploads = () => setUploads(prev => prev.filter(u => u.status === 'uploading'));

  const runThumbnailMigration = async () => {
    if (!window.confirm("¿Iniciar migración de thumbnails? Esto analizará todo tu bucket.")) return;
    setIsLoading(true);

    try {
      let allKeys = [];
      let isTruncated = true;
      let token = undefined;
      
      while (isTruncated) {
        const cmd = new ListObjectsV2Command({ Bucket: BUCKET_NAME, ContinuationToken: token });
        const res = await s3Client.send(cmd);
        if (res.Contents) allKeys.push(...res.Contents.map(c => c.Key));
        isTruncated = res.IsTruncated;
        token = res.NextContinuationToken;
      }

      const mediaKeys = allKeys.filter(key => {
        if (key.endsWith('_thumb.webp') || key.endsWith('/')) return false;
        const ext = key.split('.').pop().toLowerCase();
        return ['png', 'jpg', 'jpeg', 'webp', 'gif', 'mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'].includes(ext);
      });

      let processed = 0;

      for (const key of mediaKeys) {
        const thumbKey = `${key}_thumb.webp`;
        
        if (allKeys.includes(thumbKey)) continue;

        console.log(`Generando thumbnail para: ${key}...`);
        
        const getCmd = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
        const url = await getSignedUrl(s3Client, getCmd, { expiresIn: 3600 });
        
        const ext = key.split('.').pop().toLowerCase();
        const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext);

        const thumbDataUrl = isImage 
          ? await generateImageThumbnail(url)
          : await generateVideoThumbnail(url);

        if (thumbDataUrl) {
          const thumbBlob = await dataUrlToUint8Array(thumbDataUrl);
          
          const uploadCmd = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: thumbKey,
            Body: thumbBlob,
            ContentType: 'image/webp'
          });
          
          await s3Client.send(uploadCmd);
          processed++;
        }
      }

      alert(`¡Migración completada! Se crearon ${processed} thumbnails nuevos.`);
    } catch (error) {
      console.error("Error en la migración:", error);
      alert("Hubo un error en la migración. Revisa la consola.");
    } finally {
      setIsLoading(false);
      fetchFiles(); 
    }
  };

  /**
   * @function executeDelete
   * @description Elimina los archivos y carpetas seleccionados, limpiando thumbnails huérfanos.
   */
  const executeDelete = async () => {
    try {
      setIsLoading(true);
      let keysToDelete = [];

      for (const id of selectedIds) {
        const selectedItem = files.find(f => f.id === id);
        if (!selectedItem) continue;

        if (selectedItem.isFolder) {
          let isTruncated = true;
          let continuationToken = undefined;
          
          while (isTruncated) {
            const command = new ListObjectsV2Command({
              Bucket: BUCKET_NAME,
              Prefix: selectedItem.id, 
              ContinuationToken: continuationToken
            });
            const response = await s3Client.send(command);
            
            if (response.Contents) {
              for (const item of response.Contents) {
                // Al borrar una carpeta, se lleva TODO adentro, incluyendo los _thumb.webp
                keysToDelete.push({ Key: item.Key });
              }
            }
            isTruncated = response.IsTruncated;
            continuationToken = response.NextContinuationToken;
          }
        } else {
          // Agregar el archivo principal
          keysToDelete.push({ Key: selectedItem.id });
          
          // --- NUEVO: Si tiene thumbnail asociado, borrarlo también ---
          if (selectedItem.thumbUrl) {
            keysToDelete.push({ Key: `${selectedItem.id}_thumb.webp` });
          }
        }
      }

      if (keysToDelete.length === 0) {
        setIsLoading(false);
        return;
      }

      const chunkSize = 1000;
      for (let i = 0; i < keysToDelete.length; i += chunkSize) {
        const chunk = keysToDelete.slice(i, i + chunkSize);
        
        const deleteCommand = new DeleteObjectsCommand({
          Bucket: BUCKET_NAME,
          Delete: { Objects: chunk, Quiet: true }
        });
        
        await s3Client.send(deleteCommand);
      }

      setSelectedIds([]);
      fetchFiles(); 
    } catch (err) {
      console.error("Error al eliminar:", err);
      alert("Hubo un error al eliminar algunos archivos.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * @function toggleSelection
   * @description Agrega o elimina un archivo de la lista de seleccionados.
   * @param {string} id - El ID del archivo a seleccionar/deseleccionar.
   * @returns {void}
   */
  const toggleSelection = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  /**
   * @function handleSelectAll
   * @description Selecciona o deselecciona todos los archivos de la lista.
   * @returns {void}
   */
  const handleSelectAll = () => {
    if (selectedIds.length === files.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(files.map(f => f.id));
    }
  };

  /**
   * @function openPreview
   * @description Abre el visor de medios para el archivo seleccionado.
   * @param {object} file - El archivo a previsualizar.
   * @returns {void}
   */
  const openPreview = (file) => {
    setMediaPreview(file);
    setSearchParams(prev => { prev.set('preview', file.id); return prev; });
  };

  /**
   * @function closePreview
   * @description Cierra el visor de medios.
   * @returns {void}
   */
  const closePreview = () => {
    setMediaPreview(null);
    setSearchParams(prev => { prev.delete('preview'); return prev; });
  };

  /**
   * @function resolveSelectedFiles
   * @description Obtiene la lista de archivos a descargar, resolviendo el contenido de las carpetas.
   * @returns {Promise<Array<object>>} - La lista de archivos a descargar.
   */
  const resolveSelectedFiles = async () => {
    let filesToDownload = [];
    
    for (const id of selectedIds) {
      const selectedItem = files.find(f => f.id === id);
      if (!selectedItem) continue;

      if (selectedItem.isFolder) {
        let isTruncated = true;
        let continuationToken = undefined;
        
        while (isTruncated) {
          const command = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Prefix: selectedItem.id,
            ContinuationToken: continuationToken
          });
          const response = await s3Client.send(command);
          
          if (response.Contents) {
            for (const item of response.Contents) {
              if (item.Key.endsWith('/')) continue;
              
              const getCommand = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: item.Key });
              const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
              
              filesToDownload.push({
                id: item.Key,
                name: item.Key.replace(currentPath, ''),
                url: url,
                size: item.Size
              });
            }
          }
          isTruncated = response.IsTruncated;
          continuationToken = response.NextContinuationToken;
        }
      } else {
        filesToDownload.push(selectedItem);
      }
    }
    return filesToDownload;
  };

  /**
   * @function handleIndividualDownload
   * @description Inicia la descarga individual de los archivos seleccionados.
   * @returns {void}
   */
  const handleIndividualDownload = async () => {
    setIsDownloadsOpen(true);
    setIsLoading(true);
    const filesToDownload = await resolveSelectedFiles();
    setIsLoading(false);
    
    if (filesToDownload.length === 0) return;

    filesToDownload.forEach(file => {
      const dlId = Math.random().toString(36).substring(2, 9);
      const cleanFileName = file.name.split('/').pop(); 
      
      const newDl = { id: dlId, name: cleanFileName, progress: 0, status: 'downloading', url: file.url };
      setDownloads(prev => [...prev, newDl]);

      const controller = new AbortController();
      dlRefs.current[dlId] = { controller, isPaused: false, resolvePause: null };
      startRealDownload(newDl, controller, dlId);
    });
    
    setSelectedIds([]);
  };

  /**
   * @function handleZipDownload
   * @description Inicia la descarga de los archivos seleccionados como un archivo ZIP.
   * @returns {void}
   */
  const handleZipDownload = async () => {
    setIsDownloadsOpen(true);
    setIsLoading(true);
    const filesToDownload = await resolveSelectedFiles();
    setIsLoading(false);
    
    if (filesToDownload.length === 0) return;

    setSelectedIds([]);

    const dlId = Math.random().toString(36).substring(2, 9);
    const zipName = 'MaruFiles_Descarga.zip';
    const newDl = { id: dlId, name: zipName, progress: 0, status: 'downloading', isZip: true };
    
    setDownloads(prev => [...prev, newDl]);

    try {
      const zip = new JSZip();
      let totalBytes = filesToDownload.reduce((acc, f) => acc + (f.size || 0), 0);
      let loadedBytes = 0;

      for (const file of filesToDownload) {
        const response = await fetch(file.url);
        const blob = await response.blob();
        zip.file(file.name, blob);
        
        loadedBytes += (file.size || blob.size);
        const progress = Math.round((loadedBytes / totalBytes) * 50);
        setDownloads(prev => prev.map(d => d.id === dlId ? { ...d, progress } : d));
      }

      const zipContent = await zip.generateAsync({ type: 'blob', streamFiles: true }, (metadata) => {
        const progress = 50 + Math.round(metadata.percent / 2);
        setDownloads(prev => prev.map(d => d.id === dlId ? { ...d, progress } : d));
      });

      const blobUrl = window.URL.createObjectURL(zipContent);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = zipName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);

      setDownloads(prev => prev.map(d => d.id === dlId ? { ...d, progress: 100, status: 'completed' } : d));
    } catch (error) {
      console.error("Error creando ZIP:", error);
      setDownloads(prev => prev.map(d => d.id === dlId ? { ...d, status: 'error' } : d));
    }
  };

  /**
   * @function startRealDownload
   * @description Inicia la descarga real de un archivo con soporte para pausa y reanudación.
   * @param {object} dl - El objeto de descarga.
   * @param {AbortController} controller - El controlador para abortar la descarga.
   * @param {string} dlId - El ID de la descarga.
   * @returns {void}
   */
  const startRealDownload = async (dl, controller, dlId) => {
    try {
      const response = await fetch(dl.url, { signal: controller.signal });
      if (!response.ok) throw new Error("Error en la red");

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      let loaded = 0;

      const reader = response.body.getReader();
      const chunks = [];

      while (true) {
        const ref = dlRefs.current[dlId];
        if (ref && ref.isPaused) {
          await new Promise(resolve => { ref.resolvePause = resolve; });
        }

        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        loaded += value.length;

        if (total) {
          const progress = Math.round((loaded / total) * 100);
          setDownloads(prev => prev.map(d => d.id === dlId ? { ...d, progress } : d));
        }
      }

      const blob = new Blob(chunks);
      const blobUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = dl.name;
      document.body.appendChild(a);
      a.click();
      
      a.remove();
      window.URL.revokeObjectURL(blobUrl);

      setDownloads(prev => prev.map(d => d.id === dlId ? { ...d, progress: 100, status: 'completed' } : d));

    } catch (error) {
      if (error.name === 'AbortError') {
        setDownloads(prev => prev.map(d => d.id === dlId ? { ...d, status: 'cancelled' } : d));
      } else {
        console.error("Fallo la descarga:", error);
        setDownloads(prev => prev.map(d => d.id === dlId ? { ...d, status: 'error' } : d));
      }
    }
  };

  /**
   * @function pauseDownload
   * @description Pausa una descarga en progreso.
   * @param {string} id - El ID de la descarga a pausar.
   * @returns {void}
   */
  const pauseDownload = (id) => {
    const ref = dlRefs.current[id];
    if (ref) ref.isPaused = true;
    setDownloads(prev => prev.map(d => d.id === id ? { ...d, status: 'paused' } : d));
  };

  /**
   * @function resumeDownload
   * @description Reanuda una descarga pausada.
   * @param {string} id - El ID de la descarga a reanudar.
   * @returns {void}
   */
  const resumeDownload = (id) => {
    const ref = dlRefs.current[id];
    if (ref) {
      ref.isPaused = false;
      if (ref.resolvePause) ref.resolvePause();
    }
    setDownloads(prev => prev.map(d => d.id === id ? { ...d, status: 'downloading' } : d));
  };

  /**
   * @function cancelDownload
   * @description Cancela una descarga en progreso.
   * @param {string} id - El ID de la descarga a cancelar.
   * @returns {void}
   */
  const cancelDownload = (id) => {
    const ref = dlRefs.current[id];
    if (ref) {
      ref.controller.abort();
      if (ref.isPaused && ref.resolvePause) {
         ref.resolvePause();
      }
    }
    setDownloads(prev => prev.map(d => d.id === id ? { ...d, status: 'cancelled' } : d));
  };

  const pauseAll = () => downloads.forEach(d => { if (d.status === 'downloading') pauseDownload(d.id); });
  const resumeAll = () => downloads.forEach(d => { if (d.status === 'paused') resumeDownload(d.id); });
  const cancelAll = () => downloads.forEach(d => { if (d.status === 'downloading' || d.status === 'paused') cancelDownload(d.id); });
  const clearCompletedDownloads = () => setDownloads(prev => prev.filter(d => d.status === 'downloading' || d.status === 'paused'));

  const pathParts = currentPath.split('/').filter(Boolean);

  return (
    <div className="min-h-screen bg-theme text-theme p-4 md:p-8">
      <header className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        
        <div className="flex items-center gap-2 text-accent transition-transform hover:scale-105 cursor-default">
          <img src={logo} alt='MaruFiles' style={{ width: '80px'}}></img>
          <h1 className="text-2xl font-bold tracking-tight">MaruFiles</h1>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center justify-center">
          <button onClick={runThumbnailMigration} hidden className="text-white bg-red-500 px-4 py-2 rounded">Migrar DB</button>

          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-secondary/20 text-primary transition-colors duration-300">
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="flex gap-1 bg-secondary/10 rounded-full p-1 border border-secondary/20">
            <button 
              onClick={() => setIsUploadsOpen(!isUploadsOpen)}
              className="relative p-2 rounded-full hover:bg-theme text-primary transition-colors"
              title="Ver subidas"
            >
              <UploadCloud size={20} />
              {uploads.filter(u => u.status === 'uploading').length > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full animate-pulse">
                  {uploads.filter(u => u.status === 'uploading').length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setIsDownloadsOpen(!isDownloadsOpen)}
              className="relative p-2 rounded-full hover:bg-theme text-primary transition-colors"
              title="Ver descargas"
            >
              <DownloadIcon size={20} />
              {downloads.filter(d => d.status === 'downloading').length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full animate-pulse">
                  {downloads.filter(d => d.status === 'downloading').length}
                </span>
              )}
            </button>
          </div>
          
          <button 
            onClick={() => setIsFolderModalOpen(true)} 
            className="bg-secondary/10 text-theme border border-secondary/20 px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 cursor-pointer hover:bg-accent/10 hover:text-accent hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/20 active:translate-y-0 active:shadow-none"
          >
            <FolderPlus size={18} /> <span className="hidden sm:inline">Nueva Carpeta</span>
          </button>

          <label className="bg-indigo-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 cursor-pointer hover:bg-indigo-600 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/40 active:translate-y-0 active:shadow-none">
            <FolderUp size={18} />
            <span className="hidden sm:inline">Subir Carpeta</span>
            <input type="file" webkitdirectory="true" directory="true" multiple className="hidden" onChange={handleFolderUpload} />
          </label>

          <label className="bg-accent text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 cursor-pointer hover:bg-accent/90 hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/40 active:translate-y-0 active:shadow-none">
            <Upload size={18} />
            <span className="hidden sm:inline">Subir Archivos</span>
            <input type="file" multiple className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      </header>

      <div className="flex items-center gap-2 mb-6 text-sm font-medium overflow-x-auto pb-2 border-b border-secondary/30">
        <button 
          onClick={() => setSearchParams({ path: '' })}
          className={`flex items-center gap-1 hover:text-accent transition-colors ${currentPath === '' ? 'text-accent' : 'text-primary'}`}
        >
          <Home size={18} /> Raíz
        </button>
        
        {pathParts.map((part, index) => {
          const routeToHere = pathParts.slice(0, index + 1).join('/') + '/';
          return (
            <div key={routeToHere} className="flex items-center gap-2">
              <ChevronRight size={16} className="text-secondary" />
              <button 
                onClick={() => setSearchParams({ path: routeToHere })}
                className={`hover:text-accent transition-colors truncate max-w-[120px] ${currentPath === routeToHere ? 'text-accent' : 'text-primary'}`}
              >
                {part}
              </button>
            </div>
          );
        })}
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-secondary/20 border border-secondary rounded-lg p-3 mb-6 flex flex-wrap gap-4 items-center animate-fade-in shadow-lg">
          
          <button onClick={handleSelectAll} className="flex items-center gap-2 text-theme hover:text-accent font-medium transition-colors">
            {selectedIds.length === files.length ? <CheckSquare size={20} /> : <Square size={20} />}
            <span className="hidden sm:inline">{selectedIds.length === files.length ? 'Deseleccionar' : 'Seleccionar todo'}</span>
          </button>
          
          <div className="w-px h-6 bg-secondary/50 mx-2 hidden sm:block"></div>
          <span className="font-semibold text-accent">{selectedIds.length} seleccionados</span>
          
          <div className="flex gap-2 ml-auto">
            <button 
              onClick={handleIndividualDownload} 
              className="flex items-center gap-2 bg-theme border border-secondary text-primary hover:text-accent hover:border-accent px-3 py-1.5 rounded-lg transition-all shadow-sm"
              title="Descargar archivos por separado"
            >
              <DownloadIcon size={18} /> <span className="hidden md:inline">Descargar</span>
            </button>

            <button 
              onClick={handleZipDownload} 
              className="flex items-center gap-2 bg-accent text-white hover:bg-accent/90 px-3 py-1.5 rounded-lg transition-all shadow-md"
              title="Empaquetar y descargar como ZIP"
            >
              <Archive size={18} /> <span className="hidden md:inline">Descargar ZIP</span>
            </button>
            
            <button 
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-all"
            >
              <Trash2 size={18} /> <span className="hidden md:inline">Eliminar</span>
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 h-64 border-2 border-dashed border-secondary/50 rounded-2xl bg-secondary/5">
          <Loader2 size={48} className="animate-spin text-accent mb-4" />
          <h2 className="text-xl font-semibold text-theme">Cargando...</h2>
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 h-64 border-2 border-dashed border-secondary/50 rounded-2xl bg-secondary/5">
          <div className="bg-secondary/20 p-4 rounded-full mb-4">
            <FolderPlus size={32} className="text-accent" />
          </div>
          <h2 className="text-xl font-semibold text-theme">Carpeta Vacía</h2>
          <p className="text-sm text-primary mt-2">Sube archivos o crea una nueva carpeta aquí</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {files.map(file => (
            <FileItem 
              key={file.id} 
              file={file} 
              isSelected={selectedIds.includes(file.id)}
              onSelect={toggleSelection}
              onClick={(f) => {
                if (selectedIds.length > 0) {
                  toggleSelection(f.id);
                } else {
                  if (f.isFolder) {
                    setSearchParams({ path: f.id });
                  } else if (f.type.startsWith('image/') || f.type.startsWith('video/')) {
                    openPreview(f);
                  }
                }
              }}
            />
          ))}
        </div>
      )}

      <MediaViewer file={mediaPreview} onClose={closePreview} />
      <DownloadProgress 
        isOpen={isDownloadsOpen}
        downloads={downloads} 
        onClose={() => setIsDownloadsOpen(false)} 
        onPause={pauseDownload}
        onResume={resumeDownload}
        onCancel={cancelDownload}
        onPauseAll={pauseAll}
        onResumeAll={resumeAll}
        onCancelAll={cancelAll}
        onClearCompleted={clearCompletedDownloads}
      />
      <UploadProgress 
        isOpen={isUploadsOpen}
        uploads={uploads} 
        onClose={() => setIsUploadsOpen(false)} 
        onCancel={cancelUpload}
        onCancelAll={cancelAllUploads}
        onClearCompleted={clearCompletedUploads}
      />
      <ConfirmDeleteModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={executeDelete}
        count={selectedIds.length}
      />
      <CreateFolderModal 
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onCreate={finalizeCreateFolder}
      />
      <ConnectionErrorModal 
        isOpen={connectionError.isError} 
        errorDetails={connectionError}
        onRetry={handleRetryConnection} 
        isRetrying={isRetrying} 
      />
      <DiskFullModal 
        isOpen={isDiskFullModalOpen} 
        onClose={() => setIsDiskFullModalOpen(false)} 
      />
    </div>
  );
}

export default App;