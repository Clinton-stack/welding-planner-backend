import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ShiftCapacityService } from './shift-capacity.service';
import { CreateShiftCapacityDto } from './dto/create-shift-capacity.dto';
import { UpdateShiftCapacityDto } from './dto/update-shift-capacity.dto';

@Controller('shift-capacity')
export class ShiftCapacityController {
  constructor(private readonly shiftCapacityService: ShiftCapacityService) {}

  @Post()
  create(@Body() createShiftCapacityDto: CreateShiftCapacityDto) {
    return this.shiftCapacityService.create(createShiftCapacityDto);
  }

  @Get()
  findAll() {
    return this.shiftCapacityService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shiftCapacityService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateShiftCapacityDto: UpdateShiftCapacityDto) {
    return this.shiftCapacityService.update(+id, updateShiftCapacityDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shiftCapacityService.remove(+id);
  }
}
