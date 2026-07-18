import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import jwksRsa from 'jwks-rsa';
import { decode as jwtDecode } from 'jsonwebtoken';
import { PrismaService } from '../../database/prisma.service';

interface SupabaseJwtPayload {
  sub: string;        // Supabase user UUID
  email: string;
  role?: string;
  aud: string;
}

function jwtDecodeHeader(token: string): { kid?: string; alg?: string } | null {
  const decoded = jwtDecode(token, { complete: true });
  return decoded?.header ?? null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    const localSecret = config.get<string>('supabase.jwtSecret') ?? '';
    const supabaseUrl = config.get<string>('supabase.url') ?? '';
    const jwksClient = supabaseUrl
      ? jwksRsa({
          jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
          cache: true,
          cacheMaxAge: 10 * 60 * 1000,
          rateLimit: true,
        })
      : null;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['HS256', 'ES256', 'RS256'],
      // Locally-issued tokens (PIN logins, local-dev login) are signed HS256 with our
      // shared secret and carry no `kid`. Real Supabase-issued tokens are signed with
      // the project's asymmetric key (ES256/RS256) and are verified against Supabase's
      // JWKS endpoint instead — the legacy HS256 secret cannot verify those.
      secretOrKeyProvider: (_request, rawJwtToken, done) => {
        const decoded = jwtDecodeHeader(rawJwtToken);
        if (!decoded?.kid) {
          return done(null, localSecret);
        }
        if (!jwksClient) {
          return done(new Error('Supabase URL not configured'), undefined);
        }
        jwksClient.getSigningKey(decoded.kid, (err, key) => {
          if (err) return done(err, undefined);
          done(null, key?.getPublicKey());
        });
      },
    });
  }

  async validate(payload: SupabaseJwtPayload) {
    // PIN-based staff token: sub = "pin:<staffPinId>"
    if (payload.sub.startsWith('pin:')) {
      const pinId = payload.sub.slice(4);
      const staffPin = await this.prisma.staffPin.findUnique({ where: { id: pinId } });
      if (!staffPin || !staffPin.is_active) {
        throw new UnauthorizedException('Staff PIN not found or inactive');
      }
      return {
        id: staffPin.id,
        supabase_id: payload.sub,
        email: `pin:${pinId}`,
        role: staffPin.role,
        vendor_id: staffPin.vendor_id,
        full_name: staffPin.label,
      };
    }

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
