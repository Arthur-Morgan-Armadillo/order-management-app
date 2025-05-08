FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci   

COPY apps/frontend ./
RUN npx next build                           

ENV NODE_ENV=production

CMD ["npx", "next", "start"]
