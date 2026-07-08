import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
export declare class SessionsController {
    private sessionsService;
    constructor(sessionsService: SessionsService);
    create(dto: CreateSessionDto): Promise<{
        id: string;
        table_id: string | null;
        table_number: number | null;
        table_label: string | null;
        waiter_id: string | null;
        waiter_name: string | null;
        status: string;
        created_at: string;
        expires_at: string;
    }>;
    findOne(id: string): Promise<{
        id: string;
        table_id: string | null;
        table_number: number | null;
        table_label: string | null;
        waiter_id: string | null;
        waiter_name: string | null;
        status: string;
        created_at: string;
        expires_at: string;
    }>;
    close(id: string): Promise<{
        id: string;
        table_id: string | null;
        table_number: number | null;
        table_label: string | null;
        waiter_id: string | null;
        waiter_name: string | null;
        status: string;
        created_at: string;
        expires_at: string;
    }>;
}
