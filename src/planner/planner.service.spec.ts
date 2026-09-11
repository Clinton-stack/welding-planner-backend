import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Job } from 'src/jobs/entities/job.entity';
import { JobStatus } from 'src/jobs/enums/job-status.enum';
import { JobType } from 'src/jobs/enums/job-type.enum';
import { ShiftCode } from 'src/jobs/enums/shift-code.enum';
import { Robot } from 'src/robots/entities/robot.entity';
import { ShiftCapacity } from 'src/shift-capacity/entities/shift-capacity.entity';
import { Repository } from 'typeorm';
import { PlannerSimulatorService } from './planner-simulator.service';
import { PlannerService } from './planner.service';

type MockRepository<T extends object = object> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

const robot: Robot = {
  id: 'robot-1',
  name: 'Pesa Robot',
  assetId: 'AP-2904',
  location: 'Halle 1',
  process: 'Laser welding',
  isActive: true,
  createdAt: new Date('2026-06-01T00:00:00.000Z'),
  updatedAt: new Date('2026-06-01T00:00:00.000Z'),
};

describe('PlannerService', () => {
  let service: PlannerService;
  let robotRepository: MockRepository<Robot>;
  let jobRepository: MockRepository<Job>;
  let shiftCapacityRepository: MockRepository<ShiftCapacity>;

  beforeEach(async () => {
    robotRepository = {
      findOne: jest.fn().mockResolvedValue(robot),
    };
    jobRepository = {
      find: jest.fn(),
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
    };
    shiftCapacityRepository = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlannerService,
        PlannerSimulatorService,
        {
          provide: getRepositoryToken(Robot),
          useValue: robotRepository,
        },
        {
          provide: getRepositoryToken(Job),
          useValue: jobRepository,
        },
        {
          provide: getRepositoryToken(ShiftCapacity),
          useValue: shiftCapacityRepository,
        },
      ],
    }).compile();

    service = module.get<PlannerService>(PlannerService);
  });

  it('rotates robot work through available VR places while Schlossers prepare the next jobs', async () => {
    jobRepository.find!.mockResolvedValue([
      createJob({
        id: 'job-a',
        faNumber: 'FA-A',
        vorrichtung: 1,
        anlageMinutes: 60,
        schlosserMinutes: 80,
        schonGeheftet: true,
      }),
      createJob({
        id: 'job-b',
        faNumber: 'FA-B',
        vorrichtung: 2,
        anlageMinutes: 70,
        schlosserMinutes: 80,
      }),
      createJob({
        id: 'job-c',
        faNumber: 'FA-C',
        vorrichtung: 3,
        anlageMinutes: 90,
        schlosserMinutes: 60,
      }),
    ]);
    shiftCapacityRepository.find!.mockResolvedValue([
      createCapacity({ shift: ShiftCode.FRUEH, schlosserCount: 1 }),
    ]);

    const result = await service.createRecommendation({
      robotId: robot.id,
      date: '2026-06-08',
    });

    const [frueh] = result.shiftSimulations;

    expect(frueh.plannedJobs).toHaveLength(3);
    expect(frueh.plannedJobs.map((plannedJob) => plannedJob.job.faNumber)).toEqual([
      'FA-A',
      'FA-B',
      'FA-C',
    ]);
    expect(frueh.plannedJobs.map(toRobotWindow)).toEqual([
      '0-60',
      '80-150',
      '150-240',
    ]);
    expect(frueh.robotUsedMinutes).toBe(220);
    expect(frueh.robotUtilizationPercent).toBe(49);
  });

  it('uses targetRobotPercent as the planning limit for a shift', async () => {
    jobRepository.find!.mockResolvedValue([
      createJob({
        id: 'job-too-large',
        faNumber: 'FA-TARGET',
        anlageMinutes: 430,
        schonGeheftet: true,
      }),
    ]);
    shiftCapacityRepository.find!.mockResolvedValue([
      createCapacity({
        shift: ShiftCode.FRUEH,
        targetRobotPercent: 95,
      }),
    ]);

    const result = await service.createRecommendation({
      robotId: robot.id,
      date: '2026-06-08',
    });

    const [frueh] = result.shiftSimulations;

    expect(frueh.targetRobotMinutes).toBe(428);
    expect(frueh.plannedJobs).toHaveLength(0);
    expect(frueh.rolloverJobs.map((job) => job.faNumber)).toEqual([
      'FA-TARGET',
    ]);
  });

  it('uses remainingAnlageMinutes for an SU carryover job', async () => {
    jobRepository.find!.mockResolvedValue([
      createJob({
        id: 'job-su',
        faNumber: 'FA-SU',
        anlageMinutes: 100,
        remainingAnlageMinutes: 30,
        carriedFromPreviousShift: true,
        schonGeheftet: true,
        shift: ShiftCode.NACHT,
      }),
    ]);
    shiftCapacityRepository.find!.mockResolvedValue([
      createCapacity({ shift: ShiftCode.NACHT }),
    ]);

    const result = await service.createRecommendation({
      robotId: robot.id,
      date: '2026-06-08',
    });

    const [nacht] = result.shiftSimulations;

    expect(nacht.plannedJobs).toHaveLength(1);
    expect(nacht.plannedJobs[0].robotMinutes).toBe(30);
    expect(nacht.robotUsedMinutes).toBe(30);
  });

  it('warns about missing previous steps without blocking planning', async () => {
    jobRepository.find!.mockResolvedValue([
      createJob({
        id: 'job-step-2',
        faNumber: 'FA-CHAIN',
        schritt: 2,
        anlageMinutes: 60,
        schonGeheftet: false,
      }),
    ]);
    jobRepository.findOne!.mockResolvedValue(null);
    shiftCapacityRepository.find!.mockResolvedValue([
      createCapacity({ shift: ShiftCode.FRUEH }),
    ]);

    const result = await service.createRecommendation({
      robotId: robot.id,
      date: '2026-06-08',
    });

    expect(result.sequenceWarnings).toHaveLength(1);
    expect(result.shiftSimulations[0].plannedJobs).toHaveLength(1);
  });

  it('applies the simulated shift when a job rolls from one shift into the next available shift', async () => {
    const job = createJob({
      id: 'job-rolls-to-spaet',
      faNumber: 'FA-ROLLS-S',
      anlageMinutes: 60,
      schonGeheftet: true,
      shift: ShiftCode.FRUEH,
    });
    jobRepository.find!.mockResolvedValue([job]);
    shiftCapacityRepository.find!.mockResolvedValue([
      createCapacity({
        id: 'capacity-f',
        shift: ShiftCode.FRUEH,
        targetRobotPercent: 10,
      }),
      createCapacity({
        id: 'capacity-s',
        shift: ShiftCode.SPAET,
      }),
    ]);

    const result = await service.applyPlan({
      robotId: robot.id,
      date: '2026-06-08',
    });

    expect(job.shift).toBe(ShiftCode.SPAET);
    expect(job.date).toBe('2026-06-08');
    expect(job.carriedFromPreviousShift).toBe(false);
    expect(result.appliedJobs).toEqual([
      {
        jobId: job.id,
        faNumber: job.faNumber,
        previousShift: ShiftCode.FRUEH,
        plannedShift: ShiftCode.SPAET,
      },
    ]);
    expect(result.movedToNextProductionDay).toEqual([]);
    expect(result.summary.updatedJobs).toBe(1);
    expect(jobRepository.save).toHaveBeenCalledWith([job]);
  });

  it('moves final rollover jobs to the next production day Nacht shift', async () => {
    const job = createJob({
      id: 'job-next-day',
      faNumber: 'FA-NEXT-DAY',
      anlageMinutes: 500,
      schonGeheftet: true,
      shift: ShiftCode.FRUEH,
    });
    jobRepository.find!.mockResolvedValue([job]);
    shiftCapacityRepository.find!.mockResolvedValue([
      createCapacity({
        shift: ShiftCode.FRUEH,
      }),
    ]);

    const result = await service.applyPlan({
      robotId: robot.id,
      date: '2026-06-08',
    });

    expect(job.shift).toBe(ShiftCode.NACHT);
    expect(job.date).toBe('2026-06-09');
    expect(job.carriedFromPreviousShift).toBe(true);
    expect(result.appliedJobs).toEqual([]);
    expect(result.movedToNextProductionDay).toEqual([
      {
        jobId: job.id,
        faNumber: job.faNumber,
        previousDate: '2026-06-08',
        previousShift: ShiftCode.FRUEH,
        nextDate: '2026-06-09',
        nextShift: ShiftCode.NACHT,
      },
    ]);
    expect(result.summary.movedToNextProductionDay).toBe(1);
    expect(jobRepository.save).toHaveBeenCalledWith([job]);
  });

  it('does not save jobs when the applied plan makes no changes', async () => {
    const job = createJob({
      id: 'job-stays-frueh',
      faNumber: 'FA-STAYS-F',
      anlageMinutes: 60,
      schonGeheftet: true,
      shift: ShiftCode.FRUEH,
    });
    jobRepository.find!.mockResolvedValue([job]);
    shiftCapacityRepository.find!.mockResolvedValue([
      createCapacity({
        shift: ShiftCode.FRUEH,
      }),
    ]);

    const result = await service.applyPlan({
      robotId: robot.id,
      date: '2026-06-08',
    });

    expect(job.shift).toBe(ShiftCode.FRUEH);
    expect(job.date).toBe('2026-06-08');
    expect(result.appliedJobs).toEqual([]);
    expect(result.movedToNextProductionDay).toEqual([]);
    expect(result.summary.updatedJobs).toBe(0);
    expect(result.summary.movedToNextProductionDay).toBe(0);
    expect(jobRepository.save).not.toHaveBeenCalled();
  });
});

