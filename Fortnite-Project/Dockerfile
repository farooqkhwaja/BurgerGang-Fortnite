FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Expose the port your app runs on (adjust if needed)
EXPOSE 3000

# Start the app
#CMD ["npm", "start"]
# Start de server

CMD ["npm", "start"]

# om de container te starten ren deze in de terminal (docker compose up --build)
