import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { MovimientoCajaDto } from './dto/movimiento-caja.dto.js';
import { PaginationDto, buildMeta } from '../../common/dto/pagination.dto.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@Injectable()
export class CajaService {
  constructor(private readonly prisma: PrismaService) {}

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
    return {
      data: {
        id: caja.id,
        localId: caja.localId,
        empresaId: caja.empresaId,
        fecha: caja.fecha,
        saldo,
        saldoInicial: Number(caja.saldoInicial),
        abierta: caja.abierta,
      },
    };
  }

  async getMovimientos(
    localId: string,
    currentUser: JwtPayload,
    pagination: PaginationDto,
  ) {
    const caja = await this.getOrCreateCaja(localId, currentUser);
    const where = { cajaId: caja.id };

    const [movimientos, total] = await Promise.all([
      this.prisma.movimientoCaja.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.movimientoCaja.count({ where }),
    ]);

    const data = movimientos.map((m) => ({
      id: m.id,
      tipo: m.tipo,
      concepto: m.concepto,
      monto: Number(m.monto),
      referencia: m.referencia,
      saldoAnterior: Number(m.saldoAnterior),
      saldoNuevo: Number(m.saldoNuevo),
      creadoPor: m.creadoPor,
      fecha: m.createdAt,
      createdAt: m.createdAt,
    }));

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
      const saldoAnterior =
        Number(caja.saldoInicial) + Number(ingreso) - Number(egreso);

      if (dto.tipo === 'EGRESO' && saldoAnterior < dto.monto) {
        throw new BadRequestException(
          `Saldo insuficiente en caja. Disponible: ${saldoAnterior.toFixed(2)}`,
        );
      }

      const saldoNuevo =
        dto.tipo === 'INGRESO'
          ? saldoAnterior + dto.monto
          : saldoAnterior - dto.monto;

      const movimiento = await tx.movimientoCaja.create({
        data: {
          cajaId: caja.id,
          tipo: dto.tipo,
          monto: dto.monto,
          concepto: dto.concepto,
          referencia: dto.referencia,
          saldoAnterior,
          saldoNuevo,
          creadoPor: currentUser.nombre,
        },
      });

      return {
        data: {
          id: movimiento.id,
          tipo: movimiento.tipo,
          concepto: movimiento.concepto,
          monto: Number(movimiento.monto),
          referencia: movimiento.referencia,
          saldoAnterior,
          saldoNuevo,
          creadoPor: movimiento.creadoPor,
          fecha: movimiento.createdAt,
          createdAt: movimiento.createdAt,
        },
      };
    });
  }
}
