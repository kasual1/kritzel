import { Server } from '@hocuspocus/server';

const port = Number(process.env.PORT) || 1234;

const server = new Server({
  port,
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

server.listen().then(() => {
  console.log(`Hocuspocus WebSocket server is running on: ws://localhost:${port}`);
});
