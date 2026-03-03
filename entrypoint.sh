#!/bin/sh
# Detiene la ejecución si un comando falla
set -e

# Instala las dependencias cada vez que el contenedor inicia.
# Esto asegura que node_modules exista después de que Coolify monte el código.
echo "Running npm install..."
npm install

# Una vez instaladas las dependencias, ejecuta el comando principal que se le pase
# (en nuestro caso, el CMD del Dockerfile)
echo "Starting Vite server..."
exec "$@"
