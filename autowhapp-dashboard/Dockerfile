# Build stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install

# Copy the rest of the application
COPY . .

# Set environment variable for API URL
ENV REACT_APP_API_URL=http://app:3000

# Build the application
RUN yarn build

# Install serve to run the production build
RUN yarn global add serve

EXPOSE 3000

# Start the application
CMD ["serve", "-s", "build", "-l", "3000"] 