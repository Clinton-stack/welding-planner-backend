import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { JobStatus } from '../enums/job-status.enum';
import { ShiftCode } from '../enums/shift-code.enum';

function toOptionalBoolean(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return value === true || value === 'true';
}

export class FindJobsQueryDto {
  @ApiPropertyOptional({
    example: '98c97e55-8682-4419-a824-406fe578ecbf',
  })
  @IsOptional()
  @IsString()
  robotId?: string;

  @ApiPropertyOptional({ example: '2026-06-08' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ enum: ShiftCode, example: ShiftCode.FRUEH })
  @IsOptional()
  @IsEnum(ShiftCode)
  shift?: ShiftCode;

  @ApiPropertyOptional({ enum: JobStatus, example: JobStatus.OPEN })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @ApiPropertyOptional({ example: 'Pesa' })
  @IsOptional()
  @IsString()
  projekt?: string;

  @ApiPropertyOptional({ example: 95 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  artikelNummer?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  schritt?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  vorrichtung?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsBoolean()
  schonGeheftet?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsBoolean()
  isPriority?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsBoolean()
  isForced?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Transform(({ value }) => toOptionalBoolean(value))
  @IsBoolean()
  isHeld?: boolean;
}
