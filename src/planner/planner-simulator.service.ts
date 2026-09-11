import { Injectable } from '@nestjs/common';
import { Job } from 'src/jobs/entities/job.entity';
import { ShiftCode } from 'src/jobs/enums/shift-code.enum';
import { ShiftCapacity } from 'src/shift-capacity/entities/shift-capacity.entity';

const SHIFT_WORKING_MINUTES = 450;

export type PlannedJobTimeline = {
  job: Job;
  vorrichtung: number;
  schlosserStartMinute: number | null;
  schlosserEndMinute: number | null;
  robotStartMinute: number;
  robotEndMinute: number;
  robotMinutes: number;
};

type JobSimulationCandidate = PlannedJobTimeline & {
  schlosserWorkerIndex: number | null;
};

export type ShiftSimulation = {
  shift: ShiftCapacity['shift'];
  workingMinutes: number;
  targetRobotMinutes: number;
  plannedJobs: PlannedJobTimeline[];
  rolloverJobs: Job[];
  warnings: string[];
  robotUsedMinutes: number;
  robotIdleMinutes: number;
  robotUtilizationPercent: number;
};

export type MultiShiftSimulation = {
  shiftSimulations: ShiftSimulation[];
  finalRolloverJobs: Job[];
};

@Injectable()
export class PlannerSimulatorService {
  simulateAvailableShifts(
    jobs: Job[],
    capacities: ShiftCapacity[],
  ): MultiShiftSimulation {
    const orderedCapacities = this.orderCapacitiesByShift(capacities);
    const shiftSimulations: ShiftSimulation[] = [];
    let rolloverJobs: Job[] = [];

    for (const capacity of orderedCapacities) {
      const jobsForShift = jobs.filter((job) => job.shift === capacity.shift);
      const carriedJobIds = new Set(rolloverJobs.map((job) => job.id));
      const simulationJobs = this.getUniqueJobs([
        ...rolloverJobs,
        ...jobsForShift,
      ]);
      const simulation = this.simulateShiftRotation(
        simulationJobs,
        capacity,
        carriedJobIds,
      );

      shiftSimulations.push(simulation);
      rolloverJobs = simulation.rolloverJobs;
    }

    return {
      shiftSimulations,
      finalRolloverJobs: rolloverJobs,
    };
  }

  getShiftOrder(shift: ShiftCode): number {
    const shiftOrder: Record<ShiftCode, number> = {
      [ShiftCode.NACHT]: 1,
      [ShiftCode.FRUEH]: 2,
      [ShiftCode.SPAET]: 3,
    };

    return shiftOrder[shift];
  }

  private simulateShiftRotation(
    jobs: Job[],
    capacity: ShiftCapacity,
    carriedJobIds = new Set<string>(),
  ): ShiftSimulation {
    const orderedJobs = this.orderJobsForSimulation(jobs, carriedJobIds);
    const fixtureAvailableAt = this.createFixtureTimeline(
      capacity.vorrichtungCount,
    );
    const schlosserAvailableAt = this.createWorkerTimeline(
      capacity.schlosserCount,
    );
    const plannedJobs: PlannedJobTimeline[] = [];
    const rolloverJobs: Job[] = [];
    const warnings: string[] = [];
    const targetRobotMinutes = this.getTargetRobotMinutes(capacity);
    let robotAvailableAt = 0;
    let robotUsedMinutes = 0;

    for (const job of orderedJobs) {
      if (!fixtureAvailableAt.has(job.vorrichtung)) {
        rolloverJobs.push(job);
        warnings.push(
          `${job.faNumber} uses VR-${job.vorrichtung}, but this shift only has ${capacity.vorrichtungCount} VR places.`,
        );
        continue;
      }

      if (
        !job.schonGeheftet &&
        job.schlosserMinutes > 0 &&
        schlosserAvailableAt.length === 0
      ) {
        rolloverJobs.push(job);
        warnings.push(
          `${job.faNumber} needs Schlosser work, but this shift has no Schlossers available.`,
        );
        continue;
      }

      const simulation = this.simulateJob(
        job,
        robotAvailableAt,
        fixtureAvailableAt,
        schlosserAvailableAt,
      );

      const exceedsShift = simulation.robotEndMinute > targetRobotMinutes;

      if (exceedsShift && !job.isForced) {
        rolloverJobs.push(job);
        continue;
      }

      if (exceedsShift && job.isForced) {
        warnings.push(
          `${job.faNumber} is forced and exceeds the shift target by ${simulation.robotEndMinute - targetRobotMinutes} minutes.`,
        );
      }

      plannedJobs.push(this.toPlannedJobTimeline(simulation));
      robotAvailableAt = simulation.robotEndMinute;
      robotUsedMinutes += simulation.robotMinutes;
      fixtureAvailableAt.set(job.vorrichtung, simulation.robotEndMinute);

      if (
        simulation.schlosserEndMinute !== null &&
        simulation.schlosserWorkerIndex !== null
      ) {
        schlosserAvailableAt[simulation.schlosserWorkerIndex] =
          simulation.schlosserEndMinute;
      }
    }

    return {
      shift: capacity.shift,
      workingMinutes: SHIFT_WORKING_MINUTES,
      targetRobotMinutes,
      plannedJobs,
      rolloverJobs,
      warnings,
      robotUsedMinutes,
      robotIdleMinutes: Math.max(0, targetRobotMinutes - robotUsedMinutes),
      robotUtilizationPercent: Math.round(
        (robotUsedMinutes / SHIFT_WORKING_MINUTES) * 100,
      ),
    };
  }

