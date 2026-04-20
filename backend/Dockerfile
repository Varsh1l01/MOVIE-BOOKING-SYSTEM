FROM node:20-slim

WORKDIR /app

# Install OpenSSL and build dependencies (required by Prisma)
RUN apt-get update && apt-get install -y openssl libssl-dev python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 5000

CMD ["npm", "run", "dev"]
