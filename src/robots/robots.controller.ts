import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RobotsService } from './robots.service';
import { CreateRobotDto } from './dto/create-robot.dto';
import { UpdateRobotDto } from './dto/update-robot.dto';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Robots')
@Controller('robots')
export class RobotsController {
  constructor(private readonly robotsService: RobotsService) {}

  @Post()
  @ApiBody({ type: CreateRobotDto })
  @ApiOperation({ summary: 'create robot' })
  @ApiResponse({ status: 409, description: 'Robot assetId already exists' })
  create(@Body() createRobotDto: CreateRobotDto) {
    return this.robotsService.create(createRobotDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all robot' })
  findAll() {
    return this.robotsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get robot by ID' })
  @ApiParam({ name: 'id', description: 'Robot ID' })
  @ApiResponse({ status: 404, description: 'Robot not found' })
  findOne(@Param('id') id: string) {
    return this.robotsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update robot' })
  @ApiParam({ name: 'id', description: 'Robot ID' })
  @ApiResponse({ status: 404, description: 'Robot not found' })
  @ApiResponse({ status: 409, description: 'Robot assetId already exists' })
  update(@Param('id') id: string, @Body() updateRobotDto: UpdateRobotDto) {
    return this.robotsService.update(id, updateRobotDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate robot' })
  @ApiParam({ name: 'id', description: 'Robot ID' })
  @ApiResponse({ status: 404, description: 'Robot not found' })
  remove(@Param('id') id: string) {
    return this.robotsService.remove(id);
  }
}
 