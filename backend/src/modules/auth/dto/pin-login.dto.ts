import { IsString, IsUUID, Length } from 'class-validator';

export class PinLoginDto {
  @IsUUID()
  vendor_id: string;

  @IsString()
  @Length(4, 4)
  pin: string;
}
