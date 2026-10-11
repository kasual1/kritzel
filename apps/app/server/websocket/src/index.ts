import { Server } from "@hocuspocus/server";
import { initializeDatabase } from "./database";
import { AuthExtension } from "./extensions/auth.extension";
import { PersistenceExtension } from "./extensions/persistence.extension";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("JWT_SECRET environment variable is required");
  process.exit(1);
}
const jwtSecret: string = JWT_SECRET;

async function start(): Promise<void> {
  const pool = await initializeDatabase();

  const server = new Server({
    extensions: [
      new AuthExtension(jwtSecret),
      new PersistenceExtension(pool),
    ],
    port: 1234,
  });

  await server.listen();
  console.log("Hocuspocus WebSocket server is running on ws://localhost:1234");
}

start().catch((err) => {
  console.error("Failed to start WebSocket server:", err);
  process.exit(1);
});
