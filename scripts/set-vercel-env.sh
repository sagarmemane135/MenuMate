#!/bin/bash
# Set environment variables in Vercel

PROJECT_NAME="menumate"

echo "Setting environment variables for Vercel project: $PROJECT_NAME"

# Database
npx vercel env add DATABASE_URL production <<< "postgresql://postgres.evnjmkarqbrcwtntkqgq:AeYG7C%3F283HUz6%2B%7C@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres"

# Auth
npx vercel env add JWT_SECRET production <<< "super_secret_dev_key_123"
npx vercel env add COOKIE_NAME production <<< "menumate_session"

# Razorpay
npx vercel env add RAZORPAY_KEY_ID production <<< "rzp_test_RxnlojQNZtfZj0"
npx vercel env add RAZORPAY_KEY_SECRET production <<< "cM2VRnmxcEVh5Sw35n44ezJr"
npx vercel env add NEXT_PUBLIC_RAZORPAY_KEY_ID production <<< "rzp_test_RxnlojQNZtfZj0"

# Supabase
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production <<< "https://evnjmkarqbrcwtntkqgq.supabase.co"
npx vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY production <<< "sb_publishable_RMWVGFqSQxfvXI4TUSUiFA_Dfp88rXj"

# Node
npx vercel env add NODE_ENV production <<< "production"

echo "✅ Environment variables added!"
echo "Run: npx vercel --prod to deploy"



