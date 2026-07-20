# Build stage
FROM node:20-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .

# Set Vite environment variable for base API URL
ENV VITE_API_URL=/api

RUN npm run build

# Production stage
FROM nginx:alpine

# Copy nginx config and built files
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
