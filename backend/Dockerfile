# Backend Dockerfile for Node.js/TypeScript with ffmpeg

FROM node:20-slim

# Install ffmpeg
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src
RUN npm install

# Copy the rest of the backend code (if any other files exist)
COPY . .

# Expose backend port
EXPOSE 5001

# Start the backend (adjust if your start script is different)
CMD ["npm", "run", "start"]
