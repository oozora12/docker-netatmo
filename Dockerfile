FROM iojs:3.2
MAINTAINER Masato Shimizu <ma6ato@gmail.com>

RUN mkdir -p /app
WORKDIR /app

RUN adduser --disabled-password --gecos '' --uid 1000 docker && \
    mkdir -p /dist/node_modules && \
    ln -s /dist/node_modules /app/node_modules && \
    chown -R docker:docker /app /dist/node_modules

USER docker
COPY package.json /app/
RUN  npm install

COPY . /app
CMD ["npm","start"]
