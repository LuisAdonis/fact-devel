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
