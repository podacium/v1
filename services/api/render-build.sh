#!/usr/bin/env bash
set -o errexit

echo "🚀 Running custom Render build script..."

# Ensure Python dependencies are installed
pip install -r requirements.txt

# Generate Prisma client with correct binary target
python -m prisma generate

echo "✅ Prisma client generated and binaries cached"
