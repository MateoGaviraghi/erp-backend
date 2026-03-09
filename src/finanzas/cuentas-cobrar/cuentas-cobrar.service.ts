import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PaginationDto, buildMeta } from '../../common/dto/pagination.dto.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@Injectable()
export class CuentasCobrarService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(currentUser: JwtPayload, pagination: PaginationDto) {
    const where = {
      empresaId: currentUser.empresaId,
      ...(pagination.localId && { localId: pagination.localId }),
    };

    const [data, total] = await Promise.all([
      this.prisma.cuentaPorCobrar.findMany({
        where,
        include: {
          cliente: { select: { id: true, name: true } },
          factura: { select: { id: true, numero: true, fecha: true } },
        },
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { fechaVencimiento: 'asc' },
      }),
      this.prisma.cuentaPorCobrar.count({ where }),
    ]);

    return { data, meta: buildMeta(total, pagination) };
  }

  async getResumen(currentUser: JwtPayload) {
    const cuentas = await this.prisma.cuentaPorCobrar.findMany({
      where: {
        empresaId: currentUser.empresaId,
        estado: { in: ['PENDIENTE', 'PARCIAL', 'VENCIDA'] },
      },
      select: {
        estado: true,
        montoSaldo: true,
        diasVencido: true,
      },
    });

    const resumen = {
      totalPendiente: 0,
      totalVencido: 0,
      cantidadPendiente: 0,
      cantidadVencida: 0,
    };

    for (const c of cuentas) {
      const saldo = Number(c.montoSaldo);
      if (c.estado === 'VENCIDA' || c.diasVencido > 0) {
        resumen.totalVencido += saldo;
        resumen.cantidadVencida++;
      } else {
        resumen.totalPendiente += saldo;
        resumen.cantidadPendiente++;
      }
    }

    return { data: resumen };
  }
}
