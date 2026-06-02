import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { PinLoginDto } from './dto/pin-login.dto';

@Injectable()
export class AuthService {
  private supabase;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.supabase = createClient(
      config.get<string>('supabase.url') ?? '',
      config.get<string>('supabase.serviceRoleKey') ?? '',
    );
  }

  async login(dto: LoginDto) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error || !data.session) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const user = await this.prisma.user.findUnique({
      where: { supabase_id: data.user.id },
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedException('Account not found or disabled');
    }

    return {
      access_token: data.session.access_token,
      user: this.formatUser(user),
    };
  }

  async pinLogin(dto: PinLoginDto) {
    const staffPins = await this.prisma.staffPin.findMany({
      where: { vendor_id: dto.vendor_id, is_active: true },
    });

    let matchedPin: typeof staffPins[0] | null = null;
    for (const sp of staffPins) {
      const isMatch = await bcrypt.compare(dto.pin, sp.pin_hash);
      if (isMatch) { matchedPin = sp; break; }
    }

    if (!matchedPin) {
      throw new UnauthorizedException('Invalid PIN');
    }

    // Generate a short-lived custom token via Supabase if linked user exists
    // For now, return a minimal staff token payload
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: dto.vendor_id },
      select: { id: true, name: true },
    });

    if (!vendor) throw new NotFoundException('Vendor not found');

    return {
      access_token: null, // PIN-based sessions use cookie/local storage with staff metadata
      staff: {
        pin_id: matchedPin.id,
        vendor_id: dto.vendor_id,
        vendor_name: vendor.name,
        role: matchedPin.role,
        label: matchedPin.label,
      },
    };
  }

  async getMe(supabaseId: string) {
    const user = await this.prisma.user.findUnique({
      where: { supabase_id: supabaseId },
      include: { vendor: { select: { id: true, name: true, booth_number: true } } },
    });

    if (!user) throw new NotFoundException('User not found');
    return this.formatUser(user);
  }

  private formatUser(user: { id: string; email: string; full_name: string; role: string; vendor_id: string | null }) {
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      vendor_id: user.vendor_id,
    };
  }
}
