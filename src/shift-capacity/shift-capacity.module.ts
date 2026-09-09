import { Module } from '@nestjs/common';
import { ShiftCapacityService } from './shift-capacity.service';
import { ShiftCapacityController } from './shift-capacity.controller';
import { ShiftCapacity } from './entities/shift-capacity.entity';
import { Robot } from 'src/robots/entities/robot.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([ShiftCapacity, Robot])],
  controllers: [ShiftCapacityController],
  providers: [ShiftCapacityService],
})
export class ShiftCapacityModule {}
