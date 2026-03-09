import { Module } from '@nestjs/common';
import { InventarioModule } from '../inventario/inventario.module.js';

import { ClientesController } from './clientes/clientes.controller.js';
import { ClientesService } from './clientes/clientes.service.js';
import { PresupuestosController } from './presupuestos/presupuestos.controller.js';
import { PresupuestosService } from './presupuestos/presupuestos.service.js';
import { PedidosController } from './pedidos/pedidos.controller.js';
import { PedidosService } from './pedidos/pedidos.service.js';
import { FacturasController } from './facturas/facturas.controller.js';
import { FacturasService } from './facturas/facturas.service.js';
import { CobranzasController } from './cobranzas/cobranzas.controller.js';
import { CobranzasService } from './cobranzas/cobranzas.service.js';

@Module({
  imports: [InventarioModule],
  controllers: [
    ClientesController,
    PresupuestosController,
    PedidosController,
    FacturasController,
    CobranzasController,
  ],
  providers: [
    ClientesService,
    PresupuestosService,
    PedidosService,
    FacturasService,
    CobranzasService,
  ],
})
export class VentasModule {}
