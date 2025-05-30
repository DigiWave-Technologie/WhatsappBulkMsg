# Define test users
$testUsers = @(
    @{ username = 'superadmin1'; password = 'SuperAdmin@123'; role = 'super_admin' },
    @{ username = 'admin1'; password = 'AdminUser@123'; role = 'admin' },
    @{ username = 'reseller1'; password = 'Reseller@123'; role = 'reseller' },
    @{ username = 'user1'; password = 'TestUser@123'; role = 'user' }
)

foreach ($user in $testUsers) {
    Write-Host "\n==============================="
    Write-Host "Testing as $($user.role) ($($user.username))"
    Write-Host "==============================="

    # Login and get token
    $headers = @{ 'Content-Type' = 'application/json' }
    $body = @{ username = $user.username; password = $user.password } | ConvertTo-Json
    try {
        $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/auth/login' -Method Post -Headers $headers -Body $body -ErrorAction Stop
        $token = ($response.Content | ConvertFrom-Json).data.token
        $authHeaders = @{ 
            'Content-Type' = 'application/json'
            'Authorization' = "Bearer $token"
        }
    } catch {
        Write-Host "Login failed for $($user.username): $($_.Exception.Message)"
        continue
    }

    # 1. Set campaign type cost (only super_admin/admin should succeed)
    $costBody = @{
        type = 'button'
        cost = 5
        description = 'Button campaign cost'
        isActive = $true
    } | ConvertTo-Json
    Write-Host "\nSetting campaign type cost..."
    try {
        $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/campaign-costs/set' -Method Post -Headers $authHeaders -Body $costBody -ErrorAction Stop
        Write-Host "Response: $($response.Content)"
    } catch {
        Write-Host "Error: $($_.Exception.Response.GetResponseStream() | %{ (New-Object IO.StreamReader $_).ReadToEnd() })"
    }

    # 2. Get all campaign type costs
    Write-Host "\nGetting all campaign type costs..."
    try {
        $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/campaign-costs' -Method Get -Headers $authHeaders -ErrorAction Stop
        Write-Host "Response: $($response.Content)"
    } catch {
        Write-Host "Error: $($_.Exception.Response.GetResponseStream() | %{ (New-Object IO.StreamReader $_).ReadToEnd() })"
    }

    # 3. Get specific campaign type cost
    Write-Host "\nGetting button campaign type cost..."
    try {
        $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/campaign-costs/button' -Method Get -Headers $authHeaders -ErrorAction Stop
        Write-Host "Response: $($response.Content)"
    } catch {
        Write-Host "Error: $($_.Exception.Response.GetResponseStream() | %{ (New-Object IO.StreamReader $_).ReadToEnd() })"
    }

    # 4. Calculate campaign cost
    $calcBody = @{
        type = 'button'
        recipientCount = 100
    } | ConvertTo-Json
    Write-Host "\nCalculating campaign cost..."
    try {
        $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/campaign-costs/calculate' -Method Post -Headers $authHeaders -Body $calcBody -ErrorAction Stop
        Write-Host "Response: $($response.Content)"
    } catch {
        Write-Host "Error: $($_.Exception.Response.GetResponseStream() | %{ (New-Object IO.StreamReader $_).ReadToEnd() })"
    }

    # 5. Get user's campaign credits
    Write-Host "\nGetting user's campaign credits..."
    try {
        $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/campaign-credits/user' -Method Get -Headers $authHeaders -ErrorAction Stop
        Write-Host "Response: $($response.Content)"
    } catch {
        Write-Host "Error: $($_.Exception.Response.GetResponseStream() | %{ (New-Object IO.StreamReader $_).ReadToEnd() })"
    }

    # 6. Debit credits (simulate campaign usage)
    $debitBody = @{
        campaignId = "test-campaign"
        amount = 10
    } | ConvertTo-Json
    Write-Host "\nDebiting credits..."
    try {
        $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/campaign-credits/debit' -Method Post -Headers $authHeaders -Body $debitBody -ErrorAction Stop
        Write-Host "Response: $($response.Content)"
    } catch {
        Write-Host "Error: $($_.Exception.Response.GetResponseStream() | %{ (New-Object IO.StreamReader $_).ReadToEnd() })"
    }

    # 7. Get credit transactions
    Write-Host "\nGetting credit transactions..."
    try {
        $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/campaign-credits/transactions/test-campaign' -Method Get -Headers $authHeaders -ErrorAction Stop
        Write-Host "Response: $($response.Content)"
    } catch {
        Write-Host "Error: $($_.Exception.Response.GetResponseStream() | %{ (New-Object IO.StreamReader $_).ReadToEnd() })"
    }

    Write-Host "\n--- End of tests for $($user.role) ($($user.username)) ---\n"
} 