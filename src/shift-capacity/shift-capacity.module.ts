import { Module } from '@nestjs/common';
import { ShiftCapacityService } from './shift-capacity.service';
import { ShiftCapacityController } from './shift-capacity.controller';

@Module({
  controllers: [ShiftCapacityController],
  providers: [ShiftCapacityService],
})
export class ShiftCapacityModule {}
