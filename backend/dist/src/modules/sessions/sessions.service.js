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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let SessionsService = class SessionsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        let tableId = null;
        if (dto.table_id) {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.table_id);
            const table = await this.prisma.table.findFirst({
                where: isUuid
                    ? { id: dto.table_id, is_active: true }
                    : { table_number: parseInt(dto.table_id, 10), is_active: true },
            });
            if (!table)
                throw new common_1.NotFoundException('Table not found');
            tableId = table.id;
        }
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 4);
        const session = await this.prisma.session.create({
            data: {
                table_id: tableId,
                waiter_id: dto.waiter_id ?? null,
                expires_at: expiresAt,
            },
            include: {
                table: { select: { table_number: true, label: true } },
                waiter: { select: { full_name: true } },
            },
        });
        return this.format(session);
    }
    async findOne(id) {
        const session = await this.prisma.session.findUnique({
            where: { id },
            include: {
                table: { select: { table_number: true, label: true } },
                waiter: { select: { full_name: true } },
            },
        });
        if (!session)
            throw new common_1.NotFoundException('Session not found');
        return this.format(session);
    }
    async close(id) {
        const session = await this.prisma.session.update({
            where: { id },
            data: { status: 'closed' },
            include: {
                table: { select: { table_number: true, label: true } },
                waiter: { select: { full_name: true } },
            },
        });
        return this.format(session);
    }
    format(session) {
        return {
            id: session.id,
            table_id: session.table_id,
            table_number: session.table?.table_number ?? null,
            table_label: session.table?.label ?? null,
            waiter_id: session.waiter_id,
            waiter_name: session.waiter?.full_name ?? null,
            status: session.status,
            created_at: session.created_at.toISOString(),
            expires_at: session.expires_at.toISOString(),
        };
    }
};
exports.SessionsService = SessionsService;
exports.SessionsService = SessionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SessionsService);
//# sourceMappingURL=sessions.service.js.map