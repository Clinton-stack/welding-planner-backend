import { ShiftCode } from 'src/jobs/enums/shift-code.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Index(['robotId', 'date', 'shift'], { unique: true })
@Entity()
export class ShiftCapacity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  robotId!: string;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'text' })
  shift!: ShiftCode;

  @Column({ default: 0 })
  schlosserCount!: number;

  @Column({ default: 0 })
  vorrichtungCount!: number;

  @Column({ default: 100 })
  targetRobotPercent!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