  private simulateJob(
    job: Job,
    robotAvailableAt: number,
    fixtureAvailableAt: Map<number, number>,
    schlosserAvailableAt: number[],
  ): JobSimulationCandidate {
    const fixtureReadyAt = fixtureAvailableAt.get(job.vorrichtung) ?? 0;
    const robotMinutes = job.remainingAnlageMinutes ?? job.anlageMinutes;

    if (job.schonGeheftet || job.schlosserMinutes === 0) {
      const robotStartMinute = Math.max(robotAvailableAt, fixtureReadyAt);

      return {
        job,
        vorrichtung: job.vorrichtung,
        schlosserStartMinute: null,
        schlosserEndMinute: null,
        schlosserWorkerIndex: null,
        robotStartMinute,
        robotEndMinute: robotStartMinute + robotMinutes,
        robotMinutes,
      };
    }

    const schlosserWorkerIndex =
      this.findEarliestAvailableWorker(schlosserAvailableAt);
    const schlosserStartMinute = Math.max(
      schlosserAvailableAt[schlosserWorkerIndex],
      fixtureReadyAt,
    );
    const schlosserEndMinute = schlosserStartMinute + job.schlosserMinutes;
    const robotStartMinute = Math.max(robotAvailableAt, schlosserEndMinute);

    return {
      job,
      vorrichtung: job.vorrichtung,
      schlosserStartMinute,
      schlosserEndMinute,
      schlosserWorkerIndex,
      robotStartMinute,
      robotEndMinute: robotStartMinute + robotMinutes,
      robotMinutes,
    };
  }

  private orderJobsForSimulation(
    jobs: Job[],
    carriedJobIds = new Set<string>(),
  ): Job[] {
    return [...jobs].sort((first, second) => {
      const firstIsCarried = carriedJobIds.has(first.id);
      const secondIsCarried = carriedJobIds.has(second.id);

      if (firstIsCarried !== secondIsCarried) {
        return firstIsCarried ? -1 : 1;
      }

      if (first.carriedFromPreviousShift !== second.carriedFromPreviousShift) {
        return first.carriedFromPreviousShift ? -1 : 1;
      }

      if (first.isForced !== second.isForced) {
        return first.isForced ? -1 : 1;
      }

      if (first.isPriority !== second.isPriority) {
        return first.isPriority ? -1 : 1;
      }

      if (first.schonGeheftet !== second.schonGeheftet) {
        return first.schonGeheftet ? -1 : 1;
      }

      if (first.schritt !== second.schritt) {
        return first.schritt - second.schritt;
      }

      return first.createdAt.getTime() - second.createdAt.getTime();
    });
  }

  private orderCapacitiesByShift(
    capacities: ShiftCapacity[],
  ): ShiftCapacity[] {
    return [...capacities].sort(
      (first, second) =>
        this.getShiftOrder(first.shift) - this.getShiftOrder(second.shift),
    );
  }

  private getTargetRobotMinutes(capacity: ShiftCapacity): number {
    return Math.round(
      SHIFT_WORKING_MINUTES * (capacity.targetRobotPercent / 100),
    );
  }

  private getUniqueJobs(jobs: Job[]): Job[] {
    return Array.from(new Map(jobs.map((job) => [job.id, job])).values());
  }

  private createFixtureTimeline(vorrichtungCount: number): Map<number, number> {
    const fixtureAvailableAt = new Map<number, number>();

    for (let vorrichtung = 1; vorrichtung <= vorrichtungCount; vorrichtung++) {
      fixtureAvailableAt.set(vorrichtung, 0);
    }

    return fixtureAvailableAt;
  }

  private createWorkerTimeline(schlosserCount: number): number[] {
    return Array.from({ length: schlosserCount }, () => 0);
  }

  private findEarliestAvailableWorker(workerAvailableAt: number[]): number {
    return workerAvailableAt.reduce(
      (earliestIndex, availableAt, currentIndex) =>
        availableAt < workerAvailableAt[earliestIndex]
          ? currentIndex
          : earliestIndex,
      0,
    );
  }

  private toPlannedJobTimeline(
    simulation: JobSimulationCandidate,
  ): PlannedJobTimeline {
    return {
      job: simulation.job,
      vorrichtung: simulation.vorrichtung,
      schlosserStartMinute: simulation.schlosserStartMinute,
      schlosserEndMinute: simulation.schlosserEndMinute,
      robotStartMinute: simulation.robotStartMinute,
      robotEndMinute: simulation.robotEndMinute,
      robotMinutes: simulation.robotMinutes,
    };
  }
}
