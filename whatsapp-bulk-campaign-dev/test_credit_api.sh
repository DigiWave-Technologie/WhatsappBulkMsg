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

# Test credit transfer with time duration
echo "Testing credit transfer with time duration..."
curl -s -X POST "$BASE_URL/credits/transfer" \
-H "Authorization: Bearer $TOKEN" \
-H "Content-Type: application/json" \
-d '{
    "fromUserId": "680282f1441b5c9330b87057",
    "toUserId": "680282f1441b5c9330b87058",
    "categoryId": "680282f1441b5c9330b87059",
    "creditAmount": 100,
    "timeDuration": "monthly"
}'

# Test getting credit transactions
echo "Testing get credit transactions..."
curl -s -X GET "$BASE_URL/credits/transactions" \
-H "Authorization: Bearer $TOKEN"

# Test getting credit transactions by user
echo "Testing get credit transactions by user..."
curl -s -X GET "$BASE_URL/credits/transactions/user/680282f1441b5c9330b87058" \
-H "Authorization: Bearer $TOKEN"

# Test getting credit transactions by user and category
echo "Testing get credit transactions by user and category..."
curl -s -X GET "$BASE_URL/credits/transactions/user/680282f1441b5c9330b87058/category/680282f1441b5c9330b87059" \
-H "Authorization: Bearer $TOKEN"

# Test getting credit usage stats
echo "Testing get credit usage stats..."
curl -s -X GET "$BASE_URL/credits/stats" \
-H "Authorization: Bearer $TOKEN"

# Test checking user credits
echo "Testing check user credits..."
curl -s -X GET "$BASE_URL/credits/check/680282f1441b5c9330b87058" \
-H "Authorization: Bearer $TOKEN"

echo "Credit management API tests completed" 