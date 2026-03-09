import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  CreateProductoDto,
  UpdateProductoDto,
} from './dto/create-producto.dto.js';
import { FilterProductoDto } from './dto/filter-producto.dto.js';
import { buildMeta } from '../../common/dto/pagination.dto.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@Injectable()
export class ProductosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(currentUser: JwtPayload, filter: FilterProductoDto) {
    const where: Record<string, unknown> = {
      empresaId: currentUser.empresaId,
      ...(filter.active !== undefined && { active: filter.active }),
      ...(filter.tipo && { tipo: filter.tipo }),
      ...(filter.categoriaId && { categoriaId: filter.categoriaId }),
      ...(filter.search && {
        OR: [
          { name: { contains: filter.search, mode: 'insensitive' } },
          { code: { contains: filter.search, mode: 'insensitive' } },
          { description: { contains: filter.search, mode: 'insensitive' } },
        ],
      }),
    };

    const data = await this.prisma.producto.findMany({
      where,
      include: {
        categoria: { select: { id: true, name: true } },
        stock: {
          where: filter.localId ? { localId: filter.localId } : {},
          select: { cantidad: true, localId: true, depositoId: true },
        },
      },
      skip: filter.skip,
      take: filter.limit,
      orderBy: { name: 'asc' },
    });

    // Enriquecer con stockTotal calculado y filtrar por stock bajo si se solicitó
    const enriched = data
      .map((p) => ({
        ...p,
        stockTotal: p.stock.reduce((sum, s) => sum + Number(s.cantidad), 0),
        alertaStockBajo:
          p.stock.reduce((sum, s) => sum + Number(s.cantidad), 0) <= p.minStock,
      }))
      .filter((p) => !filter.stockBajo || p.alertaStockBajo);

    const total = await this.prisma.producto.count({ where });
    return { data: enriched, meta: buildMeta(total, filter) };
  }

  async findOne(id: string, currentUser: JwtPayload) {
    const producto = await this.prisma.producto.findFirst({
      where: { id, empresaId: currentUser.empresaId },
      include: {
        categoria: true,
        stock: {
          include: {
            local: { select: { id: true, name: true } },
            deposito: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!producto) throw new NotFoundException('Producto no encontrado');
    return { data: producto };
  }

  async create(dto: CreateProductoDto, currentUser: JwtPayload) {
    const exists = await this.prisma.producto.findFirst({
      where: { empresaId: currentUser.empresaId, code: dto.code },
    });
    if (exists)
      throw new ConflictException(
        `Ya existe un producto con el código ${dto.code}`,
      );

    const producto = await this.prisma.producto.create({
      data: { ...dto, empresaId: currentUser.empresaId },
      include: { categoria: true },
    });
    return { data: producto };
  }

  async update(id: string, dto: UpdateProductoDto, currentUser: JwtPayload) {
    await this.findOne(id, currentUser);
    const updated = await this.prisma.producto.update({
      where: { id },
      data: dto,
      include: { categoria: true },
    });
    return { data: updated };
  }
}
