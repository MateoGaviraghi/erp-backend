import { Module } from '@nestjs/common';

import { ProveedoresController } from './proveedores/proveedores.controller.js';
import { ProveedoresService } from './proveedores/proveedores.service.js';
import { RequerimientosController } from './requerimientos/requerimientos.controller.js';
import { RequerimientosService } from './requerimientos/requerimientos.service.js';
import { OrdenesController } from './ordenes/ordenes.controller.js';
import { OrdenesService } from './ordenes/ordenes.service.js';
import { RecepcionesController } from './recepciones/recepciones.controller.js';
import { RecepcionesService } from './recepciones/recepciones.service.js';
import { PagosController } from './pagos/pagos.controller.js';
import { PagosService } from './pagos/pagos.service.js';

@Module({
  controllers: [
    ProveedoresController,
    RequerimientosController,
    OrdenesController,
    RecepcionesController,
    PagosController,
  ],
  providers: [
    ProveedoresService,
    RequerimientosService,
    OrdenesService,
    RecepcionesService,
    PagosService,
  ],
})
export class ComprasModule {}
