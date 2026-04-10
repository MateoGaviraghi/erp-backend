-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('Super', 'Administrador', 'Gerente', 'Vendedor', 'Inventario', 'Contador', 'RRHH', 'Produccion', 'SoloLectura');
ALTER TABLE "Usuario" ALTER COLUMN "rol" TYPE "UserRole_new" USING ("rol"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
COMMIT;
