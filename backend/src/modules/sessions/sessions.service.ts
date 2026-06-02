import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSessionDto) {
    const table = await this.prisma.table.findFirst({
      where: { id: dto.table_id, is_active: true },
    });
    if (!table) throw new NotFoundException('Table not found');

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 4); // 4-hour session

    const session = await this.prisma.session.create({
      data: {
        table_id: dto.table_id,
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

  async findOne(id: string) {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: {
        table: { select: { table_number: true, label: true } },
        waiter: { select: { full_name: true } },
      },
    });
    if (!session) throw new NotFoundException('Session not found');
    return this.format(session);
  }

  async close(id: string) {
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

  private format(session: {
    id: string;
    table_id: string;
    table: { table_number: number; label: string };
    waiter_id: string | null;
    waiter: { full_name: string } | null;
    status: string;
    created_at: Date;
    expires_at: Date;
  }) {
    return {
      id: session.id,
      table_id: session.table_id,
      table_number: session.table.table_number,
      table_label: session.table.label,
      waiter_id: session.waiter_id,
      waiter_name: session.waiter?.full_name ?? null,
      status: session.status,
      created_at: session.created_at.toISOString(),
      expires_at: session.expires_at.toISOString(),
    };
  }
}
