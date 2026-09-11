import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from './entities/job.entity';
import { Repository } from 'typeorm';
import { findOneOrThrow } from 'src/helpers/find-or-throw';
import { Robot } from 'src/robots/entities/robot.entity';
import { FindJobsQueryDto } from './dto/find-jobs-query.dto';
import { JobStatus } from './enums/job-status.enum';
import { JobType } from './enums/job-type.enum';
import { UpdateSuProgressDto } from './dto/update-su-progress.dto';

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
    await this.validateProductionStepIsUnique(createJobDto);

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
        ...(query.jobType ? { jobType: query.jobType } : {}),
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
    const wasDone = job.status === JobStatus.DONE;
    const wasSchonGeheftet = job.schonGeheftet;
    const shouldSyncVorrichtung =
      updateJobDto.vorrichtung !== undefined &&
      updateJobDto.vorrichtung !== job.vorrichtung;

    if (updateJobDto.robotId && updateJobDto.robotId !== job.robotId) {
      await findOneOrThrow(
        this.robotRepository,
        { id: updateJobDto.robotId },
        'Robot',
      );
    }
    const nextJob = this.jobRepository.merge(job, updateJobDto);
    const isBecomingDone = !wasDone && nextJob.status === JobStatus.DONE;

    if (isBecomingDone) {
      await this.validateStepCanBeDone(nextJob);
      this.applyDoneState(nextJob);
    }

    if (!isBecomingDone && !wasSchonGeheftet && nextJob.schonGeheftet) {
      await this.validateStepCanBeMarkedSchonGeheftet(nextJob);
    }

    const savedJob = await this.jobRepository.save(nextJob);

    if (shouldSyncVorrichtung) {
      await this.syncVorrichtungForFaNumber(
        savedJob.faNumber,
        savedJob.vorrichtung,
      );
    }

    return savedJob;
  }

  async updateSuProgress(
    id: string,
    updateSuProgressDto: UpdateSuProgressDto,
  ): Promise<Job> {
    const job = await this.findOne(id);

    this.applySuProgress(job, updateSuProgressDto);

    if (job.status === JobStatus.DONE) {
      await this.validateStepCanBeDone(job);
    }

    return this.jobRepository.save(job);
  }

  async remove(id: string): Promise<{ message: string }> {
    const job = await this.findOne(id);

    await this.jobRepository.remove(job);
    return { message: 'Job deleted successfully' };
  }

  private async validateStepCanBeDone(job: Job): Promise<void> {
    await this.validatePreviousStepIsDone(job, 'completed');
  }

  private async validateStepCanBeMarkedSchonGeheftet(
    job: Job,
  ): Promise<void> {
    await this.validatePreviousStepIsDone(job, 'marked as schon geheftet');
  }

  private async validatePreviousStepIsDone(
    job: Job,
    action: string,
  ): Promise<void> {
    if (job.schritt <= 1) {
      return;
    }

    const previousStep = job.schritt - 1;
    const previousJob = await this.jobRepository.findOne({
      where: {
        faNumber: job.faNumber,
        schritt: previousStep,
      },
    });

    if (!previousJob) {
      throw new BadRequestException(
        `Schritt ${previousStep} must exist before Schritt ${job.schritt} can be ${action}.`,
      );
    }

    if (previousJob.status !== JobStatus.DONE) {
      throw new BadRequestException(
        `Schritt ${previousStep} must be done before Schritt ${job.schritt} can be ${action}.`,
      );
    }
  }

  private async syncVorrichtungForFaNumber(
    faNumber: string,
    vorrichtung: number,
  ): Promise<void> {
    await this.jobRepository.update({ faNumber }, { vorrichtung });
  }

  private async validateProductionStepIsUnique(
    createJobDto: CreateJobDto,
  ): Promise<void> {
    const jobType = createJobDto.jobType ?? JobType.PRODUCTION;

    if (jobType !== JobType.PRODUCTION) {
      return;
    }

    const existingProductionJob = await this.jobRepository.findOne({
      where: {
        faNumber: createJobDto.faNumber,
        schritt: createJobDto.schritt,
        jobType: JobType.PRODUCTION,
      },
    });

    if (existingProductionJob) {
      throw new BadRequestException(
        `Production job ${createJobDto.faNumber} Schritt ${createJobDto.schritt} already exists. Create a repair job if this is rework.`,
      );
    }
  }

  private applySuProgress(
    job: Job,
    updateSuProgressDto: UpdateSuProgressDto,
  ): void {
    job.progressPercent = updateSuProgressDto.progressPercent;
    job.remainingAnlageMinutes = Math.ceil(
      job.anlageMinutes * ((100 - updateSuProgressDto.progressPercent) / 100),
    );
    job.carriedFromPreviousShift = updateSuProgressDto.progressPercent < 100;
    job.shift = updateSuProgressDto.nextShift;

    if (updateSuProgressDto.progressPercent === 100) {
      this.applyDoneState(job);
    }
  }

  private applyDoneState(job: Job): void {
    job.status = JobStatus.DONE;
    job.schonGeheftet = true;
    job.progressPercent = 100;
    job.remainingAnlageMinutes = 0;
    job.carriedFromPreviousShift = false;
  }
}
