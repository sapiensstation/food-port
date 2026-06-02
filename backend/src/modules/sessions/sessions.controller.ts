import { Controller, Post, Get, Patch, Body, Param, UseGuards, SetMetadata } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

const Public = () => SetMetadata('isPublic', true);

@ApiTags('Sessions')
@Controller('sessions')
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  @Public()
  @Post()
  create(@Body() dto: CreateSessionDto) {
    return this.sessionsService.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id/close')
  close(@Param('id') id: string) {
    return this.sessionsService.close(id);
  }
}
