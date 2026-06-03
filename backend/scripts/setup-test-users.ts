/**
 * Creates test users in the local DB and prints JWTs for Postman.
 * Run: npx ts-node scripts/setup-test-users.ts
 */
import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres:postgres@localhost:5432/foodvillage' } },
});

const JWT_SECRET = 'local-test-jwt-secret-food-village-2024';

const TEST_USERS = [
  {
    supabase_id: 'aaaaaaaa-0000-0000-0000-000000000001',
    email: 'superadmin@foodvillage.test',
    full_name: 'Super Admin',
    role: 'super_admin' as const,
    vendor_id: null,
  },
  {
    supabase_id: 'aaaaaaaa-0000-0000-0000-000000000002',
    email: 'admin@foodvillage.test',
    full_name: 'Admin User',
    role: 'admin' as const,
    vendor_id: null,
  },
  {
    supabase_id: 'aaaaaaaa-0000-0000-0000-000000000003',
    email: 'booth1@foodvillage.test',
    full_name: 'Burger Barn Owner',
    role: 'vendor_owner' as const,
    vendor_id: 'd230c843-1517-46bf-9970-673bb9c81efb', // Burger Barn
  },
  {
    supabase_id: 'aaaaaaaa-0000-0000-0000-000000000004',
    email: 'booth2@foodvillage.test',
    full_name: 'Pizza Palace Owner',
    role: 'vendor_owner' as const,
    vendor_id: '0af39d20-c78d-432b-b916-f590fd0798d5', // Pizza Palace
  },
];

function signToken(supabase_id: string, email: string): string {
  return jwt.sign(
    {
      sub: supabase_id,
      email,
      aud: 'authenticated',
      role: 'authenticated',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365, // 1 year for testing
    },
    JWT_SECRET,
  );
}

async function main() {
  console.log('\n🔧 Setting up test users...\n');

  const tokens: Record<string, string> = {};

  for (const u of TEST_USERS) {
    const existing = await prisma.user.findUnique({ where: { supabase_id: u.supabase_id } });
    if (!existing) {
      await prisma.user.create({
        data: {
          supabase_id: u.supabase_id,
          email: u.email,
          full_name: u.full_name,
          role: u.role,
          vendor_id: u.vendor_id,
          is_active: true,
        },
      });
      console.log(`✅ Created: ${u.role} — ${u.email}`);
    } else {
      console.log(`⏭  Already exists: ${u.email}`);
    }

    const token = signToken(u.supabase_id, u.email);
    tokens[u.role] = token;
    console.log(`   Token: ${token.slice(0, 60)}...\n`);
  }

  console.log('\n📋 Copy these into Postman environment (or postman_environment.json):\n');
  console.log(JSON.stringify({
    super_admin_token: tokens['super_admin'],
    admin_token: tokens['admin'],
    vendor_token: tokens['vendor_owner'],
    burger_vendor_id: 'd230c843-1517-46bf-9970-673bb9c81efb',
    pizza_vendor_id: '0af39d20-c78d-432b-b916-f590fd0798d5',
  }, null, 2));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
