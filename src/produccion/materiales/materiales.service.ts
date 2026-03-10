import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  CreateMaterialProduccionDto,
  UpdateMaterialProduccionDto,
} from './dto/create-material.dto.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@Injectable()
export class MaterialesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(currentUser: JwtPayload) {
    const data = await this.prisma.materialProduccion.findMany({
      where: { empresaId: currentUser.empresaId, active: true },
      orderBy: { nombre: 'asc' },
    });
    return { data };
  }

  async create(
    dto: CreateMaterialProduccionDto,
    localId: string,
    currentUser: JwtPayload,
  ) {
    const existe = await this.prisma.materialProduccion.findFirst({
      where: { empresaId: currentUser.empresaId, code: dto.code },
    });
    if (existe) {
      throw new ConflictException(
        `Ya existe un material con el código "${dto.code}"`,
      );
    }

    const data = await this.prisma.materialProduccion.create({
      data: {
        empresaId: currentUser.empresaId,
        localId,
        code: dto.code,
        nombre: dto.nombre,
        tipo: dto.tipo,
        unidad: dto.unidad,
        stockActual: dto.stockActual ?? 0,
        stockMinimo: dto.stockMinimo ?? 0,
        stockMaximo: dto.stockMaximo ?? 0,
        costoUnitario: dto.costoUnitario ?? 0,
        proveedorId: dto.proveedorId ?? null,
      },
    });
    return { data };
  }

  async update(
    id: string,
    dto: UpdateMaterialProduccionDto,
    currentUser: JwtPayload,
  ) {
    await this.prisma.materialProduccion.findFirstOrThrow({
      where: { id, empresaId: currentUser.empresaId },
    });

    const data = await this.prisma.materialProduccion.update({
      where: { id },
      data: {
        ...(dto.nombre && { nombre: dto.nombre }),
        ...(dto.tipo && { tipo: dto.tipo }),
        ...(dto.unidad && { unidad: dto.unidad }),
        ...(dto.stockActual !== undefined && { stockActual: dto.stockActual }),
        ...(dto.stockMinimo !== undefined && { stockMinimo: dto.stockMinimo }),
        ...(dto.stockMaximo !== undefined && { stockMaximo: dto.stockMaximo }),
        ...(dto.costoUnitario !== undefined && {
          costoUnitario: dto.costoUnitario,
        }),
        ...(dto.proveedorId !== undefined && { proveedorId: dto.proveedorId }),
      },
    });
    return { data };
  }
}
