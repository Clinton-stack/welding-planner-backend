import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { JobStatus } from '../enums/job-status.enum';

@Entity()
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 80 })
  faNumber!: string;

  @Column({ length: 120 })
  projekt!: string;

  @Column()
  artikelNummer!: number;

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

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}