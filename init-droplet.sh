#!/bin/bash
set -e
apt update && apt install -y docker.io docker-compose git
git clone https://github.com/YOUR-ORG/playwright-automation-template.git /opt/automation
cd /opt/automation
docker compose up -d --build
