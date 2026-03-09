import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  CreateCategoriaDto,
  UpdateCategoriaDto,
} from './dto/create-categoria.dto.js';
import { PaginationDto, buildMeta } from '../../common/dto/pagination.dto.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@Injectable()
export class CategoriasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(currentUser: JwtPayload, pagination: PaginationDto) {
    const where: Record<string, unknown> = {
      empresaId: currentUser.empresaId,
      ...(pagination.search && {
        name: { contains: pagination.search, mode: 'insensitive' },
      }),
      ...(pagination.active !== undefined && { active: pagination.active }),
    };

    const [data, total] = await Promise.all([
      this.prisma.categoria.findMany({
        where,
        include: { _count: { select: { productos: true } } },
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.categoria.count({ where }),
    ]);

    return { data, meta: buildMeta(total, pagination) };
  }

  async findOne(id: string, currentUser: JwtPayload) {
    const categoria = await this.prisma.categoria.findFirst({
      where: { id, empresaId: currentUser.empresaId },
      include: { _count: { select: { productos: true } } },
    });
    if (!categoria) throw new NotFoundException('Categoría no encontrada');
    return { data: categoria };
  }

  async create(dto: CreateCategoriaDto, currentUser: JwtPayload) {
    const exists = await this.prisma.categoria.findUnique({
      where: {
        empresaId_name: { empresaId: currentUser.empresaId, name: dto.name },
      },
    });
    if (exists)
      throw new ConflictException(
        `Ya existe una categoría con el nombre "${dto.name}"`,
      );

    const categoria = await this.prisma.categoria.create({
      data: { ...dto, empresaId: currentUser.empresaId },
    });
    return { data: categoria };
  }

  async update(id: string, dto: UpdateCategoriaDto, currentUser: JwtPayload) {
    await this.findOne(id, currentUser);
    const updated = await this.prisma.categoria.update({
      where: { id },
      data: dto,
    });
    return { data: updated };
  }
}
