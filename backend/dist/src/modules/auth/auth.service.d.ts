import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { PinLoginDto } from './dto/pin-login.dto';
export declare class AuthService {
    private prisma;
    private config;
    private jwtService;
    private supabase;
    constructor(prisma: PrismaService, config: ConfigService, jwtService: JwtService);
    private isLocalDev;
    login(dto: LoginDto): Promise<{
        access_token: any;
        user: {
            id: string;
            email: string;
            full_name: string;
            role: string;
            vendor_id: string | null;
        };
    }>;
    private localLogin;
    pinLogin(dto: PinLoginDto): Promise<{
        access_token: string;
        staff: {
            pin_id: string;
            vendor_id: string;
            vendor_name: string;
            role: import(".prisma/client").$Enums.UserRole;
            label: string;
        };
    }>;
    getMe(supabaseId: string): Promise<{
        id: string;
        email: string;
        full_name: string;
        role: string;
        vendor_id: string | null;
    }>;
    private formatUser;
}
