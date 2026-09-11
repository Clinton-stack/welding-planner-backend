import { Module } from '@nestjs/common';
import { PlannerController } from './planner.controller';
import { PlannerService } from './planner.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShiftCapacity } from 'src/shift-capacity/entities/shift-capacity.entity';
import { Robot } from 'src/robots/entities/robot.entity';
import { Job } from 'src/jobs/entities/job.entity';
import { PlannerSimulatorService } from './planner-simulator.service';

@Module({
  imports: [TypeOrmModule.forFeature([ShiftCapacity, Robot, Job])],
  controllers: [PlannerController],
  providers: [PlannerService, PlannerSimulatorService],
})
export class PlannerModule {}
