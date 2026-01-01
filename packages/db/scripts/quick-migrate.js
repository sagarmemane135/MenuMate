/**
 * Quick migration script to add customer columns
 * Run with: node packages/db/scripts/quick-migrate.js
 * Make sure DATABASE_URL is set in your environment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const sql = `
ALTER TABLE table_sessions
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(15);
`;

console.log('📝 Migration SQL:');
console.log(sql);
console.log('\n⚠️  Please run this SQL in your Supabase SQL Editor:');
console.log('1. Go to https://supabase.com/dashboard');
console.log('2. Select your project');
console.log('3. Go to SQL Editor');
console.log('4. Paste and run the SQL above');
console.log('\nOr set DATABASE_URL and run: cd packages/db && npm run migrate:customer-columns');

