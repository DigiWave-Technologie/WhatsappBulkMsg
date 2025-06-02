#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:3000/api"

# Get token
echo "Getting authentication token..."
TOKEN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "superadmin",
    "password": "admin123"
  }')

TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}Failed to get token${NC}"
    exit 1
fi

echo -e "${GREEN}Token obtained successfully${NC}"

# Create a campaign
echo -e "\nCreating a new campaign..."
CAMPAIGN_RESPONSE=$(curl -s -X POST $BASE_URL/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Quick Campaign",
    "type": "quick",
    "message": {
      "text": "Hello! This is a test campaign message."
    },
    "recipients": {
      "type": "numbers",
      "numbers": ["+1234567890", "+1987654321"]
    },
    "schedule": {
      "startDate": "2024-03-20T10:00:00Z",
      "timezone": "UTC"
    }
  }')

echo "Campaign creation response:"
echo $CAMPAIGN_RESPONSE

# Extract campaign ID
CAMPAIGN_ID=$(echo $CAMPAIGN_RESPONSE | grep -o '"_id":"[^"]*' | cut -d'"' -f4)

if [ -z "$CAMPAIGN_ID" ]; then
    echo -e "${RED}Failed to create campaign${NC}"
    exit 1
fi

echo -e "${GREEN}Campaign created successfully with ID: $CAMPAIGN_ID${NC}"

# Get all campaigns
echo -e "\nGetting all campaigns..."
curl -s -X GET $BASE_URL/campaigns \
  -H "Authorization: Bearer $TOKEN"

# Get specific campaign
echo -e "\nGetting specific campaign..."
curl -s -X GET $BASE_URL/campaigns/$CAMPAIGN_ID \
  -H "Authorization: Bearer $TOKEN"

# Schedule campaign
echo -e "\nScheduling campaign..."
curl -s -X POST $BASE_URL/campaigns/$CAMPAIGN_ID/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "startDate": "2024-03-21T15:00:00Z",
    "timezone": "UTC"
  }'

# Get campaign stats
echo -e "\nGetting campaign statistics..."
curl -s -X GET $BASE_URL/campaigns/$CAMPAIGN_ID/stats \
  -H "Authorization: Bearer $TOKEN"

# Create a button campaign
echo -e "\nCreating a button campaign..."
curl -s -X POST $BASE_URL/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Button Campaign Test",
    "type": "button",
    "message": {
      "text": "Please select your preference:"
    },
    "buttons": [
      {
        "type": "quick_reply",
        "text": "Option 1",
        "value": "opt1"
      },
      {
        "type": "quick_reply",
        "text": "Option 2",
        "value": "opt2"
      }
    ],
    "recipients": {
      "type": "numbers",
      "numbers": ["+1234567890"]
    }
  }'

# Create a poll campaign
echo -e "\nCreating a poll campaign..."
curl -s -X POST $BASE_URL/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Poll Campaign Test",
    "type": "poll",
    "poll": {
      "question": "What is your favorite color?",
      "options": ["Red", "Blue", "Green"],
      "allowMultipleAnswers": false,
      "anonymous": true
    },
    "recipients": {
      "type": "numbers",
      "numbers": ["+1234567890"]
    }
  }'

echo -e "\n${GREEN}All tests completed${NC}" 