
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .


# Créer un utilisateur non-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Préparer le dossier de sortie Next.js avant de monter le volume
RUN mkdir -p /app/.next

# Donner les droits sur le dossier de l'application
RUN chown -R appuser:appgroup /app

# Exécuter l'application sans privilèges root
USER appuser


EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]
