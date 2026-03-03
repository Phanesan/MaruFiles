# MaruFiles: Explorador de Almacenamiento S3

MaruFiles es una aplicación web moderna y completa, desarrollada con React y Vite, que proporciona una interfaz de usuario intuitiva y eficiente para la gestión de archivos en cualquier servicio de almacenamiento de objetos compatible con Amazon S3, como MinIO.

## ✨ Características Principales

- **Navegación de Directorios:** Explore y navegue a través de la estructura de carpetas de su bucket S3 con una interfaz limpia y ágil.
- **Gestión de Archivos y Carpetas:**
    - **Carga:** Suba archivos individuales o estructuras de carpetas completas, con seguimiento del progreso en tiempo real.
    - **Descarga:** Descargue archivos de forma individual o empaquete múltiples archivos y carpetas en un único archivo `.zip` para una descarga masiva y eficiente.
    - **Creación y Eliminación:** Organice su bucket creando nuevas carpetas y eliminando archivos o carpetas de forma segura.
- **Gestión Avanzada de Transferencias:**
    - Un panel centralizado para monitorear todas las subidas y descargas activas.
    - Capacidad para **pausar, reanudar y cancelar** transferencias individuales o en lote.
- **Visualizador de Medios Integrado:** Previsualice archivos de imagen y video directamente en la aplicación sin necesidad de descargarlos.
- **Selección Múltiple:** Realice operaciones por lotes (descarga, eliminación) mediante una cómoda selección de múltiples elementos.
- **Interfaz Adaptable y Moderna:**
    - **Tema Oscuro/Claro:** Cambie entre temas para adaptarse a sus preferencias visuales.
    - **Diseño Responsivo:** Acceda y gestione sus archivos desde cualquier dispositivo, ya sea de escritorio o móvil.
    - Construida con **Tailwind CSS** y un sistema de componentes reutilizables en React.
- **Seguridad:** La comunicación con el bucket S3 se realiza del lado del cliente, utilizando URLs pre-firmadas (`presigned URLs`) con tiempo de expiración para las descargas, garantizando un acceso seguro y controlado.

## 🛠️ Stack Tecnológico

- **Framework Frontend:** [React](https://react.dev/)
- **Herramienta de Build:** [Vite](https://vitejs.dev/)
- **Enrutamiento:** [React Router](https://reactrouter.com/)
- **Estilos CSS:** [Tailwind CSS](https://tailwindcss.com/)
- **SDK de Cliente:** [AWS SDK for JavaScript v3](https://aws.amazon.com/sdk-for-javascript/) (`@aws-sdk/client-s3`)
- **Empaquetado ZIP:** [JSZip](https://stuk.github.io/jszip/)
- **Iconos:** [Lucide React](https://lucide.dev/)

## 📋 Prerrequisitos

- [Node.js](https://nodejs.org/) (versión 18.x o superior)
- [npm](https://www.npmjs.com/) (o un gestor de paquetes compatible)
- Acceso a un bucket de almacenamiento de objetos S3 (AWS S3, MinIO, etc.) con sus respectivas credenciales.

## ⚙️ Configuración del Entorno

Para conectar la aplicación a su bucket S3, cree un archivo `.env` en la raíz del proyecto (`file-manager/.env`) y configure las siguientes variables:

```env
# URL del endpoint de su servicio S3 (Ej. para MinIO local: http://localhost:9000)
VITE_MINIO_ENDPOINT="URL_DE_SU_ENDPOINT"

# Clave de acceso pública de su cuenta S3
VITE_MINIO_ACCESS_KEY="SU_ACCESS_KEY"

# Clave de acceso secreta de su cuenta S3
VITE_MINIO_SECRET_KEY="SU_SECRET_KEY"

# Nombre del bucket al que se conectará la aplicación
VITE_MINIO_BUCKET_NAME="NOMBRE_DEL_BUCKET"
```

## 🚀 Instalación y Ejecución

1.  **Clonar el repositorio:**
    ```bash
    git clone <URL_DEL_REPOSITORIO>
    cd file-manager
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar el archivo `.env`** como se describe en la sección anterior.

4.  **Iniciar el servidor de desarrollo:**
    ```bash
    npm run dev
    ```
    La aplicación estará disponible en `http://localhost:5173` (o el puerto que indique Vite).

## 📜 Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo con Hot-Module Replacement (HMR).
- `npm run build`: Compila la aplicación para producción en el directorio `dist/`.
- `npm run lint`: Ejecuta el linter de ESLint para analizar el código en busca de errores.
- `npm run preview`: Sirve localmente el build de producción para previsualización.
