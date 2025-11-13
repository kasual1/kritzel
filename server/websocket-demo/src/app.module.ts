import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HocuspocusGateway } from './websocket.gateway';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, HocuspocusGateway],
})
export class AppModule {}
