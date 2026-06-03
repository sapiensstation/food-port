import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { PinLoginDto } from './dto/pin-login.dto';
import { JwtUser } from '../../common/decorators/current-user.decorator';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
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
    getMe(user: JwtUser): Promise<{
        id: string;
        email: string;
        full_name: string;
        role: string;
        vendor_id: string | null;
    }>;
    logout(): {
        message: string;
    };
}
