# Test Campaign Costs and Credit Management APIs

# Function to make API calls
function Invoke-ApiCall {
    param (
        [string]$Uri,
        [string]$Method,
        [hashtable]$Headers,
        [string]$Body = $null
    )
    
    try {
        if ($Body) {
            $response = Invoke-WebRequest -Uri $Uri -Method $Method -Headers $Headers -Body $Body -ErrorAction Stop
        } else {
            $response = Invoke-WebRequest -Uri $Uri -Method $Method -Headers $Headers -ErrorAction Stop
        }
        Write-Host "Response from $Uri`:"
        Write-Host $response.Content
        Write-Host "----------------------------------------"
        return $response
    } catch {
        Write-Host "Error calling $Uri`:"
        Write-Host $_.Exception.Message
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $reader.BaseStream.Position = 0
            $reader.DiscardBufferedData()
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response body: $responseBody"
        }
        Write-Host "----------------------------------------"
    }
}

# Login as superadmin
Write-Host "Logging in as superadmin..."
$headers = @{ 'Content-Type' = 'application/json' }
$body = @{ username = 'superadmin1'; password = 'SuperAdmin@123' } | ConvertTo-Json
$response = Invoke-WebRequest -Uri 'http://localhost:3000/api/auth/login' -Method Post -Headers $headers -Body $body
$token = ($response.Content | ConvertFrom-Json).data.token
$authHeaders = @{ 
    'Content-Type' = 'application/json'
    'Authorization' = "Bearer $token"
}
Write-Host "Login successful. Token received."
Write-Host "----------------------------------------"

# 1. Set campaign type costs for different types
Write-Host "Setting campaign type costs..."
$campaignTypes = @(
    @{
        type = 'quick'
        cost = 2
        description = 'Quick message campaign cost per recipient'
        metadata = @{
            features = @('text', 'media')
            maxLength = 1000
        }
    },
    @{
        type = 'csv'
        cost = 3
        description = 'CSV campaign cost per recipient'
        metadata = @{
            features = @('bulk', 'customization')
            maxRecipients = 10000
        }
    },
    @{
        type = 'button'
        cost = 5
        description = 'Button campaign cost per recipient'
        metadata = @{
            features = @('interactive', 'quick_reply')
            maxButtons = 3
        }
    },
    @{
        type = 'poll'
        cost = 4
        description = 'Poll campaign cost per recipient'
        metadata = @{
            features = @('interactive', 'voting')
            maxOptions = 5
        }
    }
)

foreach ($type in $campaignTypes) {
    $costBody = $type | ConvertTo-Json
    Invoke-ApiCall -Uri 'http://localhost:3000/api/campaign-costs/set' -Method Post -Headers $authHeaders -Body $costBody
}

# 2. Get all campaign type costs
Write-Host "Getting all campaign type costs..."
Invoke-ApiCall -Uri 'http://localhost:3000/api/campaign-costs' -Method Get -Headers $authHeaders

# 3. Get specific campaign type costs
Write-Host "Getting specific campaign type costs..."
foreach ($type in $campaignTypes) {
    Invoke-ApiCall -Uri "http://localhost:3000/api/campaign-costs/$($type.type)" -Method Get -Headers $authHeaders
}

# 4. Calculate campaign costs
Write-Host "Calculating campaign costs..."
$calculateBody = @{
    type = 'button'
    recipientCount = 100
} | ConvertTo-Json
Invoke-ApiCall -Uri 'http://localhost:3000/api/campaign-costs/calculate' -Method Post -Headers $authHeaders -Body $calculateBody

# 5. Test credit management
Write-Host "Testing credit management..."

# Get user credits (use balance endpoint)
Invoke-ApiCall -Uri "http://localhost:3000/api/credits/balance/me" -Method Get -Headers $authHeaders

# Get credit transactions
Invoke-ApiCall -Uri 'http://localhost:3000/api/credits/transactions' -Method Get -Headers $authHeaders

# Get credit usage statistics
Invoke-ApiCall -Uri 'http://localhost:3000/api/credits/stats' -Method Get -Headers $authHeaders

# 6. Test campaign credit operations
Write-Host "Testing campaign credit operations..."

# Create a test campaign
$campaignBody = @{
    name = 'Test Campaign'
    type = 'button'
    description = 'Test campaign for credit operations'
    message = @{
        text = 'Test message'
    }
    buttons = @(
        @{
            text = 'Button 1'
            type = 'quick_reply'
        }
    )
    recipients = @{
        type = 'numbers'
        numbers = @('+1234567890')
    }
    schedule = @{
        startAt = (Get-Date).ToString('yyyy-MM-ddTHH:mm:ssZ')
    }
} | ConvertTo-Json

$campaignResponse = Invoke-ApiCall -Uri 'http://localhost:3000/api/campaigns' -Method Post -Headers $authHeaders -Body $campaignBody
$campaignId = ($campaignResponse.Content | ConvertFrom-Json).data._id

# Get campaign credit transactions
Invoke-ApiCall -Uri "http://localhost:3000/api/campaign-credits/transactions/$campaignId" -Method Get -Headers $authHeaders

# Get campaign refund statistics
Invoke-ApiCall -Uri "http://localhost:3000/api/campaign-credits/refund-stats/$campaignId" -Method Get -Headers $authHeaders

Write-Host "All tests completed." 