#!/bin/bash

# Database migration script
# Usage: yarn migrate

echo "Generating migration files..."
yarn generate

echo "Running migrations..."
yarn migrate

echo "Migration complete!"




