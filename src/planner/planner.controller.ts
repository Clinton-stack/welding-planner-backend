import { Body, Controller, Post } from '@nestjs/common';
import { CreateRecommendationDto } from './dto/create-recommendation.dto';
import { PlannerService } from './planner.service';

@Controller('planner')
export class PlannerController {
  constructor(private readonly plannerService: PlannerService) {}

  @Post('recommendation')
  createRecommendation(@Body() dto: CreateRecommendationDto) {
    return this.plannerService.createRecommendation(dto);
  }

  @Post('apply')
  applyPlan(@Body() dto: CreateRecommendationDto) {
    return this.plannerService.applyPlan(dto);
  }
}
