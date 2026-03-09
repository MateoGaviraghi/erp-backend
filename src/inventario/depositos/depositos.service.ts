import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  CreateDepositoDto,
  UpdateDepositoDto,
} from './dto/create-deposito.dto.js';
import { PaginationDto, buildMeta } from '../../common/dto/pagination.dto.js';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface.js';

@Injectable()
export class DepositosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(currentUser: JwtPayload, pagination: PaginationDto) {
    const where: Record<string, unknown> = {
      empresaId: currentUser.empresaId,
      ...(pagination.localId && { localId: pagination.localId }),
      ...(pagination.active !== undefined && { active: pagination.active }),
      ...(pagination.search && {
        OR: [
          { name: { contains: pagination.search, mode: 'insensitive' } },
          { code: { contains: pagination.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.deposito.findMany({
        where,
        include: {
          local: { select: { id: true, name: true } },
          _count: { select: { stock: true } },
        },
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.deposito.count({ where }),
    ]);

    return { data, meta: buildMeta(total, pagination) };
  }

  async findOne(id: string, currentUser: JwtPayload) {
    const deposito = await this.prisma.deposito.findFirst({
      where: { id, empresaId: currentUser.empresaId },
      include: {
        local: { select: { id: true, name: true } },
        _count: { select: { stock: true } },
      },
    });
    if (!deposito) throw new NotFoundException('Depósito no encontrado');
    return { data: deposito };
  }

  async create(dto: CreateDepositoDto, currentUser: JwtPayload) {
    const exists = await this.prisma.deposito.findUnique({
      where: {
        empresaId_code: { empresaId: currentUser.empresaId, code: dto.code },
      },
    });
    if (exists)
      throw new ConflictException(
        `Ya existe un depósito con el código ${dto.code}`,
      );

    const deposito = await this.prisma.deposito.create({
      data: { ...dto, empresaId: currentUser.empresaId },
      include: { local: { select: { id: true, name: true } } },
    });
    return { data: deposito };
  }

  async update(id: string, dto: UpdateDepositoDto, currentUser: JwtPayload) {
    await this.findOne(id, currentUser);
    const updated = await this.prisma.deposito.update({
      where: { id },
      data: dto,
      include: { local: { select: { id: true, name: true } } },
    });
    return { data: updated };
  }
}
