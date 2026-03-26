const { execSync } = require('child_process');

const db_url = "postgresql://postgres.ujxjmawomzyqoeofjyds:CipherStore_2026_Database!@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
const direct_url = "postgresql://postgres.ujxjmawomzyqoeofjyds:CipherStore_2026_Database!@aws-1-eu-west-1.pooler.supabase.com:5432/postgres";

try { execSync("npx vercel env rm DATABASE_URL production --yes"); } catch(e) {}
try { execSync("npx vercel env rm DATABASE_URL preview --yes"); } catch(e) {}
try { execSync("npx vercel env rm DATABASE_URL development --yes"); } catch(e) {}

try { execSync(`npx vercel env add DATABASE_URL production`, { input: db_url }); } catch(e) {}
try { execSync(`npx vercel env add DATABASE_URL preview`, { input: db_url }); } catch(e) {}
try { execSync(`npx vercel env add DATABASE_URL development`, { input: db_url }); } catch(e) {}

try { execSync("npx vercel env rm DIRECT_URL production --yes"); } catch(e) {}
try { execSync("npx vercel env rm DIRECT_URL preview --yes"); } catch(e) {}
try { execSync("npx vercel env rm DIRECT_URL development --yes"); } catch(e) {}

try { execSync(`npx vercel env add DIRECT_URL production`, { input: direct_url }); } catch(e) {}
try { execSync(`npx vercel env add DIRECT_URL preview`, { input: direct_url }); } catch(e) {}
try { execSync(`npx vercel env add DIRECT_URL development`, { input: direct_url }); } catch(e) {}

console.log("Vercel variables successfully updated!");
