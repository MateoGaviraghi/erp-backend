import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateMovimientoBancarioDto } from './dto/create-movimiento-bancario.dto.js';
import { PaginationDto, buildMeta } from '../../common/dto/pagination.dto.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@Injectable()
export class BancosService {
  constructor(private readonly prisma: PrismaService) {}

  async getCuentas(currentUser: JwtPayload) {
    const data = await this.prisma.cuentaBancaria.findMany({
      where: { empresaId: currentUser.empresaId, active: true },
      include: {
        banco: { select: { id: true, nombre: true } },
        _count: { select: { movimientos: true } },
      },
      orderBy: { banco: { nombre: 'asc' } },
    });
    return { data };
  }

  async getMovimientos(
    cuentaId: string,
    currentUser: JwtPayload,
    pagination: PaginationDto,
  ) {
    const cuenta = await this.prisma.cuentaBancaria.findFirst({
      where: { id: cuentaId, empresaId: currentUser.empresaId },
    });
    if (!cuenta) throw new NotFoundException('Cuenta bancaria no encontrada');

    const where = { cuentaBancariaId: cuentaId };
    const [data, total] = await Promise.all([
      this.prisma.movimientoBancario.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { fecha: 'desc' },
      }),
      this.prisma.movimientoBancario.count({ where }),
    ]);

    return { data, meta: buildMeta(total, pagination) };
  }

  async registrarMovimiento(
    dto: CreateMovimientoBancarioDto,
    currentUser: JwtPayload,
  ) {
    const cuenta = await this.prisma.cuentaBancaria.findFirst({
      where: { id: dto.cuentaBancariaId, empresaId: currentUser.empresaId },
    });
    if (!cuenta) throw new NotFoundException('Cuenta bancaria no encontrada');

    return this.prisma.$transaction(async (tx) => {
      const saldoActual = Number(cuenta.saldo);
      let nuevoSaldo: number;

      if (dto.tipo === 'CREDITO') {
        nuevoSaldo = saldoActual + dto.monto;
      } else {
        if (saldoActual < dto.monto) {
          throw new BadRequestException(
            `Saldo bancario insuficiente. Disponible: ${saldoActual.toFixed(2)}`,
          );
        }
        nuevoSaldo = saldoActual - dto.monto;
      }

      await tx.cuentaBancaria.update({
        where: { id: cuenta.id },
        data: { saldo: nuevoSaldo },
      });

      const movimiento = await tx.movimientoBancario.create({
        data: {
          empresaId: currentUser.empresaId,
          cuentaBancariaId: cuenta.id,
          tipo: dto.tipo,
          monto: dto.monto,
          fecha: dto.fecha ? new Date(dto.fecha) : new Date(),
          concepto: dto.concepto,
          referencia: dto.referencia,
          saldoParcial: nuevoSaldo,
        },
      });

      return { data: { movimiento, saldoNuevo: nuevoSaldo } };
    });
  }
}
