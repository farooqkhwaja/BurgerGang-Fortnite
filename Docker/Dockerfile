# Use an official Node.js runtime as a base image
FROM node:18

# Set working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app's source code
COPY . .

# Expose the port your app runs on (adjust if needed)
EXPOSE 3000

# Start the app
#CMD ["npm", "start"]
# Start de server

CMD ["node", "index.js"]

# om de container te starten ren deze in de terminal (docker compose up --build)
