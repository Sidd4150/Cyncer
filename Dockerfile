FROM node:20-slim
WORKDIR /app
COPY my-app/package*.json ./
RUN npm install
COPY my-app/ ./
RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "run", "dev"]