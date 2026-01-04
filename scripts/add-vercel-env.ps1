# PowerShell script to add all environment variables to Vercel

Write-Host "Adding environment variables to Vercel project: menu-mate688" -ForegroundColor Cyan
Write-Host ""

# Database
Write-Host "Adding DATABASE_URL..." -ForegroundColor Yellow
echo "postgresql://postgres.evnjmkarqbrcwtntkqgq:AeYG7C%3F283HUz6%2B%7C@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres" | npx vercel env add DATABASE_URL production

# Auth
Write-Host "Adding JWT_SECRET..." -ForegroundColor Yellow
echo "super_secret_dev_key_123" | npx vercel env add JWT_SECRET production

Write-Host "Adding COOKIE_NAME..." -ForegroundColor Yellow
echo "menumate_session" | npx vercel env add COOKIE_NAME production

# Razorpay
Write-Host "Adding RAZORPAY_KEY_ID..." -ForegroundColor Yellow
echo "rzp_test_RxnlojQNZtfZj0" | npx vercel env add RAZORPAY_KEY_ID production

Write-Host "Adding RAZORPAY_KEY_SECRET..." -ForegroundColor Yellow
echo "cM2VRnmxcEVh5Sw35n44ezJr" | npx vercel env add RAZORPAY_KEY_SECRET production

Write-Host "Adding NEXT_PUBLIC_RAZORPAY_KEY_ID..." -ForegroundColor Yellow
echo "rzp_test_RxnlojQNZtfZj0" | npx vercel env add NEXT_PUBLIC_RAZORPAY_KEY_ID production

# Supabase
Write-Host "Adding NEXT_PUBLIC_SUPABASE_URL..." -ForegroundColor Yellow
echo "https://evnjmkarqbrcwtntkqgq.supabase.co" | npx vercel env add NEXT_PUBLIC_SUPABASE_URL production

Write-Host "Adding NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY..." -ForegroundColor Yellow
echo "sb_publishable_RMWVGFqSQxfvXI4TUSUiFA_Dfp88rXj" | npx vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY production

# Node
Write-Host "Adding NODE_ENV..." -ForegroundColor Yellow
echo "production" | npx vercel env add NODE_ENV production

Write-Host ""
Write-Host "✅ All environment variables added!" -ForegroundColor Green
Write-Host "Now run: npx vercel --prod" -ForegroundColor Cyan




