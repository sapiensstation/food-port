import { IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  table_id: string;

  @IsOptional()
  @IsUUID()
  waiter_id?: string;
}
