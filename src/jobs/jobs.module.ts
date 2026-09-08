import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Robot } from 'src/robots/entities/robot.entity';
import { Job } from './entities/job.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Job, Robot])],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
