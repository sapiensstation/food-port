import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
interface SupabaseJwtPayload {
    sub: string;
    email: string;
    role?: string;
    aud: string;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private config;
    private prisma;
    constructor(config: ConfigService, prisma: PrismaService);
    validate(payload: SupabaseJwtPayload): Promise<{
        id: string;
        supabase_id: string;
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
        vendor_id: string | null;
        full_name: string;
    }>;
}
export {};
