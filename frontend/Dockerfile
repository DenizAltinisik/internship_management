# frontend/Dockerfile
FROM node:14

WORKDIR /app

COPY my-app/package*.json ./my-app/
RUN cd my-app && npm install

COPY my-app ./my-app

RUN cd my-app && npm run build

EXPOSE 3000
CMD ["npm", "start", "--prefix", "my-app"]
