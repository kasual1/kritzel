import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('documents')
export class Document {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id: string;

  @Column({ type: 'bytea' })
  data: Buffer;

  @Column({ name: 'public', type: 'boolean', default: false })
  isPublic: boolean;

  @Column({ type: 'varchar', length: 20, default: 'state' })
  type: string;

  @Column({ name: 'user_id', type: 'varchar', length: 255, nullable: true })
  userId: string | null;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}
