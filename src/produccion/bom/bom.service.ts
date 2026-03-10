import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateBomDto } from './dto/create-bom.dto.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@Injectable()
export class BomService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(currentUser: JwtPayload) {
    const data = await this.prisma.bOM.findMany({
      where: { empresaId: currentUser.empresaId, activo: true },
      include: {
        producto: { select: { id: true, name: true, code: true } },
        _count: { select: { materiales: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { data };
  }

  async findOne(id: string, currentUser: JwtPayload) {
    const bom = await this.prisma.bOM.findFirst({
      where: { id, empresaId: currentUser.empresaId },
      include: {
        producto: { select: { id: true, name: true, code: true } },
        materiales: {
          include: {
            material: {
              select: {
                id: true,
                nombre: true,
                code: true,
                costoUnitario: true,
                unidad: true,
              },
            },
          },
        },
      },
    });
    if (!bom) throw new NotFoundException('BOM no encontrado');

    const costoEstimado = bom.materiales.reduce(
      (sum, item) => sum + Number(item.cantidad) * Number(item.costoUnitario),
      0,
    );

    return { data: { ...bom, costoEstimado } };
  }

  async create(dto: CreateBomDto, localId: string, currentUser: JwtPayload) {
    const producto = await this.prisma.producto.findFirst({
      where: { id: dto.productoId, empresaId: currentUser.empresaId },
    });
    if (!producto)
      throw new NotFoundException('Producto terminado no encontrado');

    const existe = await this.prisma.bOM.findFirst({
      where: { empresaId: currentUser.empresaId, code: dto.code },
    });
    if (existe)
      throw new ConflictException(
        `Ya existe un BOM con el código "${dto.code}"`,
      );

    const materialIds = dto.items.map((i) => i.materialId);
    const materiales = await this.prisma.materialProduccion.findMany({
      where: { id: { in: materialIds }, empresaId: currentUser.empresaId },
    });
    if (materiales.length !== materialIds.length) {
      throw new BadRequestException(
        'Uno o más materiales no existen en esta empresa',
      );
    }

    const materialesMap = new Map(materiales.map((m) => [m.id, m]));
    const costoTotal = dto.items.reduce((sum, item) => {
      const mat = materialesMap.get(item.materialId)!;
      return sum + Number(item.cantidad) * Number(mat.costoUnitario);
    }, 0);

    const bom = await this.prisma.bOM.create({
      data: {
        empresaId: currentUser.empresaId,
        localId,
        code: dto.code,
        productoId: dto.productoId,
        productoNombre: producto.name,
        cantidad: dto.cantidad,
        unidad: dto.unidad,
        version: dto.version ?? 1,
        costoTotal,
        materiales: {
          create: dto.items.map((item) => {
            const mat = materialesMap.get(item.materialId)!;
            return {
              materialId: item.materialId,
              materialNombre: mat.nombre,
              materialCode: mat.code,
              cantidad: item.cantidad,
              unidad: item.unidad ?? mat.unidad,
              costoUnitario: Number(mat.costoUnitario),
              costoTotal: Number(item.cantidad) * Number(mat.costoUnitario),
            };
          }),
        },
      },
      include: {
        materiales: {
          include: {
            material: { select: { nombre: true, code: true } },
          },
        },
      },
    });

    return { data: bom };
  }
}
