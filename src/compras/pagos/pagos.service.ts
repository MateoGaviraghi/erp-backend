import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreatePagoProveedorDto } from './dto/create-pago.dto.js';
import { PaginationDto, buildMeta } from '../../common/dto/pagination.dto.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';
import { EstadoCuentaPagar } from '@prisma/client';

@Injectable()
export class PagosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(currentUser: JwtPayload, pagination: PaginationDto) {
    const where = {
      empresaId: currentUser.empresaId,
      ...(pagination.localId && { localId: pagination.localId }),
    };

    const [data, total] = await Promise.all([
      this.prisma.pagoProveedor.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { fecha: 'desc' },
      }),
      this.prisma.pagoProveedor.count({ where }),
    ]);

    return { data, meta: buildMeta(total, pagination) };
  }

  async create(dto: CreatePagoProveedorDto, currentUser: JwtPayload) {
    const proveedor = await this.prisma.proveedor.findFirst({
      where: { id: dto.proveedorId, empresaId: currentUser.empresaId },
    });
    if (!proveedor) throw new NotFoundException('Proveedor no encontrado');

    return this.prisma.$transaction(async (tx) => {
      const pago = await tx.pagoProveedor.create({
        data: {
          empresaId: currentUser.empresaId,
          localId: proveedor.localId,
          proveedorId: dto.proveedorId,
          cuentaPagarId: dto.cuentaPagarId ?? null,
          monto: dto.monto,
          metodoPago: dto.metodoPago,
          fecha: dto.fecha ? new Date(dto.fecha) : new Date(),
          referencia: dto.referencia,
          notas: dto.notas,
          creadoPor: currentUser.nombre,
        },
      });

      if (dto.cuentaPagarId) {
        const cxp = await tx.cuentaPorPagar.findFirst({
          where: { id: dto.cuentaPagarId, empresaId: currentUser.empresaId },
        });
        if (!cxp) throw new NotFoundException('Cuenta por pagar no encontrada');

        if (cxp.estado === 'PAGADA') {
          throw new BadRequestException('La cuenta por pagar ya está completamente pagada');
        }

        const nuevoMontoPagado = Number(cxp.montoPagado) + dto.monto;
        const nuevoSaldo = Number(cxp.montoTotal) - nuevoMontoPagado;
        const nuevoEstado: EstadoCuentaPagar =
          nuevoSaldo <= 0.01 ? 'PAGADA' : 'PARCIAL';

        await tx.cuentaPorPagar.update({
          where: { id: cxp.id },
          data: {
            montoPagado: nuevoMontoPagado,
            montoSaldo: Math.max(0, nuevoSaldo),
            estado: nuevoEstado,
          },
        });
      }

      return { data: pago };
    });
  }
}
