# Imagen oficial de PHP con CLI
FROM php:8.2-cli

# Extensiones necesarias para MySQL
RUN docker-php-ext-install pdo pdo_mysql mysqli

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos todo el contenido de la carpeta backend al contenedor
COPY . /app

# Railway usará el puerto que tenga en la variable PORT (normalmente 8080)
# No hace falta EXPOSE para Railway, pero lo dejamos por claridad.
EXPOSE 8080

# Servidor PHP embebido, sirve los .php de /app
CMD ["php", "-S", "0.0.0.0:8080", "-t", "."]
