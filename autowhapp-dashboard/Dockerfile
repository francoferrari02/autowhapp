# Build stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the application
COPY . .



# Build the application
RUN CI=false yarn build

# Install serve to run the production build
RUN yarn global add serve

EXPOSE 3000

# Start the application
CMD ["serve", "-s", "build", "-l", "3000"]