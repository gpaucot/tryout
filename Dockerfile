FROM node:14-slim
WORKDIR /app
ADD . .
RUN npm run build

