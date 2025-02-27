# Use the Heroku Buildpacks builder image
FROM heroku/pack:20

# Set the working directory
WORKDIR ./api

# Copy the source code into the container
COPY . .

# Run pack build with both Node.js and Python buildpacks
RUN pack build my-app \
    --builder heroku/builder:20 \
    --buildpack heroku/nodejs \
    --buildpack heroku/python
    
RUN npm install
# Run the container
CMD ["npm", "start"]
