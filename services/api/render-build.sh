#!/usr/bin/env bash
# Render build script for Prisma Python + FastAPI
set -o errexit  # Exit on error

echo "📦 Installing dependencies..."
pip install -r services/api/requirements.txt

echo "⚙️ Generating Prisma client..."
cd services/api
python -m prisma generate
