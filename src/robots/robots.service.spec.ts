import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Robot } from './entities/robot.entity';
import { RobotsService } from './robots.service';

describe('RobotsService', () => {
  let service: RobotsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RobotsService,
        {
          provide: getRepositoryToken(Robot),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<RobotsService>(RobotsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
