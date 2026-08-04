FROM node:20-slim
WORKDIR /app
COPY cyncer-dash/package*.json ./
RUN npm install
COPY cyncer-dash/ ./
RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "run", "dev"]