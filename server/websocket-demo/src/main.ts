import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WsAdapter } from '@nestjs/platform-ws';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });
  app.useWebSocketAdapter(new WsAdapter(app));
  await app.listen(process.env.PORT ?? 3000);
  console.log(`HTTP server is running on: ${await app.getUrl()}`);
  console.log('WebSocket server is running on: ws://localhost:1234');
}
bootstrap();
