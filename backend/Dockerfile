
FROM node:22-alpine


# Mise à jour de npm
RUN npm install --global npm@11.21.2

WORKDIR /app

# Installer les dépendances
COPY package.json package-lock.json ./
RUN npm ci

# Copier le code source
COPY . .

# Générer le client Prisma avec le schéma inclus dans l'image
RUN npx prisma generate

# Préparer les permissions du volume node_modules
RUN mkdir -p /app/dist /app/uploads && \
    chown node:node /app && \
    chown -R node:node /app/node_modules /app/dist /app/uploads

# Utiliser un utilisateur non-root
USER node

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
