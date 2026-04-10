import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateEmpresaDto,
  UpdateEmpresaDto,
} from './dto/create-empresa.dto.js';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface.js';
import { UserRole } from '@prisma/client';

@Injectable()
export class EmpresasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(currentUser: JwtPayload) {
    const isSuperOrAdmin =
      currentUser.rol === UserRole.Super ||
      currentUser.rol === UserRole.Administrador;

    const where = isSuperOrAdmin ? {} : { id: currentUser.empresaId };

    const data = await this.prisma.empresa.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return { data };
  }

  async findOne(id: string, currentUser: JwtPayload) {
    if (
      currentUser.rol !== UserRole.Super &&
      currentUser.rol !== UserRole.Administrador &&
      id !== currentUser.empresaId
    ) {
      throw new ForbiddenException('No tiene acceso a esta empresa');
    }

    const empresa = await this.prisma.empresa.findUnique({ where: { id } });

    if (!empresa) throw new NotFoundException('Empresa no encontrada');
    return { data: empresa };
  }

  async create(dto: CreateEmpresaDto) {
    const exists = await this.prisma.empresa.findUnique({
      where: { code: dto.code },
    });
    if (exists)
      throw new ConflictException(
        `Ya existe una empresa con el código ${dto.code}`,
      );

    const cuitExists = await this.prisma.empresa.findUnique({
      where: { taxId: dto.taxId },
    });
    if (cuitExists)
      throw new ConflictException(
        `Ya existe una empresa con el CUIT ${dto.taxId}`,
      );

    const empresa = await this.prisma.empresa.create({ data: dto });
    return { data: empresa };
  }

  async update(id: string, dto: UpdateEmpresaDto, currentUser: JwtPayload) {
    await this.findOne(id, currentUser);

    const updated = await this.prisma.empresa.update({
      where: { id },
      data: dto,
    });
    return { data: updated };
  }
}
