import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'src/jobs/entities/job.entity';
import { JobStatus } from 'src/jobs/enums/job-status.enum';
import { ShiftCode } from 'src/jobs/enums/shift-code.enum';
import { findOneOrThrow } from 'src/helpers/find-or-throw';
import { Robot } from 'src/robots/entities/robot.entity';
import { ShiftCapacity } from 'src/shift-capacity/entities/shift-capacity.entity';
import { Repository } from 'typeorm';
import { CreateRecommendationDto } from './dto/create-recommendation.dto';
import {
  PlannerSimulatorService,
  ShiftSimulation,
} from './planner-simulator.service';

type PlannerContext = {
  robot: Robot;
  jobs: Job[];
  capacities: ShiftCapacity[];
};

type AppliedJobShiftChange = {
  jobId: string;
  faNumber: string;
  previousShift: ShiftCode;
  plannedShift: ShiftCode;
};

type NextProductionDayMove = {
  jobId: string;
  faNumber: string;
  previousDate: string;
  previousShift: ShiftCode;
  nextDate: string;
  nextShift: ShiftCode;
};

type MissingCapacityWarning = {
  shift: ShiftCode;
  jobs: number;
  message: string;
};

@Injectable()
export class PlannerService {
  constructor(
    @InjectRepository(Robot)
    private readonly robotRepository: Repository<Robot>,

    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,

    @InjectRepository(ShiftCapacity)
    private readonly shiftCapacityRepository: Repository<ShiftCapacity>,

    private readonly plannerSimulatorService: PlannerSimulatorService,
  ) {}

  async createRecommendation(dto: CreateRecommendationDto) {
    const { robot, jobs, capacities } = await this.buildPlannerContext(dto);
    const groups = await this.createPlannerGroups(jobs, capacities);

    return {
      robot,
      robotId: dto.robotId,
      date: dto.date,
      capacities,
      jobs,
      ...groups,
    };
  }

  async applyPlan(dto: CreateRecommendationDto) {
    const { jobs, capacities } = await this.buildPlannerContext(dto);
    const activeJobs = this.getActiveJobs(jobs);
    const { shiftSimulations, finalRolloverJobs } =
      this.plannerSimulatorService.simulateAvailableShifts(
        activeJobs,
        capacities,
      );
    const missingCapacityWarnings = this.getMissingCapacityWarnings(
      activeJobs,
      capacities,
    );
    const plannedShiftByJobId =
      this.createPlannedShiftByJobId(shiftSimulations);
    const appliedJobs: AppliedJobShiftChange[] = [];
    const movedToNextProductionDay: NextProductionDayMove[] = [];
    const nextProductionDate = this.getNextProductionDate(dto.date);
    const finalRolloverJobIds = new Set(
      finalRolloverJobs.map((job) => job.id),
    );

    for (const job of jobs) {
      if (finalRolloverJobIds.has(job.id)) {
        movedToNextProductionDay.push({
          jobId: job.id,
          faNumber: job.faNumber,
          previousDate: job.date,
          previousShift: job.shift,
          nextDate: nextProductionDate,
          nextShift: ShiftCode.NACHT,
        });
        job.date = nextProductionDate;
        job.shift = ShiftCode.NACHT;
        job.carriedFromPreviousShift = true;
        continue;
      }

      const plannedShift = plannedShiftByJobId.get(job.id);

      if (!plannedShift || job.shift === plannedShift) {
        continue;
      }

      appliedJobs.push({
        jobId: job.id,
        faNumber: job.faNumber,
        previousShift: job.shift,
        plannedShift,
      });
      job.shift = plannedShift;
    }

    if (appliedJobs.length > 0 || movedToNextProductionDay.length > 0) {
      await this.jobRepository.save(jobs);
    }

    return {
      message: 'Planner result applied',
      appliedJobs,
      updatedJobs: appliedJobs.length,
      movedToNextProductionDay,
      finalRolloverJobs,
      missingCapacityWarnings,
      shiftSummary: shiftSimulations.map((simulation) => ({
        shift: simulation.shift,
        plannedJobs: simulation.plannedJobs.length,
        rolloverJobs: simulation.rolloverJobs.length,
        robotUsedMinutes: simulation.robotUsedMinutes,
        targetRobotMinutes: simulation.targetRobotMinutes,
        robotUtilizationPercent: simulation.robotUtilizationPercent,
      })),
      summary: {
        updatedJobs: appliedJobs.length,
        movedToNextProductionDay: movedToNextProductionDay.length,
        finalRolloverJobs: finalRolloverJobs.length,
        missingCapacityWarnings: missingCapacityWarnings.length,
      },
    };
  }

  private async buildPlannerContext(
    dto: CreateRecommendationDto,
  ): Promise<PlannerContext> {
    const robot = await findOneOrThrow(
      this.robotRepository,
      { id: dto.robotId },
      'Robot',
    );

    const jobs = await this.jobRepository.find({
      where: {
        robotId: dto.robotId,
        date: dto.date,
      },
      order: {
        isPriority: 'DESC',
        schritt: 'ASC',
        createdAt: 'ASC',
      },
    });

    const capacities = await this.shiftCapacityRepository.find({
      where: {
        robotId: dto.robotId,
        date: dto.date,
      },
      order: {
        shift: 'ASC',
      },
    });

    return { robot, jobs, capacities };
  }

