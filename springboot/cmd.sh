#!/bin/bash

rm -rf /Users/mac/desktop/web/java/target/*
rm -rf /Users/mac/Desktop/project/desktop/SmartChatSystem/AutoWebProject/springboot/target/*
echo "[INFO] [$(date +%Y%m%d_%H%M%S)] Cleaning and building the project..."
echo "[INFO] [$(date +%Y%m%d_%H%M%S)] Build completed."
mvn -Dmaven.repo.local=.m2 -Pbundle-frontend clean package -DskipTests
echo "[INFO] [$(date +%Y%m%d_%H%M%S)] Starting the application..."
