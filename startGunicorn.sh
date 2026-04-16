#!/bin/bash

# docker start
# Dockerfile
# docker build -t fastapi-seleniumbase .   
# docker run -d --name fastapi-seleniumbase -p 8000:8000 fastapi-seleniumbase
# docker run -d -p 8000:8000 -v $(pwd)/screenshots:/app/screenshots fastapi-seleniumbase

# gunicorn -w 3 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000 --reload 
cd /usr/desktop/AutoWebProject/&&nohup gunicorn -w 3 -k uvicorn.workers.UvicornWorker main:app --reload --bind 0.0.0.0:8000 > /usr/desktop/AutoWebProject/static/logs/gunicorn.log 2>&1 &
