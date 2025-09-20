FROM node:latest

ENV HOME=/usr/src/app
WORKDIR $HOME
COPY . $HOME
RUN npm install
ENV NODE_ENV=development
EXPOSE 8080
CMD ["npm", "start"]