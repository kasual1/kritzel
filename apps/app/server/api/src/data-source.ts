import { DataSource } from 'typeorm';
import { User } from './user/user.entity';
import { Document } from './document/document.entity';
import { Asset } from './asset/asset.entity';

export default new DataSource({
  type: 'postgres',
  url:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/kritzel',
  entities: [User, Document, Asset],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
});
