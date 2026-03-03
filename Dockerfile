FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_MINIO_ENDPOINT
ARG VITE_MINIO_ACCESS_KEY
ARG VITE_MINIO_SECRET_KEY
ARG VITE_MINIO_BUCKET_NAME

ENV VITE_MINIO_ENDPOINT=$VITE_MINIO_ENDPOINT
ENV VITE_MINIO_ACCESS_KEY=$VITE_MINIO_ACCESS_KEY
ENV VITE_MINIO_SECRET_KEY=$VITE_MINIO_SECRET_KEY
ENV VITE_MINIO_BUCKET_NAME=$VITE_MINIO_BUCKET_NAME

COPY package.json package-lock.json ./

RUN npm install

COPY . .

RUN npm run build

FROM nginx:stable-alpine

COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]