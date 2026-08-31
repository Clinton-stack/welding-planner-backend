import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RobotsModule } from './robots/robots.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [
    //Setting up the database connection using TypeORM with better-sqlite3 driver
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'planner.sqlite',
      autoLoadEntities: true,
      synchronize: true,
    }),
    RobotsModule,
    JobsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
