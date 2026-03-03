/**
 * @file mediaUtils.js
 * @description Utilidades para el manejo de medios, como la generación de miniaturas de video.
 */

/**
 * @function generateVideoThumbnail
 * @description Genera una miniatura de un video a partir de su URL.
 * @param {string} videoUrl - La URL del video.
 * @returns {Promise<string|null>} Una promesa que se resuelve con la URL de la miniatura en base64 o null si hay un error.
 */
export const generateVideoThumbnail = (videoUrl) => {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    
    video.crossOrigin = "anonymous"; 
    video.preload = "metadata";
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;

    video.onloadeddata = () => {
      video.currentTime = 1; 
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      } catch (error) {
        console.error("Error generando thumbnail (Revisa el CORS de MinIO):", error);
        resolve(null);
      }
    };

    video.onerror = () => {
      resolve(null);
    };
  });
};