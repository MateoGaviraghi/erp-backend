import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';

import { PlanCuentasService } from './plan-cuentas/plan-cuentas.service.js';
import { PlanCuentasController } from './plan-cuentas/plan-cuentas.controller.js';

import { AsientosService } from './asientos/asientos.service.js';
import { AsientosController } from './asientos/asientos.controller.js';

import { CuentasCobrarService } from './cuentas-cobrar/cuentas-cobrar.service.js';
import { CuentasCobrarController } from './cuentas-cobrar/cuentas-cobrar.controller.js';

import { CuentasPagarService } from './cuentas-pagar/cuentas-pagar.service.js';
import { CuentasPagarController } from './cuentas-pagar/cuentas-pagar.controller.js';

import { BancosService } from './bancos/bancos.service.js';
import { BancosController } from './bancos/bancos.controller.js';

import { CajaService } from './caja/caja.service.js';
import { CajaController } from './caja/caja.controller.js';

import { RetencionesService } from './retenciones/retenciones.service.js';
import { RetencionesController } from './retenciones/retenciones.controller.js';

@Module({
  imports: [PrismaModule],
  controllers: [
    PlanCuentasController,
    AsientosController,
    CuentasCobrarController,
    CuentasPagarController,
    BancosController,
    CajaController,
    RetencionesController,
  ],
  providers: [
    PlanCuentasService,
    AsientosService,
    CuentasCobrarService,
    CuentasPagarService,
    BancosService,
    CajaService,
    RetencionesService,
  ],
  exports: [AsientosService],
})
export class FinanzasModule {}
