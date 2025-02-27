# Use official Node.js 20 image as base
FROM node:20

# Set noninteractive mode to prevent user prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies and Python 3.10
RUN apt update \
    && apt install -y software-properties-common \
    && apt update \
    && apt install speedtest-cli \
    && apt clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR ./api

# Copy package.json and install Node.js dependencies
COPY package*.json ./
RUN npm install --only=production


# Copy the rest of the application files
COPY . .

# Expose the application port
EXPOSE 4001

# Run the application
CMD ["npm", "start"]
