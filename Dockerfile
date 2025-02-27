# Use the Heroku Buildpacks builder image
FROM heroku/pack:20

# Set the working directory
WORKDIR ./api

# Copy the source code into the container
COPY . .

# Run pack build with both Node.js and Python buildpacks
RUN pack build my-app \
    
    --buildpack heroku/nodejs \
    --buildpack heroku/python
    
RUN npm install
RUN pip3 install speedtest-cli
# Run the container
CMD ["npm", "start"]
