import { Module } from '@nestjs/common';
import { CategoriasController } from './categorias/categorias.controller.js';
import { CategoriasService } from './categorias/categorias.service.js';
import { ProductosController } from './productos/productos.controller.js';
import { ProductosService } from './productos/productos.service.js';
import { DepositosController } from './depositos/depositos.controller.js';
import { DepositosService } from './depositos/depositos.service.js';
import { StockController } from './stock/stock.controller.js';
import { StockService } from './stock/stock.service.js';
import { MovimientosController } from './movimientos/movimientos.controller.js';
import { MovimientosService } from './movimientos/movimientos.service.js';

@Module({
  controllers: [
    CategoriasController,
    ProductosController,
    DepositosController,
    StockController,
    MovimientosController,
  ],
  providers: [
    CategoriasService,
    ProductosService,
    DepositosService,
    StockService,
    MovimientosService,
  ],
  exports: [StockService, ProductosService],
})
export class InventarioModule {}
