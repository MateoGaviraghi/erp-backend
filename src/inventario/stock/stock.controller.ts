import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StockService } from './stock.service.js';
import { AjusteStockDto } from './dto/ajuste-stock.dto.js';
import { TransferenciaStockDto } from './dto/transferencia-stock.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@ApiTags('inventario')
@ApiBearerAuth('JWT-auth')
@Controller('inventario')
export class StockController {
  constructor(private readonly service: StockService) {}

  @Get('alertas')
  @ApiOperation({ summary: 'Productos bajo stock mínimo' })
  getAlertas(
    @CurrentUser() user: JwtPayload,
    @Query('localId') localId?: string,
  ) {
    return this.service.getAlertas(user, localId);
  }

  @Get('stock/producto/:productoId')
  @ApiOperation({ summary: 'Stock de un producto en todos los locales' })
  findByProducto(
    @Param('productoId', ParseUUIDPipe) productoId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findByProducto(productoId, user);
  }

  @Get('stock/:localId')
  @ApiOperation({ summary: 'Stock de todos los productos en un local' })
  findByLocal(
    @Param('localId', ParseUUIDPipe) localId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findByLocal(localId, user);
  }

  @Post('ajuste')
  @ApiOperation({ summary: 'Ajuste manual de stock' })
  ajustar(
    @Body() dto: AjusteStockDto,
    @CurrentUser() user: JwtPayload,
    @Query('localId', ParseUUIDPipe) localId: string,
  ) {
    return this.service.ajustar(dto, localId, user);
  }

  @Post('transferencia')
  @ApiOperation({ summary: 'Transferir stock entre locales' })
  transferir(
    @Body() dto: TransferenciaStockDto,
    @CurrentUser() user: JwtPayload,
    @Query('localOrigenId', ParseUUIDPipe) localOrigenId: string,
  ) {
    return this.service.transferir(dto, localOrigenId, user);
  }
}
