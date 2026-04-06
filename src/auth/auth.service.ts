import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto.js';
import { JwtPayload } from './interfaces/jwt-payload.interface.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });

    if (!usuario || !usuario.active) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValid = await bcrypt.compare(dto.password, usuario.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const tokens = await this.generateTokens(usuario);

    await this.prisma.auditoriaLog.create({
      data: {
        empresaId: usuario.empresaId,
        usuarioId: usuario.id,
        userName: usuario.nombre,
        userRole: usuario.rol,
        tipo: 'LOGIN',
        modulo: 'Auth',
        accion: 'Inicio de sesión exitoso',
        ipAddress: 'N/A',
      },
    });

    return {
      accessToken: tokens.accessToken,
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        empresaId: usuario.empresaId,
        localId: usuario.localId,
      },
    };
  }

  async logout(usuarioId: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { empresaId: true, nombre: true },
    });

    if (usuario) {
      await this.prisma.auditoriaLog.create({
        data: {
          empresaId: usuario.empresaId,
          usuarioId,
          userName: usuario.nombre,
          userRole: 'Sistema',
          tipo: 'LOGOUT',
          modulo: 'Auth',
          accion: 'Cierre de sesión',
          ipAddress: 'N/A',
        },
      });
    }

    return { message: 'Sesión cerrada correctamente' };
  }

  private async generateTokens(usuario: {
    id: string;
    email: string;
    nombre: string;
    rol: string;
    empresaId: string;
    localId: string | null;
  }) {
    const payload: JwtPayload = {
      sub: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol as JwtPayload['rol'],
      empresaId: usuario.empresaId,
      localId: usuario.localId,
    };

    const accessToken = await this.jwtService.signAsync(payload as object, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
    });

    return { accessToken };
  }
}
