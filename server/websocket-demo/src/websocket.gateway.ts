import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'ws';
import { Hocuspocus } from '@hocuspocus/server';
import { IncomingMessage } from 'http';

@WebSocketGateway(1234)
export class HocuspocusGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private hocuspocus: Hocuspocus;

  constructor() {
    this.hocuspocus = new Hocuspocus({
      onConnect: async (data) => {
        console.log(`Client connected: ${data.documentName}`);
      },

      onDisconnect: async (data) => {
        console.log(`Client disconnected: ${data.documentName}`);
      },

      onAuthenticate: async (data) => {
        // Optional: Add authentication logic here
        // For now, allow all connections
        return {};
      },

      onChange: async (data) => {
        console.log(`Document changed: ${data.documentName}`);
      },

      onLoadDocument: async (data) => {
        // Optional: Load document from database
        // For now, return empty document (will be synced from clients)
        console.log(`Loading document: ${data.documentName}`);
        return data.document;
      },

      onStoreDocument: async (data) => {
        // Optional: Store document to database
        console.log(`Storing document: ${data.documentName}`);
      },
    });
  }

  afterInit(server: Server) {
    console.log('Hocuspocus WebSocket Gateway initialized on port 1234');
  }

  handleConnection(client: any, request: IncomingMessage) {
    console.log('New WebSocket connection');
    // Handle the connection with Hocuspocus
    this.hocuspocus.handleConnection(client, request);
  }

  handleDisconnect(client: any) {
    console.log('Client disconnected from WebSocket');
  }

  getHocuspocus(): Hocuspocus {
    return this.hocuspocus;
  }
}
