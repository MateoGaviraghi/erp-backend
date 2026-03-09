import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { MovimientoCajaDto } from './dto/movimiento-caja.dto.js';
import { PaginationDto, buildMeta } from '../../common/dto/pagination.dto.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@Injectable()
export class CajaService {
  constructor(private readonly prisma: PrismaService) {}

  /** Busca o crea la caja abierta del día para el local dado */
  private async getOrCreateCaja(localId: string, currentUser: JwtPayload) {
    const hoy = new Date();
    hoy.setUTCHours(0, 0, 0, 0);

    return this.prisma.cajaLocal.upsert({
      where: { localId_fecha: { localId, fecha: hoy } },
      create: {
        empresaId: currentUser.empresaId,
        localId,
        fecha: hoy,
        saldoInicial: 0,
        abrioPor: currentUser.nombre,
      },
      update: {},
    });
  }

  private async calcularSaldo(cajaId: string, saldoInicial: number) {
    const result = await this.prisma.movimientoCaja.groupBy({
      by: ['tipo'],
      where: { cajaId },
      _sum: { monto: true },
    });

    const ingreso = result.find((r) => r.tipo === 'INGRESO')?._sum.monto ?? 0;
    const egreso = result.find((r) => r.tipo === 'EGRESO')?._sum.monto ?? 0;
    return saldoInicial + Number(ingreso) - Number(egreso);
  }

  async getSaldo(localId: string, currentUser: JwtPayload) {
    const caja = await this.getOrCreateCaja(localId, currentUser);
    const saldo = await this.calcularSaldo(caja.id, Number(caja.saldoInicial));
    return { data: { ...caja, saldo } };
  }

  async getMovimientos(
    localId: string,
    currentUser: JwtPayload,
    pagination: PaginationDto,
  ) {
    const caja = await this.getOrCreateCaja(localId, currentUser);
    const where = { cajaId: caja.id };

    const [data, total] = await Promise.all([
      this.prisma.movimientoCaja.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.movimientoCaja.count({ where }),
    ]);

    return { data, meta: buildMeta(total, pagination) };
  }

  async registrarMovimiento(
    localId: string,
    dto: MovimientoCajaDto,
    currentUser: JwtPayload,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const hoy = new Date();
      hoy.setUTCHours(0, 0, 0, 0);

      let caja = await tx.cajaLocal.findUnique({
        where: { localId_fecha: { localId, fecha: hoy } },
      });
      if (!caja) {
        caja = await tx.cajaLocal.create({
          data: {
            empresaId: currentUser.empresaId,
            localId,
            fecha: hoy,
            saldoInicial: 0,
            abrioPor: currentUser.nombre,
          },
        });
      }

      // Calcular saldo actual
      const result = await tx.movimientoCaja.groupBy({
        by: ['tipo'],
        where: { cajaId: caja.id },
        _sum: { monto: true },
      });
      const ingreso = result.find((r) => r.tipo === 'INGRESO')?._sum.monto ?? 0;
      const egreso = result.find((r) => r.tipo === 'EGRESO')?._sum.monto ?? 0;
      const saldoActual =
        Number(caja.saldoInicial) + Number(ingreso) - Number(egreso);

      if (dto.tipo === 'EGRESO' && saldoActual < dto.monto) {
        throw new BadRequestException(
          `Saldo insuficiente en caja. Disponible: ${saldoActual.toFixed(2)}`,
        );
      }

      const movimiento = await tx.movimientoCaja.create({
        data: {
          cajaId: caja.id,
          tipo: dto.tipo,
          monto: dto.monto,
          concepto: dto.concepto,
          referencia: dto.referencia,
          creadoPor: currentUser.nombre,
        },
      });

      const saldoNuevo =
        dto.tipo === 'INGRESO'
          ? saldoActual + dto.monto
          : saldoActual - dto.monto;

      return {
        data: {
          movimiento,
          saldoAnterior: saldoActual,
          saldoNuevo,
        },
      };
    });
  }
}
