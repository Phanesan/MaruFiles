# Etapa 1: Construir la aplicación React
FROM node:20-alpine AS build

WORKDIR /app

# Declarar los argumentos que se recibirán desde docker-compose
ARG VITE_MINIO_ENDPOINT
ARG VITE_MINIO_ACCESS_KEY
ARG VITE_MINIO_SECRET_KEY
ARG VITE_MINIO_BUCKET_NAME

# Establecer las variables de entorno para el proceso de build
ENV VITE_MINIO_ENDPOINT=$VITE_MINIO_ENDPOINT
ENV VITE_MINIO_ACCESS_KEY=$VITE_MINIO_ACCESS_KEY
ENV VITE_MINIO_SECRET_KEY=$VITE_MINIO_SECRET_KEY
ENV VITE_MINIO_BUCKET_NAME=$VITE_MINIO_BUCKET_NAME

COPY package.json package-lock.json ./
RUN npm install

COPY . .
# El comando build de Vite usará las variables de entorno para generar los archivos estáticos
RUN npm run build

# Etapa 2: Servir la aplicación con Nginx
FROM nginx:stable-alpine

# Copiar los archivos estáticos generados en la etapa anterior
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar el archivo de configuración de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto 80 que es el que usa Nginx por defecto
EXPOSE 80

# Comando para iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
