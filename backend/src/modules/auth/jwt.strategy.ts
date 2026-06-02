import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';

interface SupabaseJwtPayload {
  sub: string;        // Supabase user UUID
  email: string;
  role?: string;
  aud: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('supabase.jwtSecret') ?? '',
    });
  }

  async validate(payload: SupabaseJwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { supabase_id: payload.sub },
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return {
      id: user.id,
      supabase_id: user.supabase_id,
      email: user.email,
      role: user.role,
      vendor_id: user.vendor_id,
      full_name: user.full_name,
    };
  }
}
