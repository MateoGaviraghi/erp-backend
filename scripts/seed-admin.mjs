import { createHash } from 'crypto';
import pg from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const bcrypt = require('bcrypt');

// Load .env from project root
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const { Pool } = pg;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const hash = await bcrypt.hash('NexaSoft2003', 10);

    // 1. Empresa
    await pool.query(`
      INSERT INTO empresas (id, code, name, "taxId", address, city, active, "createdAt", "updatedAt")
      VALUES (
        '00000000-0000-0000-0000-000000000001',
        'NEXASOFT',
        'NexaSoft',
        '30-12345678-9',
        'Av. Corrientes 1234',
        'Buenos Aires',
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('✓ Empresa creada');

    // 2. Local
    await pool.query(`
      INSERT INTO locales (id, "empresaId", code, name, active, "createdAt", "updatedAt")
      VALUES (
        '00000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000001',
        'CENTRAL',
        'Local Central',
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('✓ Local creado');

    // 3. Usuario admin
    await pool.query(`
      INSERT INTO usuarios (id, "empresaId", "localId", nombre, email, password, rol, active, "createdAt", "updatedAt")
      VALUES (
        '00000000-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
        'Admin NexaSoft',
        'nexasoft2026@gmail.com',
        $1,
        'Administrador',
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO NOTHING
    `, [hash]);
    console.log('✓ Usuario admin creado');

    console.log('\nLogin con:');
    console.log('  email:    nexasoft2026@gmail.com');
    console.log('  password: NexaSoft2003');

  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
