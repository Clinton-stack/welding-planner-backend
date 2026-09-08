import { Injectable } from '@nestjs/common';
import { CreateShiftCapacityDto } from './dto/create-shift-capacity.dto';
import { UpdateShiftCapacityDto } from './dto/update-shift-capacity.dto';

@Injectable()
export class ShiftCapacityService {
  create(createShiftCapacityDto: CreateShiftCapacityDto) {
    return 'This action adds a new shiftCapacity';
  }

  findAll() {
    return `This action returns all shiftCapacity`;
  }

  findOne(id: number) {
    return `This action returns a #${id} shiftCapacity`;
  }

  update(id: number, updateShiftCapacityDto: UpdateShiftCapacityDto) {
    return `This action updates a #${id} shiftCapacity`;
  }

  remove(id: number) {
    return `This action removes a #${id} shiftCapacity`;
  }
}
