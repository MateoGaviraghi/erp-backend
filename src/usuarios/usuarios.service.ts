import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';
import { UpdateUsuarioDto } from './dto/update-usuario.dto.js';
import { PaginationDto, buildMeta } from '../common/dto/pagination.dto.js';
import { UserRole } from '@prisma/client';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(currentUser: JwtPayload, pagination: PaginationDto) {
    const isSuper = currentUser.rol === UserRole.Super;
    const targetEmpresaId = isSuper
      ? (pagination.empresaId ?? undefined)
      : currentUser.empresaId;

    const where = {
      ...(targetEmpresaId ? { empresaId: targetEmpresaId } : {}),
      ...(pagination.localId && { localId: pagination.localId }),
      ...(pagination.search && {
        OR: [
          {
            nombre: {
              contains: pagination.search,
              mode: 'insensitive' as const,
            },
          },
          {
            email: {
              contains: pagination.search,
              mode: 'insensitive' as const,
            },
          },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        select: {
          id: true,
          nombre: true,
          email: true,
          rol: true,
          active: true,
          localId: true,
          empresaId: true,
          createdAt: true,
          local: { select: { name: true } },
        },
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { nombre: 'asc' },
      }),
      this.prisma.usuario.count({ where }),
    ]);

    return { data, meta: buildMeta(total, pagination) };
  }

  async findOne(id: string, currentUser: JwtPayload) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        active: true,
        localId: true,
        empresaId: true,
        createdAt: true,
        updatedAt: true,
        local: { select: { name: true } },
      },
    });

    if (
      !usuario ||
      (currentUser.rol !== UserRole.Super &&
        usuario.empresaId !== currentUser.empresaId)
    ) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return { data: usuario };
  }

  async create(dto: CreateUsuarioDto, currentUser: JwtPayload) {
    const exists = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });

    if (exists) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const empresaId =
      currentUser.rol === UserRole.Super && dto.empresaId
        ? dto.empresaId
        : currentUser.empresaId;

    const { empresaId: _ignored, ...dtoWithoutEmpresaId } = dto;

    const usuario = await this.prisma.usuario.create({
      data: {
        ...dtoWithoutEmpresaId,
        password: passwordHash,
        empresaId,
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        active: true,
        localId: true,
        createdAt: true,
      },
    });

    return { data: usuario };
  }

  async update(id: string, dto: UpdateUsuarioDto, currentUser: JwtPayload) {
    await this.findOne(id, currentUser);

    const updated = await this.prisma.usuario.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        active: true,
        localId: true,
        updatedAt: true,
      },
    });

    return { data: updated };
  }

  async changePassword(
    id: string,
    newPassword: string,
    currentUser: JwtPayload,
  ) {
    if (id !== currentUser.sub && currentUser.rol !== 'Administrador') {
      throw new ForbiddenException('Solo puede cambiar su propia contraseña');
    }

    await this.findOne(id, currentUser);
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.usuario.update({
      where: { id },
      data: { password: passwordHash },
    });

    return {
      message:
        'Contraseña actualizada. El usuario debe iniciar sesión nuevamente.',
    };
  }
}
