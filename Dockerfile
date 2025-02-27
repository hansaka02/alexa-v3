FROM node:20

RUN apt update \
    && apt install software-properties-common \
    && add-apt-repository ppa:deadsnakes/ppa \
    && apt update \
    && apt install python3.10

WORKDIR ./api




COPY package-*.json .
RUN npm install

COPY . .
EXPOSE 4001
CMD npm start
