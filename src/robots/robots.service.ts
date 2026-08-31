import { Injectable } from '@nestjs/common';
import { CreateRobotDto } from './dto/create-robot.dto';
import { UpdateRobotDto } from './dto/update-robot.dto';
import { Repository } from 'typeorm';
import { Robot } from './entities/robot.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { throwIfExists } from 'src/helpers/throw-if-exists';
import { findOneOrThrow } from 'src/helpers/find-or-throw';

@Injectable()
export class RobotsService {
constructor(
  @InjectRepository(Robot)
  private readonly robotsRepository: Repository <Robot>,
){}
  
async create(createRobotDto: CreateRobotDto) : Promise<Robot> {
  await throwIfExists(
    this.robotsRepository,
    {assetId: createRobotDto.assetId},
    'Robot assetId',
  )
  const robot = this.robotsRepository.create(createRobotDto);
  return this.robotsRepository.save(robot);

  }

  async findAll() {
    return this.robotsRepository.find({
      order: {
        name: 'ASC',
      }
    });
  }

  async findOne(id: string): Promise<Robot> {
    return findOneOrThrow(this.robotsRepository, {id}, 'Robot'); ;
  }

  async update(id: string, updateRobotDto: UpdateRobotDto) : Promise<Robot> {
    const robot = await this.findOne(id);

    if(updateRobotDto.assetId && updateRobotDto.assetId !== robot.assetId){
      await throwIfExists(
        this.robotsRepository,
        {assetId: updateRobotDto.assetId},
        'Robot assetId'
      )
    }

    Object.assign(robot, updateRobotDto)
    return this.robotsRepository.save(robot)
  }

  async remove(id: string): Promise<{message: string}> {
    const robot = await this.findOne(id)
    robot.isActive = false
    return {
      message: 'Robot deactivated successfully'
    }
  }
}
