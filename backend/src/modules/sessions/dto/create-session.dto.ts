import { IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateSessionDto {
  @IsOptional()
  @IsString()
  table_id?: string;

  @IsOptional()
  @IsUUID()
  waiter_id?: string;
}
