import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ShiftCode } from 'src/jobs/enums/shift-code.enum';

export class FindShiftCapacityQueryDto {
  @ApiPropertyOptional({ example: '64ebad1b-6507-41f0-9dcb-0dade446a6cd' })
  @IsString()
  @IsOptional()
  robotId?: string;

  @ApiPropertyOptional({ example: '2026-06-08' })
  @IsString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({ enum: ShiftCode, example: ShiftCode.FRUEH })
  @IsOptional()
  @IsEnum(ShiftCode)
  shift?: ShiftCode;
}
