import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { ReportesService } from './reportes.service.js';
import {
  ReporteFiltrosDto,
  FormatoReporte,
} from './dto/reporte-filtros.dto.js';
import { ExcelBuilder } from './builders/excel.builder.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { UserRole } from '@prisma/client';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';

@ApiTags('reportes')
@ApiBearerAuth('JWT-auth')
@Controller('reportes')
export class ReportesController {
  constructor(private readonly service: ReportesService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'KPIs ejecutivos del mes en curso' })
  dashboard(
    @Query('localId') localId: string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.dashboard(user, localId);
  }

  @Get('ventas')
  @ApiOperation({
    summary: 'Reporte de ventas con agrupación por cliente y mes',
  })
  async ventas(
    @Query() dto: ReporteFiltrosDto,
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    const resultado = await this.service.reporteVentas(dto, user);
    if (dto.formato === FormatoReporte.XLSX) {
      const filas: Record<string, unknown>[] = resultado.data.facturas.map(
        (f) => ({
          numero: f.numero,
          fecha: new Date(f.fecha).toLocaleDateString('es-AR'),
          cliente: f.cliente,
          subtotal: f.subtotal,
          descuento: f.descuento,
          total: f.total,
          estado: f.estado,
        }),
      );
      const totales: Record<string, unknown> = {
        numero: 'TOTAL',
        fecha: '',
        cliente: '',
        subtotal: '',
        descuento: '',
        total: resultado.data.resumen.totalFacturado,
        estado: '',
      };
      return ExcelBuilder.build(
        res,
        'Reporte_Ventas',
        'Ventas',
        [
          { header: 'Número', key: 'numero', width: 18 },
          { header: 'Fecha', key: 'fecha', width: 12 },
          { header: 'Cliente', key: 'cliente', width: 35 },
          { header: 'Subtotal', key: 'subtotal', width: 14 },
          { header: 'Descuento', key: 'descuento', width: 12 },
          { header: 'Total', key: 'total', width: 14 },
          { header: 'Estado', key: 'estado', width: 12 },
        ],
        filas,
        totales,
      );
    }
    return resultado;
  }

  @Get('compras')
  @ApiOperation({ summary: 'Reporte de compras por período y proveedor' })
  async compras(
    @Query() dto: ReporteFiltrosDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.reporteCompras(dto, user);
  }

  @Get('inventario')
  @ApiOperation({ summary: 'Stock valorizado actual' })
  async inventario(
    @Query() dto: ReporteFiltrosDto,
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    const resultado = await this.service.reporteInventario(dto, user);
    if (dto.formato === FormatoReporte.XLSX) {
      return ExcelBuilder.build(
        res,
        'Reporte_Inventario',
        'Stock',
        [
          { header: 'SKU', key: 'sku', width: 15 },
          { header: 'Nombre', key: 'nombre', width: 40 },
          { header: 'Categoría', key: 'categoria', width: 20 },
          { header: 'Depósito', key: 'deposito', width: 20 },
          { header: 'Local', key: 'local', width: 20 },
          { header: 'Cantidad', key: 'cantidad', width: 12 },
          { header: 'Costo Unit.', key: 'costo', width: 14 },
          { header: 'Total Valorizado', key: 'valorizado', width: 18 },
          { header: 'Alerta', key: 'alertaStock', width: 10 },
        ],
        resultado.data.items as unknown as Record<string, unknown>[],
        {
          sku: 'TOTAL',
          nombre: '',
          categoria: '',
          deposito: '',
          local: '',
          cantidad: '',
          costo: '',
          valorizado: resultado.data.resumen.valorizacionTotal,
          alertaStock: `${resultado.data.resumen.productosConAlerta} alertas`,
        },
      );
    }
    return resultado;
  }

  @Get('rrhh')
  @Roles(UserRole.Administrador)
  @ApiOperation({ summary: 'Reporte de liquidaciones del período [Admin]' })
  async rrhh(
    @Query() dto: ReporteFiltrosDto,
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    const resultado = await this.service.reporteRrhh(dto, user);
    if (dto.formato === FormatoReporte.XLSX) {
      return ExcelBuilder.build(
        res,
        'Reporte_RRHH',
        'Liquidaciones',
        [
          { header: 'Legajo', key: 'legajo', width: 12 },
          { header: 'Nombre', key: 'nombre', width: 35 },
          { header: 'Cargo', key: 'cargo', width: 25 },
          { header: 'Departamento', key: 'departamento', width: 20 },
          { header: 'Período', key: 'periodo', width: 12 },
          { header: 'Bruto', key: 'totalBruto', width: 14 },
          { header: 'Descuentos', key: 'totalDescuentos', width: 14 },
          { header: 'Neto', key: 'totalNeto', width: 14 },
          { header: 'Estado', key: 'estado', width: 12 },
        ],
        resultado.data.liquidaciones as unknown as Record<string, unknown>[],
        {
          legajo: '',
          nombre: 'TOTAL',
          cargo: '',
          departamento: '',
          periodo: '',
          totalBruto: resultado.data.resumen.totalBruto,
          totalDescuentos: resultado.data.resumen.totalDescuentos,
          totalNeto: resultado.data.resumen.totalNeto,
          estado: '',
        },
      );
    }
    return resultado;
  }

  @Get('resultados')
  @Roles(UserRole.Administrador, UserRole.Contador)
  @ApiOperation({
    summary: 'Estado de resultados del período [Admin/Contador]',
  })
  resultados(@Query() dto: ReporteFiltrosDto, @CurrentUser() user: JwtPayload) {
    return this.service.reporteResultados(dto, user);
  }
}
