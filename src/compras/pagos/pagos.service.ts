import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreatePagoProveedorDto } from './dto/create-pago.dto.js';
import { PaginationDto, buildMeta } from '../../common/dto/pagination.dto.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

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

    const pago = await this.prisma.pagoProveedor.create({
      data: {
        empresaId: currentUser.empresaId,
        localId: proveedor.localId,
        proveedorId: dto.proveedorId,
        monto: dto.monto,
        metodoPago: dto.metodoPago,
        fecha: dto.fecha ? new Date(dto.fecha) : new Date(),
        referencia: dto.referencia,
        notas: dto.notas,
        creadoPor: currentUser.nombre,
      },
    });

    return { data: pago };
  }
}
