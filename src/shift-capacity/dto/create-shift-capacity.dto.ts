import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ShiftCode } from 'src/jobs/enums/shift-code.enum';

export class CreateShiftCapacityDto {
  @ApiProperty({ example: 'nsnsnd-iwiwdiw-iw' })
  @IsString()
  @IsNotEmpty()
  robotId!: string;

  @ApiProperty({ example: 'YYYY-MM-DD'})
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
