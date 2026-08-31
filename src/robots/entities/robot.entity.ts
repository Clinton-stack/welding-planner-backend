import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";


@Entity()
export class Robot {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({length: 100})
    name!: string;
    
    @Index({unique: true})
    @Column({length: 80})
    assetId!: string;

    @Column({length: 80})
    location!: string;

    @Column({length: 80})
    process!: string;

    @Column({default: true})
    isActive!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

}
