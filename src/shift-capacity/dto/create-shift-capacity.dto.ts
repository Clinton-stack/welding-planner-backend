import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ShiftCode } from 'src/jobs/enums/shift-code.enum';

export class CreateShiftCapacityDto {
  @ApiProperty({ example: '64ebad1b-6507-41f0-9dcb-0dade446a6cd' })
  @IsString()
  @IsNotEmpty()
  robotId!: string;

  @ApiProperty({ example: '2026-06-08' })
  @IsString()
  @IsNotEmpty()
  date!: string;

  @ApiProperty({ enum: ShiftCode, example: ShiftCode.FRUEH })
  @IsEnum(ShiftCode)
  shift!: ShiftCode;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @IsNotEmpty()
  schlosserCount!: number;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @IsNotEmpty()
  vorrichtungCount!: number;

  @ApiProperty({ example: 95 })
  @IsNumber()
  @IsNotEmpty()
  targetRobotPercent!: number;
}
