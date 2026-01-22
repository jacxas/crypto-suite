# Dockerfile → Node.js 22 + ES modules
FROM node:22-alpine

WORKDIR /app

# Copia package.json e instala dependencias
COPY package.json ./
RUN npm install --omit=dev

# Copia el archivo único
COPY crypto-suite-complete.js ./

# Crea carpeta para logs
RUN mkdir -p logs

# Expone puerto
EXPOSE 3000

# Comando por defecto
CMD ["node", "crypto-suite-complete.js", "start"]
