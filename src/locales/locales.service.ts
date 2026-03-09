import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateLocalDto, UpdateLocalDto } from './dto/create-local.dto.js';
import { PaginationDto, buildMeta } from '../common/dto/pagination.dto.js';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';

@Injectable()
export class LocalesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(currentUser: JwtPayload, pagination: PaginationDto) {
    const where = {
      empresaId: currentUser.empresaId,
      ...(pagination.search && {
        OR: [
          {
            name: { contains: pagination.search, mode: 'insensitive' as const },
          },
          {
            city: { contains: pagination.search, mode: 'insensitive' as const },
          },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.local.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { usuarios: true, clientes: true },
          },
        },
      }),
      this.prisma.local.count({ where }),
    ]);

    return { data, meta: buildMeta(total, pagination) };
  }

  async findOne(id: string, currentUser: JwtPayload) {
    const local = await this.prisma.local.findFirst({
      where: { id, empresaId: currentUser.empresaId },
      include: {
        _count: {
          select: {
            usuarios: true,
            clientes: true,
            proveedores: true,
            stock: true,
          },
        },
      },
    });

    if (!local) throw new NotFoundException('Local no encontrado');
    return { data: local };
  }

  async create(dto: CreateLocalDto, currentUser: JwtPayload) {
    const exists = await this.prisma.local.findFirst({
      where: { empresaId: currentUser.empresaId, code: dto.code },
    });
    if (exists)
      throw new ConflictException(
        `Ya existe un local con el código ${dto.code}`,
      );

    const local = await this.prisma.local.create({
      data: { ...dto, empresaId: currentUser.empresaId },
    });
    return { data: local };
  }

  async update(id: string, dto: UpdateLocalDto, currentUser: JwtPayload) {
    await this.findOne(id, currentUser);

    const updated = await this.prisma.local.update({
      where: { id },
      data: dto,
    });
    return { data: updated };
  }
}
