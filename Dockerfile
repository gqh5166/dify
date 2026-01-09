FROM node:18-slim

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy app sources
COPY . .

EXPOSE 3000

ENV NODE_ENV=production
CMD ["node", "server.js"]
