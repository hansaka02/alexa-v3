FROM node:20

# Set noninteractive mode to prevent user prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt update \
    && apt install -y software-properties-common speedtest-cli \
    && apt install -y python3 python3-venv python3-pip \
    && apt clean \
    && rm -rf /var/lib/apt/lists/*

# Create a virtual environment
RUN python3 -m venv /env

# Activate the virtual environment and install Python packages
RUN /env/bin/pip install --upgrade pip \
    && /env/bin/pip install googlesearch-python beautifulsoup4 requests

# Set working directory
WORKDIR /api

# Copy package.json and install Node.js dependencies
COPY package*.json ./
RUN npm install --only=production && npm install pm2 -g

# Copy the rest of the application files
COPY . .

# Expose the application port
EXPOSE 4001

# Run the application (use the system `npm` rather than the virtual environment)
CMD ["npm", "start"]