  private async createPlannerGroups(
    jobs: Job[],
    capacities: ShiftCapacity[],
  ) {
    const heldJobs = jobs.filter((job) => job.isHeld);
    const blockedJobs = jobs.filter((job) => job.status === JobStatus.BLOCKED);
    const completedJobs = jobs.filter((job) => job.status === JobStatus.DONE);
    const activeJobs = this.getActiveJobs(jobs);
    const jobsWithReadiness = await Promise.all(
      activeJobs.map(async (job) => ({
        job,
        sequenceWarning: await this.getSequenceWarning(job),
      })),
    );
    const sequenceWarnings = jobsWithReadiness
      .filter(({ sequenceWarning }) => sequenceWarning)
      .map(({ job, sequenceWarning }) => ({
        job,
        warning: sequenceWarning,
      }));
    const plannableJobs = activeJobs;
    const readyJobs = plannableJobs.filter((job) => job.schonGeheftet);
    const needsHeftenJobs = plannableJobs.filter((job) => !job.schonGeheftet);
    const anlageMinutesRemaining = plannableJobs.reduce(
      (total, job) =>
        total + (job.remainingAnlageMinutes ?? job.anlageMinutes),
      0,
    );
    const ruestMinutesRemaining = plannableJobs.reduce(
      (total, job) => total + job.ruestMinutes,
      0,
    );
    const { shiftSimulations, finalRolloverJobs } =
      this.plannerSimulatorService.simulateAvailableShifts(
        plannableJobs,
        capacities,
      );
    const rolloverJobs = this.getUniqueJobs(
      shiftSimulations.flatMap((simulation) => simulation.rolloverJobs),
    );
    const missingCapacityWarnings = this.getMissingCapacityWarnings(
      plannableJobs,
      capacities,
    );

    return {
      readyJobs,
      needsHeftenJobs,
      sequenceWarnings,
      heldJobs,
      blockedJobs,
      completedJobs,
      shiftSimulations,
      rolloverJobs,
      finalRolloverJobs,
      missingCapacityWarnings,
      summary: {
        totalJobs: jobs.length,
        readyJobs: readyJobs.length,
        needsHeftenJobs: needsHeftenJobs.length,
        sequenceWarnings: sequenceWarnings.length,
        heldJobs: heldJobs.length,
        blockedJobs: blockedJobs.length,
        completedJobs: completedJobs.length,
        rolloverJobs: rolloverJobs.length,
        finalRolloverJobs: finalRolloverJobs.length,
        missingCapacityWarnings: missingCapacityWarnings.length,
        anlageMinutesRemaining,
        ruestMinutesRemaining,
      },
    };
  }

  private getActiveJobs(jobs: Job[]): Job[] {
    return jobs.filter(
      (job) =>
        !job.isHeld &&
        job.status !== JobStatus.BLOCKED &&
        job.status !== JobStatus.DONE,
    );
  }

  private createPlannedShiftByJobId(
    shiftSimulations: ShiftSimulation[],
  ): Map<string, ShiftCode> {
    const plannedShiftByJobId = new Map<string, ShiftCode>();

    for (const simulation of shiftSimulations) {
      for (const plannedJob of simulation.plannedJobs) {
        plannedShiftByJobId.set(plannedJob.job.id, simulation.shift);
      }
    }

    return plannedShiftByJobId;
  }

  private getNextProductionDate(date: string): string {
    const [year, month, day] = date.split('-').map(Number);
    const nextDate = new Date(Date.UTC(year, month - 1, day + 1));

    return nextDate.toISOString().slice(0, 10);
  }

  private getMissingCapacityWarnings(
    jobs: Job[],
    capacities: ShiftCapacity[],
  ): MissingCapacityWarning[] {
    const capacityShifts = new Set(capacities.map((capacity) => capacity.shift));
    const jobsByMissingShift = new Map<ShiftCode, number>();

    for (const job of jobs) {
      if (capacityShifts.has(job.shift)) {
        continue;
      }

      jobsByMissingShift.set(
        job.shift,
        (jobsByMissingShift.get(job.shift) ?? 0) + 1,
      );
    }

    return Array.from(jobsByMissingShift.entries())
      .sort(
        ([firstShift], [secondShift]) =>
          this.plannerSimulatorService.getShiftOrder(firstShift) -
          this.plannerSimulatorService.getShiftOrder(secondShift),
      )
      .map(([shift, jobCount]) => ({
        shift,
        jobs: jobCount,
        message: `${jobCount} job(s) are assigned to shift ${shift}, but no shift capacity exists for that shift.`,
      }));
  }

  private async getSequenceWarning(job: Job): Promise<string | null> {
    if (job.schritt <= 1) {
      return null;
    }

    const previousStep = job.schritt - 1;
    const previousJob = await this.jobRepository.findOne({
      where: {
        faNumber: job.faNumber,
        schritt: previousStep,
      },
    });

    if (!previousJob) {
      return `Schritt ${job.schritt} can be planned, but it cannot be marked as schon geheftet or done because Schritt ${previousStep} is missing.`;
    }

    if (previousJob.status !== JobStatus.DONE) {
      return `Schritt ${job.schritt} can be planned, but it cannot be marked as schon geheftet or done until Schritt ${previousStep} is done.`;
    }

    return null;
  }

  private getUniqueJobs(jobs: Job[]): Job[] {
    return Array.from(new Map(jobs.map((job) => [job.id, job])).values());
  }
}
