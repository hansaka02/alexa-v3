# Use Heroku's official Cloud Native Buildpacks builder
FROM heroku/builder:22

# Set the working directory



# Set environment variables (optional)
ENV NODE_ENV=production
ENV PYTHONUNBUFFERED=1

# Build the application using Node.js & Python buildpacks
RUN pack build my-app \
    --builder heroku/builder:22 \
    --buildpack heroku/nodejs \
    --buildpack heroku/python


RUN npm install
RUN pip3 install speedtest-cli
# Run the container
CMD ["npm", "start"]
