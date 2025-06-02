#!/bin/bash

# Base URL
BASE_URL="http://localhost:3000"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "Testing Template Management APIs..."

# 1. Login and get token
echo -e "\n${GREEN}1. Testing Login...${NC}"
TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "superadmin1",
    "password": "SuperAdmin@123"
  }' | jq -r '.token')

if [ -z "$TOKEN" ]; then
    echo -e "${RED}Login failed. Please check credentials.${NC}"
    exit 1
fi

echo "Token received successfully"

# 2. Create template
echo -e "\n${GREEN}2. Creating Template...${NC}"
TEMPLATE_ID=$(curl -s -X POST "$BASE_URL/api/templates" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Welcome Message",
    "content": "Hello {{name}}, welcome to our service!",
    "category": "UTILITY",
    "language": "en"
  }' | jq -r '.data._id')

if [ -z "$TEMPLATE_ID" ]; then
    echo -e "${RED}Template creation failed${NC}"
    exit 1
fi

echo "Template created with ID: $TEMPLATE_ID"

# 3. Get all templates
echo -e "\n${GREEN}3. Getting All Templates...${NC}"
curl -s -X GET "$BASE_URL/api/templates" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 4. Get specific template
echo -e "\n${GREEN}4. Getting Template by ID...${NC}"
curl -s -X GET "$BASE_URL/api/templates/$TEMPLATE_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 5. Update template
echo -e "\n${GREEN}5. Updating Template...${NC}"
curl -s -X PUT "$BASE_URL/api/templates/$TEMPLATE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Welcome Message",
    "content": "Hi {{name}}, thanks for joining us!",
    "category": "UTILITY",
    "language": "en"
  }' | jq '.'

# 6. Get pending templates
echo -e "\n${GREEN}6. Getting Pending Templates...${NC}"
curl -s -X GET "$BASE_URL/api/templates/pending" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 7. Approve template
echo -e "\n${GREEN}7. Approving Template...${NC}"
curl -s -X POST "$BASE_URL/api/templates/$TEMPLATE_ID/approve" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 8. Reject template
echo -e "\n${GREEN}8. Rejecting Template...${NC}"
curl -s -X POST "$BASE_URL/api/templates/$TEMPLATE_ID/reject" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Template content violates guidelines"
  }' | jq '.'

# 9. Delete template
echo -e "\n${GREEN}9. Deleting Template...${NC}"
curl -s -X DELETE "$BASE_URL/api/templates/$TEMPLATE_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo -e "\n${GREEN}All API tests completed!${NC}" 