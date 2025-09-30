# Stage 1: build
FROM node:slim AS build
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar todas las dependencias (dev + prod)
RUN npm ci

# Copiar todo el código fuente
COPY . .

# Compilar TypeScript
RUN npm run build   # esto genera dist/

# Stage 2: producción
FROM node:slim AS prod
WORKDIR /app


RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

    
# Copiar solo las dependencias de producción
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copiar el código compilado desde el build
COPY --from=build /app/dist ./dist
RUN mkdir -p /app/pdfs


# Exponer puerto
EXPOSE 3000

# Ejecutar la app
CMD ["node", "dist/index.js"]