function createJob(overrides: Partial<Job> = {}): Job {
  return {
    id: 'job-1',
    faNumber: 'FA-001',
    projekt: 'Pesa',
    artikelNummer: '95',
    schritt: 1,
    vorrichtung: 1,
    menge: 1,
    robotId: robot.id,
    anlageMinutes: 60,
    schlosserMinutes: 80,
    ruestMinutes: 0,
    jobType: JobType.PRODUCTION,
    progressPercent: undefined,
    remainingAnlageMinutes: undefined,
    carriedFromPreviousShift: false,
    schonGeheftet: false,
    isPriority: false,
    isForced: false,
    isHeld: false,
    status: JobStatus.OPEN,
    shift: ShiftCode.FRUEH,
    date: '2026-06-08',
    createdAt: new Date('2026-06-08T06:00:00.000Z'),
    updatedAt: new Date('2026-06-08T06:00:00.000Z'),
    ...overrides,
  };
}

function createCapacity(
  overrides: Partial<ShiftCapacity> = {},
): ShiftCapacity {
  return {
    id: 'capacity-1',
    robotId: robot.id,
    date: '2026-06-08',
    shift: ShiftCode.FRUEH,
    schlosserCount: 2,
    vorrichtungCount: 3,
    targetRobotPercent: 100,
    createdAt: new Date('2026-06-08T00:00:00.000Z'),
    updatedAt: new Date('2026-06-08T00:00:00.000Z'),
    ...overrides,
  };
}

function toRobotWindow(plannedJob: {
  robotStartMinute: number;
  robotEndMinute: number;
}): string {
  return `${plannedJob.robotStartMinute}-${plannedJob.robotEndMinute}`;
}
