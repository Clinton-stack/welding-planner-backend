import { Test, TestingModule } from '@nestjs/testing';
import { ShiftCapacityController } from './shift-capacity.controller';
import { ShiftCapacityService } from './shift-capacity.service';

describe('ShiftCapacityController', () => {
  let controller: ShiftCapacityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShiftCapacityController],
      providers: [ShiftCapacityService],
    }).compile();

    controller = module.get<ShiftCapacityController>(ShiftCapacityController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
