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
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { FindJobsQueryDto } from './dto/find-jobs-query';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @ApiOperation({ summary: 'Create job' })
  @ApiResponse({ status: 404, description: 'Robot not found' })
  create(@Body() createJobDto: CreateJobDto) {
    return this.jobsService.create(createJobDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get jobs' })
  findAll(@Query() query: FindJobsQueryDto) {
    return this.jobsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job by ID' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update job' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponse({ status: 404, description: 'Job or robot not found' })
  update(@Param('id') id: string, @Body() updateJobDto: UpdateJobDto) {
    return this.jobsService.update(id, updateJobDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete job' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  remove(@Param('id') id: string) {
    return this.jobsService.remove(id);
  }
}
