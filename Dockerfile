FROM node:6.10

# node-gyp (dep) needs a compiler
RUN apt-get install g++

# This is straight from https://github.com/nodejs/docker-node/blob/master/7.7/onbuild/Dockerfile
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN npm install && npm cache clean
COPY . /usr/src/app

EXPOSE 8000

CMD [ "npm", "start" ]
