import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Asset } from './asset.entity';
import { AssetController } from './asset.controller';
import { AssetService } from './asset.service';
import { R2Service } from './r2.service';

@Module({
  imports: [TypeOrmModule.forFeature([Asset]), AuthModule],
  controllers: [AssetController],
  providers: [AssetService, R2Service],
  exports: [AssetService, R2Service],
})
export class AssetModule {}
