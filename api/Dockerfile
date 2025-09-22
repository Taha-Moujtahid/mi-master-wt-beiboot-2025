# Dockerfile for NestJS API
FROM node:20-alpine as builder
WORKDIR /app
COPY . .
RUN npm install && npm run build

FROM node:20-alpine as runner
WORKDIR /app
COPY --from=builder /app .
EXPOSE 4000
CMD ["npm", "run", "start:prod"]
