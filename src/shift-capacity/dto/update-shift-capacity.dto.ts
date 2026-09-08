import { PartialType } from '@nestjs/swagger';
import { CreateShiftCapacityDto } from './create-shift-capacity.dto';

export class UpdateShiftCapacityDto extends PartialType(CreateShiftCapacityDto) {}
