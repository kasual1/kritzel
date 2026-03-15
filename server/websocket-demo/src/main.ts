import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Server } from '@hocuspocus/server';

async function bootstrap() {
  // Create Hocuspocus server (standalone, handles its own WebSocket upgrade)
  const hocuspocus = new Server({
    port: 1234,
    onConnect: async (data) => {
      console.log(`Client connected: ${data.documentName}`);
    },
    onDisconnect: async (data) => {
      console.log(`Client disconnected: ${data.documentName}`);
    },
    onAuthenticate: async () => {
      // Allow all connections for demo purposes
      return {};
    },
    onChange: async (data) => {
      const metadata = data.document.getMap('metadata');
      const type = metadata.get('type');
      const isPublic = metadata.get('isPublic');
      console.log(
        `Document changed: ${data.documentName} | type=${type}, isPublic=${isPublic}`,
      );
    },
    onLoadDocument: async (data) => {
      console.log(`Loading document: ${data.documentName}`);
      return data.document;
    },
    onStoreDocument: async (data) => {
      console.log(`Storing document: ${data.documentName}`);
    },
  });

  // Start Hocuspocus on port 1234
  await hocuspocus.listen();
  console.log('Hocuspocus WebSocket server is running on: ws://localhost:1234');

  // Create NestJS app for HTTP endpoints
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`HTTP server is running on: ${await app.getUrl()}`);
}
bootstrap();
