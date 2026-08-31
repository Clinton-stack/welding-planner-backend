import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateRobotDto {
  @ApiProperty({ example: 'AP-2904' })
  @IsString()
  @IsNotEmpty()
  assetId!: string;

  @ApiProperty({ example: 'Pesa' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Halle 1' })
  @IsString()
  @IsNotEmpty()
  location!: string;

  @ApiProperty({ example: 'Laser welding' })
  @IsString()
  @IsNotEmpty()
  process!: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}