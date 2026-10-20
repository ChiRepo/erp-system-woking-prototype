FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY auth.js handler.js storage.js index.js ./
USER node
ENV MEDIA_BIND_HOST=0.0.0.0 PORT=8787
EXPOSE 8787
CMD ["node","index.js"]
