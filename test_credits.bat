@echo off
echo Testing Credit Management APIs...

echo.
echo 1. Login to get token...
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"superadmin\",\"password\":\"Admin@123\"}" > token.json
for /f "tokens=*" %%a in (token.json) do set "TOKEN=%%a"
echo Token received: %TOKEN%

if "%TOKEN%"=="" (
    echo Failed to get token. Please check if the server is running.
    exit /b 1
)

echo.
echo 2. Get user's campaign credits...
curl -X GET http://localhost:3000/api/credits/user -H "Authorization: Bearer %TOKEN%"

echo.
echo 3. Transfer credits...
curl -X POST http://localhost:3000/api/credits/transfer ^
-H "Authorization: Bearer %TOKEN%" ^
-H "Content-Type: application/json" ^
-d "{\"fromUserId\":\"680282f1441b5c9330b87057\",\"toUserId\":\"680282f1441b5c9330b87058\",\"campaignId\":\"680282f1441b5c9330b87059\",\"creditAmount\":100}"

echo.
echo 4. Debit credits...
curl -X POST http://localhost:3000/api/credits/debit ^
-H "Authorization: Bearer %TOKEN%" ^
-H "Content-Type: application/json" ^
-d "{\"userId\":\"680282f1441b5c9330b87058\",\"campaignId\":\"680282f1441b5c9330b87059\",\"amount\":10}"

echo.
echo 5. Get credit transactions...
curl -X GET http://localhost:3000/api/credits/transactions/680282f1441b5c9330b87059 -H "Authorization: Bearer %TOKEN%"

echo.
echo 6. Process refund...
curl -X POST http://localhost:3000/api/credits/refund ^
-H "Authorization: Bearer %TOKEN%" ^
-H "Content-Type: application/json" ^
-d "{\"campaignId\":\"680282f1441b5c9330b87059\",\"messageId\":\"msg123\",\"reason\":\"Failed delivery\"}"

echo.
echo 7. Update refund settings...
curl -X PUT http://localhost:3000/api/credits/refund-settings ^
-H "Authorization: Bearer %TOKEN%" ^
-H "Content-Type: application/json" ^
-d "{\"campaignId\":\"680282f1441b5c9330b87059\",\"autoRefund\":true,\"refundPercentage\":100}"

echo.
echo 8. Get refund statistics...
curl -X GET http://localhost:3000/api/credits/refund-stats/680282f1441b5c9330b87059 -H "Authorization: Bearer %TOKEN%"

echo.
echo Testing completed!
del token.json 