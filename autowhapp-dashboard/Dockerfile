# Use the Node alpine official image
# https://hub.docker.com/_/node
FROM node:lts-alpine AS build

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Build the application
RUN CI=false yarn build

# Use the Caddy image
FROM caddy

# Create and change to the app directory.
WORKDIR /app

# Copy Caddyfile to the container image.
COPY Caddyfile ./

# Copy local code to the container image.
RUN caddy fmt Caddyfile --overwrite

# Copy files to the container image.
COPY --from=build /app/build ./dist

# Use Caddy to run/serve the app
CMD ["caddy", "run", "--config", "Caddyfile", "--adapter", "caddyfile"]

# Install serve to run the production build
# RUN yarn global add serve

# EXPOSE 3000

# # Start the application
# CMD ["serve", "-s", "build", "-l", "3000"]












