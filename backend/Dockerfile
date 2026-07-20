FROM node:20-alpine

# Install openssl and other libc compatibilities needed by Prisma on Alpine
RUN apk add --no-cache openssl openssl-dev libc6-compat

WORKDIR /usr/src/app

# Copy dependency definition files
COPY package*.json ./

# Install npm packages
RUN npm ci --legacy-peer-deps

# Copy Prisma schema definition
COPY prisma ./prisma/

# Generate Prisma Client
RUN npx prisma generate

# Copy the rest of the application
COPY . .

EXPOSE 5000

CMD ["node", "docker-start.js"]
