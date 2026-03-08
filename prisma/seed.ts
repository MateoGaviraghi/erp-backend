import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env['DATABASE_URL'] as string,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando seed...');

  // Crear empresa base
  const empresa = await prisma.empresa.upsert({
    where: { taxId: '20123456789' },
    update: {},
    create: {
      code: 'DEMO',
      name: 'Empresa Demo S.A.',
      taxId: '20123456789',
      email: 'contacto@empresa.com',
      active: true,
    },
  });

  console.log(`✅ Empresa: ${empresa.name} (${empresa.id})`);

  // Crear local base
  const local = await prisma.local.upsert({
    where: { empresaId_code: { empresaId: empresa.id, code: 'MAIN' } },
    update: {},
    create: {
      empresaId: empresa.id,
      code: 'MAIN',
      name: 'Local Principal',
      address: 'Av. Principal 123',
      active: true,
    },
  });

  console.log(`✅ Local: ${local.name} (${local.id})`);

  // Crear usuario administrador
  const passwordHash = await bcrypt.hash('admin123', 10);

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@empresa.com' },
    update: {},
    create: {
      empresaId: empresa.id,
      localId: local.id,
      nombre: 'Administrador',
      email: 'admin@empresa.com',
      password: passwordHash,
      rol: 'Administrador',
      active: true,
    },
  });

  console.log(`✅ Admin: ${admin.email} / admin123`);

  // Crear usuario vendedor de prueba
  const vendedorHash = await bcrypt.hash('vendedor123', 10);

  const vendedor = await prisma.usuario.upsert({
    where: { email: 'vendedor@empresa.com' },
    update: {},
    create: {
      empresaId: empresa.id,
      localId: local.id,
      nombre: 'Vendedor Demo',
      email: 'vendedor@empresa.com',
      password: vendedorHash,
      rol: 'Vendedor',
      active: true,
    },
  });

  console.log(`✅ Vendedor: ${vendedor.email} / vendedor123`);

  console.log('\n🎉 Seed completado correctamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
