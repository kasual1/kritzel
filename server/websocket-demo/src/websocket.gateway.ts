import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'ws';
import * as WebSocket from 'ws';

@WebSocketGateway(1234, {
  transports: ['websocket'],
})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    console.log('WebSocket Gateway initialized on port 1234');
  }

  handleConnection(client: WebSocket, ...args: any[]) {
    console.log('Client connected:', client);
  }

  handleDisconnect(client: WebSocket) {
    console.log('Client disconnected');
  }

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: any,
    @ConnectedSocket() client: WebSocket,
  ): void {
    console.log('Received message:', data);
    // Echo the message back to the client
    client.send(JSON.stringify({ event: 'message', data }));
  }

  // Broadcast message to all connected clients
  broadcast(event: string, data: any) {
    this.server.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ event, data }));
      }
    });
  }
}
