import { IsString, IsIn, IsOptional, ValidateIf } from 'class-validator';

export class RejectItemDto {
  @IsIn(['out_of_stock', 'equipment_issue', 'custom'])
  reason: 'out_of_stock' | 'equipment_issue' | 'custom';

  @ValidateIf((o: RejectItemDto) => o.reason === 'custom')
  @IsString()
  custom_reason?: string;
}
