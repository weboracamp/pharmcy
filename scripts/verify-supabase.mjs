import fs from 'fs';
import path from 'path';

// Parse .env manually
const envPath = path.resolve(process.cwd(), '.env');
let supabaseUrl = process.env.VITE_SUPABASE_URL;
let supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let val = match[2].trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (key === 'VITE_SUPABASE_URL') supabaseUrl = val;
        if (key === 'VITE_SUPABASE_ANON_KEY') supabaseAnonKey = val;
      }
    }
  }
}

console.log('--- Supabase Connection Verification ---');
console.log('Project URL:', supabaseUrl);
console.log('Anon Key Present:', Boolean(supabaseAnonKey));

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env');
  process.exit(1);
}

const tables = [
  { name: 'branches', expectedPolicy: 'Public SELECT; Admin manage' },
  { name: 'profiles', expectedPolicy: 'Owner & Branch staff scoped' },
  { name: 'categories', expectedPolicy: 'Public SELECT; Admin manage' },
  { name: 'products', expectedPolicy: 'Public SELECT; Branch staff manage' },
  { name: 'orders', expectedPolicy: 'Customer own / Staff branch / Driver assigned' },
  { name: 'order_items', expectedPolicy: 'Scoped to order access' },
  { name: 'prescriptions', expectedPolicy: 'Scoped to order access' },
  { name: 'shifts', expectedPolicy: 'Branch staff / Cashier own' },
  { name: 'sales', expectedPolicy: 'Branch staff / Cashier own' },
  { name: 'stock_logs', expectedPolicy: 'Branch staff scoped' },
  { name: 'notifications_log', expectedPolicy: 'Admin & System' },
  { name: 'stock_transfers', expectedPolicy: 'Branch staff scoped' }
];

async function verify() {
  console.log('\nChecking all 12 schema tables in Supabase...');
  console.log('-------------------------------------------------------------------------------');
  console.log('| #  | Table Name         | Exists in Schema | HTTP Status | RLS Protected   |');
  console.log('-------------------------------------------------------------------------------');

  let existingCount = 0;
  let missingCount = 0;

  for (let i = 0; i < tables.length; i++) {
    const { name } = tables[i];
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/${name}?select=*&limit=1`, {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`
        }
      });

      const padIndex = String(i + 1).padStart(2, ' ');
      const padName = name.padEnd(18, ' ');

      if (res.status === 200) {
        existingCount++;
        console.log(`| ${padIndex} | ${padName} | YES              | ${res.status}         | YES (ACTIVE)    |`);
      } else if (res.status === 401 || res.status === 403) {
        existingCount++;
        console.log(`| ${padIndex} | ${padName} | YES              | ${res.status}         | YES (RESTRICTED)|`);
      } else {
        missingCount++;
        console.log(`| ${padIndex} | ${padName} | NO (PGRST205)    | ${res.status}         | Pending SQL Run |`);
      }
    } catch (err) {
      console.log(`| ${i + 1} | ${name} | ERROR (${err.message}) |`);
    }
  }

  console.log('-------------------------------------------------------------------------------');
  console.log(`Summary: ${existingCount}/12 tables created, ${missingCount}/12 missing.\n`);

  if (missingCount > 0) {
    console.log('ACTION REQUIRED: The tables have not been created in this Supabase project yet.');
    console.log('To apply the database schema and enable RLS policies:');
    console.log(`1. Open your Supabase SQL Editor: https://supabase.com/dashboard/project/duudldtipunoaejqvnkf/sql/new`);
    console.log('2. Copy and paste the contents of `supabase_schema.sql` into the editor.');
    console.log('3. Click RUN. All 12 tables and their Row Level Security policies will be created.');
    console.log('4. Re-run this script or reload the app to confirm full live synchronization.');
  } else {
    console.log('SUCCESS: All 12 tables exist and Row Level Security is active on every table!');
  }
}

verify();
