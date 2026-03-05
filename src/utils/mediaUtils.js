/**
 * @file mediaUtils.js
 * @description Utilidades para el manejo de medios, como la generación de miniaturas de video.
 */

// ==========================================
// 1. GESTOR DE CACHÉ (MEGABYTES)
// ==========================================

const MAX_CACHE_MB = 60; // Límite en Megabytes
const MAX_CACHE_BYTES = MAX_CACHE_MB * 1024 * 1024;
let currentCacheBytes = 0;
const thumbnailCache = new Map();

/**
 * Calcula el tamaño en bytes de una cadena Base64
 */
const getBase64Size = (base64Str) => {
  // Un caracter base64 representa 6 bits. 4 caracteres = 3 bytes.
  let padding = 0;
  if (base64Str.endsWith('==')) padding = 2;
  else if (base64Str.endsWith('=')) padding = 1;
  return (base64Str.length * 0.75) - padding;
};

const addThumbnailToCache = (id, dataUrl) => {
  const size = getBase64Size(dataUrl);

  if (size > MAX_CACHE_BYTES) return;

  while (currentCacheBytes + size > MAX_CACHE_BYTES && thumbnailCache.size > 0) {
    const oldestKey = thumbnailCache.keys().next().value;
    const oldestItem = thumbnailCache.get(oldestKey);
    currentCacheBytes -= oldestItem.size;
    thumbnailCache.delete(oldestKey);
  }

  thumbnailCache.set(id, { dataUrl, size });
  currentCacheBytes += size;
};

export const getCachedThumbnail = (id) => {
  if (thumbnailCache.has(id)) {
    const item = thumbnailCache.get(id);
    thumbnailCache.delete(id);
    thumbnailCache.set(id, item);
    return item.dataUrl;
  }
  return null;
};

/**
 * @function dataUrlToUint8Array
 * @description Convierte una cadena base64 pura a un arreglo de bytes (Uint8Array) compatible con AWS SDK en el navegador.
 */
export const dataUrlToUint8Array = (dataUrl) => {
  const base64 = dataUrl.split(',')[1];
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

/**
 * @function generateVideoThumbnail
 * @description Genera una miniatura de un video a partir de su URL.
 * @param {string} videoUrl - La URL del video.
 * @returns {Promise<string|null>} Una promesa que se resuelve con la URL de la miniatura en base64 o null si hay un error.
 */
export const generateVideoThumbnail = (videoUrl, fileId) => {
  if (fileId) {
    const cached = getCachedThumbnail(fileId);
    if (cached) return Promise.resolve(cached);
  }

  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous"; 
    video.preload = "metadata";
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;

    video.onloadeddata = () => { video.currentTime = 1; };

    video.onseeked = () => {
      try {
        const MAX_WIDTH = 180;
        let width = video.videoWidth;
        let height = video.videoHeight;

        if (width > MAX_WIDTH) {
          height = Math.floor(height * (MAX_WIDTH / width));
          width = MAX_WIDTH;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(video, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
        if (fileId) addThumbnailToCache(fileId, dataUrl);
        resolve(dataUrl);
      } catch (error) {
        console.error("Error generando thumbnail video:", error);
        resolve(null);
      }
    };
    video.onerror = () => resolve(null);
  });
};

/**
 * @function generateImageThumbnail
 * @description Genera una miniatura de una imagen bajando su resolución y usando caché.
 * @param {string} imageUrl - La URL de la imagen.
 * @param {string} fileId - Identificador único.
 * @returns {Promise<string|null>} URL de la miniatura en base64 o null.
 */
export const generateImageThumbnail = (imageUrl, fileId) => {
  if (fileId) {
    const cached = getCachedThumbnail(fileId);
    if (cached) return Promise.resolve(cached);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;

    img.onload = () => {
      try {
        const MAX_WIDTH = 180;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.floor(height * (MAX_WIDTH / width));
          width = MAX_WIDTH;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/webp", 0.6);
        if (fileId) addThumbnailToCache(fileId, dataUrl);
        resolve(dataUrl);
      } catch (error) {
        console.error("Error generando thumbnail imagen:", error);
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
  });
};