import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { JobStatus } from '../enums/job-status.enum';
import { JobType } from '../enums/job-type.enum';
import { ShiftCode } from '../enums/shift-code.enum';

@Entity()
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 80 })
  faNumber!: string;

  @Column({ length: 120 })
  projekt!: string;

  @Column()
  artikelNummer!: string;

  @Column()
  schritt!: number;

  @Column()
  vorrichtung!: number;

  @Column()
  menge!: number;

  @Column()
  robotId!: string;

  @Column()
  anlageMinutes!: number;

  @Column()
  schlosserMinutes!: number;

  @Column()
  ruestMinutes!: number;

  @Column({
    type: 'text',
    default: JobType.PRODUCTION,
  })
  jobType!: JobType;

  @Column({ nullable: true })
  progressPercent?: number;

  @Column({ nullable: true })
  remainingAnlageMinutes?: number;

  @Column({ default: false })
  carriedFromPreviousShift!: boolean;

  @Column({ default: false })
  schonGeheftet!: boolean;

  @Column({ default: false })
  isPriority!: boolean;

  @Column({ default: false })
  isForced!: boolean;

  @Column({ default: false })
  isHeld!: boolean;

  @Column({
    type: 'text',
    default: JobStatus.OPEN,
  })
  status!: JobStatus;
  @Column({
    type: 'text'
  })
  shift!: ShiftCode;

  @Column({ type: 'date'})
  date!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
