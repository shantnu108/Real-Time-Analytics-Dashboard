# Use Node.js 20 as base image
FROM node:20

# Set working directory inside container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy rest of the app
COPY . .

# Expose backend port
EXPOSE 4000

# Start the server
CMD ["npm", "start"]
