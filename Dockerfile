FROM mcr.microsoft.com/playwright:v1.55.0-noble

RUN apt-get update && apt-get install -y xvfb

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD xvfb-run --server-args="-screen 0 1024x768x24" node server.js
