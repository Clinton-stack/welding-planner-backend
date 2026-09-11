import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Robot } from 'src/robots/entities/robot.entity';
import { ShiftCapacity } from './entities/shift-capacity.entity';
import { ShiftCapacityService } from './shift-capacity.service';

describe('ShiftCapacityService', () => {
  let service: ShiftCapacityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiftCapacityService,
        {
          provide: getRepositoryToken(ShiftCapacity),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Robot),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ShiftCapacityService>(ShiftCapacityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
