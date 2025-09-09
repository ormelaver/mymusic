FROM node:latest

ENV HOME=/usr/src/app
WORKDIR $HOME
COPY . $HOME
RUN npm install
ENV NODE_ENV=development
CMD ["npm", "start"]