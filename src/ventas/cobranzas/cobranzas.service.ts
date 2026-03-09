import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateCobranzaDto } from './dto/create-cobranza.dto.js';
import { PaginationDto, buildMeta } from '../../common/dto/pagination.dto.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';
import { EstadoFactura } from '@prisma/client';

@Injectable()
export class CobranzasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(currentUser: JwtPayload, pagination: PaginationDto) {
    const where = {
      empresaId: currentUser.empresaId,
      ...(pagination.localId && { localId: pagination.localId }),
    };

    const [data, total] = await Promise.all([
      this.prisma.cobranza.findMany({
        where,
        include: {
          factura: {
            include: { cliente: { select: { id: true, name: true } } },
          },
        },
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { fecha: 'desc' },
      }),
      this.prisma.cobranza.count({ where }),
    ]);

    return { data, meta: buildMeta(total, pagination) };
  }

  async create(dto: CreateCobranzaDto, currentUser: JwtPayload) {
    const factura = await this.prisma.factura.findFirst({
      where: {
        id: dto.facturaId,
        empresaId: currentUser.empresaId,
        estado: { not: EstadoFactura.ANULADA },
      },
      include: { cobranzas: true },
    });

    if (!factura)
      throw new NotFoundException('Factura no encontrada o anulada');

    const totalCobrado = factura.cobranzas.reduce(
      (sum, c) => sum + Number(c.monto),
      0,
    );
    const saldoPendiente = Number(factura.total) - totalCobrado;

    if (dto.monto > saldoPendiente + 0.001) {
      throw new BadRequestException(
        `El monto (${dto.monto}) supera el saldo pendiente (${saldoPendiente.toFixed(2)})`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const cobranza = await tx.cobranza.create({
        data: {
          empresaId: currentUser.empresaId,
          localId: factura.localId,
          facturaId: factura.id,
          monto: dto.monto,
          metodoPago: dto.metodoPago,
          fecha: dto.fecha ? new Date(dto.fecha) : new Date(),
          referencia: dto.referencia,
          notas: dto.notas,
          creadoPor: currentUser.nombre,
        },
      });

      const nuevoTotalCobrado = totalCobrado + dto.monto;
      const nuevoEstado =
        Math.abs(nuevoTotalCobrado - Number(factura.total)) < 0.01
          ? EstadoFactura.PAGADA
          : EstadoFactura.PARCIAL;

      await tx.factura.update({
        where: { id: factura.id },
        data: { estado: nuevoEstado },
      });

      return { data: cobranza };
    });
  }
}
