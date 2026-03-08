FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM python:3.13-slim
WORKDIR /app

COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ ./backend/
COPY --from=frontend-build /app/frontend/build ./frontend/build

ENV PORT=8000
EXPOSE 8000
WORKDIR /app/backend
CMD uvicorn main:app --host 0.0.0.0 --port $PORT
