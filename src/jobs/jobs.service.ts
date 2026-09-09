import { Injectable } from '@nestjs/common';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from './entities/job.entity';
import { Repository } from 'typeorm';
import { findOneOrThrow } from 'src/helpers/find-or-throw';
import { Robot } from 'src/robots/entities/robot.entity';
import { FindJobsQueryDto } from './dto/find-jobs-query.dto';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(Robot)
    private readonly robotRepository: Repository<Robot>,
  ) {}

  async create(createJobDto: CreateJobDto): Promise<Job> {
    await findOneOrThrow(
      this.robotRepository,
      { id: createJobDto.robotId },
      'Robot',
    );
    const job = this.jobRepository.create(createJobDto);
    return this.jobRepository.save(job);
  }

  async findAll(query: FindJobsQueryDto): Promise<Job[]> {
    return this.jobRepository.find({
      where: {
        ...(query.robotId ? { robotId: query.robotId } : {}),
        ...(query.date ? { date: query.date } : {}),
        ...(query.shift ? { shift: query.shift } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.projekt ? { projekt: query.projekt } : {}),
        ...(query.artikelNummer !== undefined
          ? { artikelNummer: query.artikelNummer }
          : {}),
        ...(query.schritt !== undefined ? { schritt: query.schritt } : {}),
        ...(query.vorrichtung !== undefined
          ? { vorrichtung: query.vorrichtung }
          : {}),
        ...(query.schonGeheftet !== undefined
          ? { schonGeheftet: query.schonGeheftet }
          : {}),
        ...(query.isPriority !== undefined
          ? { isPriority: query.isPriority }
          : {}),
        ...(query.isForced !== undefined ? { isForced: query.isForced } : {}),
        ...(query.isHeld !== undefined ? { isHeld: query.isHeld } : {}),
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string): Promise<Job> {
    return findOneOrThrow(this.jobRepository, { id }, 'Job');
  }

  async update(id: string, updateJobDto: UpdateJobDto): Promise<Job> {
    const job = await this.findOne(id);

    if (updateJobDto.robotId && updateJobDto.robotId !== job.robotId) {
      await findOneOrThrow(
        this.robotRepository,
        { id: updateJobDto.robotId },
        'Robot',
      );
    }
    Object.assign(job, updateJobDto);
    return this.jobRepository.save(job);
  }

  async remove(id: string): Promise<{ message: string }> {
    const job = await this.findOne(id);

    await this.jobRepository.remove(job);
    return { message: 'Job deleted successfully' };
  }
}
