# Use a Node.js image compatible with your version (v22)
FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /app

# Install Python and build tools (required by some npm packages)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json package-lock.json ./

# Install npm dependencies with legacy peer deps flag
RUN npm install --legacy-peer-deps

# Copy the rest of the application source code
COPY . .

# Expose port 4200 (default Angular dev server port)
EXPOSE 4200

# Start the Angular development server with host 0.0.0.0
CMD ["npm", "start", "--", "--host", "0.0.0.0", "--disable-host-check"]
