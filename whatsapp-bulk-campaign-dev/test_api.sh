#!/bin/bash

# Base URL
BASE_URL="http://localhost:3000/api"

# Login and get token
echo "Testing login..."
TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
-H "Content-Type: application/json" \
-d '{
    "username": "superadmin",
    "password": "Admin@123"
}' | jq -r '.data.token')

if [ -z "$TOKEN" ]; then
    echo "Failed to get token"
    exit 1
fi

echo "Token received successfully"

# Test getting user credit balance
echo "Testing credit balance..."
curl -s -X GET "$BASE_URL/credits/balance/680282f1441b5c9330b87057" \
-H "Authorization: Bearer $TOKEN"

# Test getting all users
echo "Testing get all users..."
curl -s -X GET "$BASE_URL/auth/users" \
-H "Authorization: Bearer $TOKEN"

# Test generating API key
echo "Testing API key generation..."
curl -s -X POST "$BASE_URL/auth/generateApiKey" \
-H "Authorization: Bearer $TOKEN"

# Test getting credit usage stats
echo "Testing credit usage stats..."
curl -s -X GET "$BASE_URL/credits/usage-stats?startDate=2024-01-01&endDate=2024-12-31" \
-H "Authorization: Bearer $TOKEN" 