import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';

import { EmpleadosController } from './empleados/empleados.controller.js';
import { EmpleadosService } from './empleados/empleados.service.js';

import { AsistenciasController } from './asistencias/asistencias.controller.js';
import { AsistenciasService } from './asistencias/asistencias.service.js';

import { HorasController } from './horas/horas.controller.js';
import { HorasService } from './horas/horas.service.js';

import { LiquidacionesController } from './liquidaciones/liquidaciones.controller.js';
import { LiquidacionesService } from './liquidaciones/liquidaciones.service.js';

import { VacacionesController } from './vacaciones/vacaciones.controller.js';
import { VacacionesService } from './vacaciones/vacaciones.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [
    EmpleadosController,
    AsistenciasController,
    HorasController,
    LiquidacionesController,
    VacacionesController,
  ],
  providers: [
    EmpleadosService,
    AsistenciasService,
    HorasService,
    LiquidacionesService,
    VacacionesService,
  ],
})
export class RrhhModule {}
