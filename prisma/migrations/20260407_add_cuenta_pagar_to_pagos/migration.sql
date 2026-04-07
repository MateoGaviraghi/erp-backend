-- AlterTable: add optional cuentaPagarId to pagos_proveedor
ALTER TABLE "pagos_proveedor" ADD COLUMN "cuentaPagarId" UUID;

-- CreateIndex
CREATE INDEX "pagos_proveedor_cuentaPagarId_idx" ON "pagos_proveedor"("cuentaPagarId");

-- AddForeignKey
ALTER TABLE "pagos_proveedor" ADD CONSTRAINT "pagos_proveedor_cuentaPagarId_fkey"
  FOREIGN KEY ("cuentaPagarId") REFERENCES "cuentas_por_pagar"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
