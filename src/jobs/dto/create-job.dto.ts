import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsString,
} from 'class-validator';
import { JobStatus } from '../enums/job-status.enum';
import { JobType } from '../enums/job-type.enum';
import { ShiftCode } from '../enums/shift-code.enum';

export class CreateJobDto {
  @ApiProperty({ example: 'FA2608909' })
  @IsNotEmpty()
  @IsString()
  faNumber!: string;

  @ApiProperty({ example: 'Pesa' })
  @IsString()
  @IsNotEmpty()
  projekt!: string;

  @ApiProperty({ example: '94-01' })
  @IsString()
  @IsNotEmpty()
  artikelNummer!: string;

  @ApiProperty({ example: 2 })
  @IsNotEmpty()
  @IsNumber()
  schritt!: number;

  @ApiProperty({ example: 2 })
  @IsNotEmpty()
  @IsNumber()
  vorrichtung!: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  menge!: number;

  @ApiProperty({ example: '98c97e55-8682-4419-a824-406fe578ecbf23535' })
  @IsNotEmpty()
  @IsString()
  robotId!: string;

  @ApiProperty({ example: 120 })
  @IsNotEmpty()
  @IsNumber()
  anlageMinutes!: number;

  @ApiProperty({ example: 160 })
  @IsNotEmpty()
  @IsNumber()
  schlosserMinutes!: number;

  @ApiProperty({ example: 30 })
  @IsNotEmpty()
  @IsNumber()
  ruestMinutes!: number;

  @ApiPropertyOptional({ enum: JobType, example: JobType.PRODUCTION })
  @IsOptional()
  @IsEnum(JobType)
  jobType?: JobType;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  schonGeheftet!: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPriority!: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isForced!: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isHeld!: boolean;

  @ApiPropertyOptional({ example: 'OPEN' })
  @IsOptional()
  @IsEnum(JobStatus)
  status!: JobStatus;

  @ApiProperty({ example: '2026-06-08' })
  @IsString()
  @IsNotEmpty()
  date!: string;

  @ApiProperty({ enum: ShiftCode, example: ShiftCode.FRUEH })
  @IsEnum(ShiftCode)
  shift!: ShiftCode;
}
