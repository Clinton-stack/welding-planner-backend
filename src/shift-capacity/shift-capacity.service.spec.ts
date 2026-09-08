import { Test, TestingModule } from '@nestjs/testing';
import { ShiftCapacityService } from './shift-capacity.service';

describe('ShiftCapacityService', () => {
  let service: ShiftCapacityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShiftCapacityService],
    }).compile();

    service = module.get<ShiftCapacityService>(ShiftCapacityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
