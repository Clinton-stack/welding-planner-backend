import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRecommendationDto {
  @ApiProperty({ example: '64ebad1b-6507-41f0-9dcb-0dade446a6cd' })
  @IsString()
  @IsNotEmpty()
  robotId!: string;

  @ApiProperty({ example: '2026-06-08' })
  @IsString()
  @IsNotEmpty()
  date!: string;
}
