# Login as superadmin
$headers = @{ 'Content-Type' = 'application/json' }
$body = @{ username = 'superadmin1'; password = 'SuperAdmin@123' } | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/auth/login' -Method Post -Headers $headers -Body $body -ErrorAction Stop
    $token = ($response.Content | ConvertFrom-Json).data.token
    $authHeaders = @{ 
        'Content-Type' = 'application/json'
        'Authorization' = "Bearer $token"
    }
    Write-Host "Successfully logged in as superadmin"
} catch {
    Write-Host "Login failed: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body: $responseBody"
    }
    exit
}

# Set campaign type cost for button type
$costBody = @{
    type = 'button'
    cost = 5
    description = 'Button campaign cost per recipient'
    metadata = @{
        features = @('interactive', 'quick_reply')
        maxButtons = 3
    }
} | ConvertTo-Json

try {
    Write-Host "Sending request to set campaign type cost..."
    Write-Host "Request body: $costBody"
    $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/campaign-costs/set' -Method Post -Headers $authHeaders -Body $costBody -ErrorAction Stop
    Write-Host "Successfully set campaign type cost:"
    Write-Host $response.Content
} catch {
    Write-Host "Failed to set campaign type cost:"
    Write-Host "Error message: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body: $responseBody"
    }
} 