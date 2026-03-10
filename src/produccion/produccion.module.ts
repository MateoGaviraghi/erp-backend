import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';

import { MaterialesController } from './materiales/materiales.controller.js';
import { MaterialesService } from './materiales/materiales.service.js';

import { BomController } from './bom/bom.controller.js';
import { BomService } from './bom/bom.service.js';

import { OrdenesController } from './ordenes/ordenes.controller.js';
import { OrdenesProduccionService } from './ordenes/ordenes.service.js';

import { PlanificacionController } from './planificacion/planificacion.controller.js';
import { PlanificacionService } from './planificacion/planificacion.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [
    MaterialesController,
    BomController,
    OrdenesController,
    PlanificacionController,
  ],
  providers: [
    MaterialesService,
    BomService,
    OrdenesProduccionService,
    PlanificacionService,
  ],
})
export class ProduccionModule {}
