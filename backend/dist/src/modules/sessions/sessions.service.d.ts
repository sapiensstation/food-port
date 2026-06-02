import { PrismaService } from '../../database/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
export declare class SessionsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateSessionDto): Promise<{
        id: string;
        table_id: string;
        table_number: number;
        table_label: string;
        waiter_id: string | null;
        waiter_name: string | null;
        status: string;
        created_at: string;
        expires_at: string;
    }>;
    findOne(id: string): Promise<{
        id: string;
        table_id: string;
        table_number: number;
        table_label: string;
        waiter_id: string | null;
        waiter_name: string | null;
        status: string;
        created_at: string;
        expires_at: string;
    }>;
    close(id: string): Promise<{
        id: string;
        table_id: string;
        table_number: number;
        table_label: string;
        waiter_id: string | null;
        waiter_name: string | null;
        status: string;
        created_at: string;
        expires_at: string;
    }>;
    private format;
}
