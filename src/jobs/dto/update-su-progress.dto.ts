import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, Max, Min } from 'class-validator';
import { ShiftCode } from '../enums/shift-code.enum';

export class UpdateSuProgressDto {
  @ApiProperty({ example: 40 })
  @IsNumber()
  @Min(0)
  @Max(100)
  progressPercent!: number;

  @ApiProperty({ enum: ShiftCode, example: ShiftCode.SPAET })
  @IsEnum(ShiftCode)
  @IsNotEmpty()
  nextShift!: ShiftCode;
}
