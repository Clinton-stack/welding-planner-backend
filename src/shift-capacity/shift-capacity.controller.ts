import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ShiftCapacityService } from './shift-capacity.service';
import { CreateShiftCapacityDto } from './dto/create-shift-capacity.dto';
import { UpdateShiftCapacityDto } from './dto/update-shift-capacity.dto';
import { FindShiftCapacityQueryDto } from './dto/find-shift-capacity-query.dto';

@Controller('shift-capacity')
export class ShiftCapacityController {
  constructor(private readonly shiftCapacityService: ShiftCapacityService) {}

  @Post()
  @ApiOperation({ summary: 'Create shift capacity' })
  @ApiResponse({ status: 404, description: 'Robot not found' })
  @ApiResponse({
    status: 409,
    description: 'Shift capacity for this robot/date/shift already exists',
  })
  create(@Body() createShiftCapacityDto: CreateShiftCapacityDto) {
    return this.shiftCapacityService.create(createShiftCapacityDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get shift capacities' })
  findAll(@Query() query: FindShiftCapacityQueryDto) {
    return this.shiftCapacityService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get shift capacity by ID' })
  @ApiParam({ name: 'id', description: 'Shift capacity ID' })
  @ApiResponse({ status: 404, description: 'Shift capacity not found' })
  findOne(@Param('id') id: string) {
    return this.shiftCapacityService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update shift capacity' })
  @ApiParam({ name: 'id', description: 'Shift capacity ID' })
  @ApiResponse({ status: 404, description: 'Shift capacity or robot not found' })
  @ApiResponse({
    status: 409,
    description: 'Shift capacity for this robot/date/shift already exists',
  })
  update(
    @Param('id') id: string,
    @Body() updateShiftCapacityDto: UpdateShiftCapacityDto,
  ) {
    return this.shiftCapacityService.update(id, updateShiftCapacityDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete shift capacity' })
  @ApiParam({ name: 'id', description: 'Shift capacity ID' })
  @ApiResponse({ status: 404, description: 'Shift capacity not found' })
  remove(@Param('id') id: string) {
    return this.shiftCapacityService.remove(id);
  }
}
