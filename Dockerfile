FROM node:20

# Set noninteractive mode to prevent user prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt update \
    && apt install -y software-properties-common speedtest-cli \
    && apt install -y python3 python3-venv python3-pip \
    && apt clean \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user and group
RUN useradd -m -d /home/appuser -s /bin/bash appuser

# Set working directory
WORKDIR /api

# Copy package.json and install Node.js dependencies
COPY package*.json ./
RUN npm install --only=production && npm install pm2 -g

# Copy the rest of the application files
COPY . .

# Create the auth5a folder and set permissions
RUN mkdir -p /api/auth5a \
    && chown root:appuser /api/auth5a \  
    && chmod 660 /api/auth5a \           
    && chmod +t /api/auth5a 
#
RUN mkdir -p /api/logs \
    && chown appuser:appuser /api/logs \
    && chmod 755 /api/logs
# Explanation:
# - Root owns the folder, appuser is in the group
# - Read & write for owner and group
# - Sticky bit prevents deletion of files inside

# Switch to non-root user
USER appuser

# Expose the application port
EXPOSE 4001

# Run the application
CMD ["npm", "start"]
