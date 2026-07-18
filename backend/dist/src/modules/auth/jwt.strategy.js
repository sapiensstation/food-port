"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const config_1 = require("@nestjs/config");
const jwks_rsa_1 = __importDefault(require("jwks-rsa"));
const jsonwebtoken_1 = require("jsonwebtoken");
const prisma_service_1 = require("../../database/prisma.service");
function jwtDecodeHeader(token) {
    const decoded = (0, jsonwebtoken_1.decode)(token, { complete: true });
    return decoded?.header ?? null;
}
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    constructor(config, prisma) {
        const localSecret = config.get('supabase.jwtSecret') ?? '';
        const supabaseUrl = config.get('supabase.url') ?? '';
        const jwksClient = supabaseUrl
            ? (0, jwks_rsa_1.default)({
                jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
                cache: true,
                cacheMaxAge: 10 * 60 * 1000,
                rateLimit: true,
            })
            : null;
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            algorithms: ['HS256', 'ES256', 'RS256'],
            secretOrKeyProvider: (_request, rawJwtToken, done) => {
                const decoded = jwtDecodeHeader(rawJwtToken);
                if (!decoded?.kid) {
                    return done(null, localSecret);
                }
                if (!jwksClient) {
                    return done(new Error('Supabase URL not configured'), undefined);
                }
                jwksClient.getSigningKey(decoded.kid, (err, key) => {
                    if (err)
                        return done(err, undefined);
                    done(null, key?.getPublicKey());
                });
            },
        });
        this.config = config;
        this.prisma = prisma;
    }
    async validate(payload) {
        if (payload.sub.startsWith('pin:')) {
            const pinId = payload.sub.slice(4);
            const staffPin = await this.prisma.staffPin.findUnique({ where: { id: pinId } });
            if (!staffPin || !staffPin.is_active) {
                throw new common_1.UnauthorizedException('Staff PIN not found or inactive');
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
            throw new common_1.UnauthorizedException('User not found or inactive');
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
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map