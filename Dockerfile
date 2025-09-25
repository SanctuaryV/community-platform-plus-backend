FROM node:22-alpine
WORKDIR /app
COPY . .
RUN npm ci
EXPOSE 5000
CMD ["node", "server.js"]

#d