import { Injectable } from '@nestjs/common';
import { CreateShiftCapacityDto } from './dto/create-shift-capacity.dto';
import { UpdateShiftCapacityDto } from './dto/update-shift-capacity.dto';
import { ShiftCapacity } from './entities/shift-capacity.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { findOneOrThrow } from 'src/helpers/find-or-throw';
import { throwIfExists } from 'src/helpers/throw-if-exists';
import { Robot } from 'src/robots/entities/robot.entity';
import { FindShiftCapacityQueryDto } from './dto/find-shift-capacity-query.dto';

@Injectable()
export class ShiftCapacityService {
  constructor(
    @InjectRepository(ShiftCapacity)
    private readonly shiftCapacityRepository: Repository<ShiftCapacity>,

    @InjectRepository(Robot)
    private readonly robotRepository: Repository<Robot>,
  ) {}

  async create(
    createShiftCapacityDto: CreateShiftCapacityDto,
  ): Promise<ShiftCapacity> {
    await findOneOrThrow(
      this.robotRepository,
      { id: createShiftCapacityDto.robotId },
      'Robot',
    );

    await throwIfExists(
      this.shiftCapacityRepository,
      {
        robotId: createShiftCapacityDto.robotId,
        date: createShiftCapacityDto.date,
        shift: createShiftCapacityDto.shift,
      },
      'Shift capacity for this robot/date/shift',
    );
    const shiftCapacity = this.shiftCapacityRepository.create(
      createShiftCapacityDto,
    );
    return this.shiftCapacityRepository.save(shiftCapacity);
  }

  async findAll(query: FindShiftCapacityQueryDto): Promise<ShiftCapacity[]> {
    return this.shiftCapacityRepository.find({

      where:{
        ...(query.robotId ? { robotId: query.robotId } : {}),
        ...(query.date ? { date: query.date } : {}),
        ...(query.shift ? { shift: query.shift } : {}),
      },

      order: { date: 'ASC', shift: 'ASC' },
    });
  }

  findOne(id: string): Promise<ShiftCapacity> {
    return findOneOrThrow(
      this.shiftCapacityRepository,
      { id: id },
      'ShiftCapacity',
    );
  }

  async update(
    id: string,
    updateShiftCapacityDto: UpdateShiftCapacityDto,
  ): Promise<ShiftCapacity> {
    const shiftCapacity = await this.findOne(id);

    if (
      updateShiftCapacityDto.robotId &&
      updateShiftCapacityDto.robotId !== shiftCapacity.robotId
    ) {
      await findOneOrThrow(
        this.robotRepository,
        { id: updateShiftCapacityDto.robotId },
        'Robot',
      );
    }

    const nextRobotId = updateShiftCapacityDto.robotId ?? shiftCapacity.robotId;

    const nextDate = updateShiftCapacityDto.date ?? shiftCapacity.date;

    const nextShift = updateShiftCapacityDto.shift ?? shiftCapacity.shift;

    const isUniqueKeyChanging =
      nextRobotId !== shiftCapacity.robotId ||
      nextDate !== shiftCapacity.date ||
      nextShift !== shiftCapacity.shift;

    if (isUniqueKeyChanging) {
      await throwIfExists(
        this.shiftCapacityRepository,
        {
          robotId: nextRobotId,
          date: nextDate,
          shift: nextShift,
        },
        'Shift capacity for this robot/date/shift',
      );
    }

    Object.assign(shiftCapacity, updateShiftCapacityDto);

    return this.shiftCapacityRepository.save(shiftCapacity);
  }
  async remove(id: string): Promise<{ message: string }> {
    const shiftCapacity = await this.findOne(id);
    await this.shiftCapacityRepository.remove(shiftCapacity);
    return { message: `ShiftCapacity with id ${id} has been removed.` };
  }
}
