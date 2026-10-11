import type { Extension } from "@hocuspocus/server";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";

interface AuthPayload {
  token?: string;
}

export class AuthExtension implements Extension {
  constructor(private readonly jwtSecret: string) {}

  async onAuthenticate({ token }: AuthPayload) {
    if (!token) {
      const guestId = `guest-${randomUUID()}`;
      console.log(`Guest connected: ${guestId}`);
      return { userId: guestId, email: null, isGuest: true };
    }

    try {
      const payload = jwt.verify(token, this.jwtSecret, {
        audience: "ws",
      }) as unknown as { sub: string; email: string };

      return { userId: payload.sub, email: payload.email, isGuest: false };
    } catch {
      throw new Error("Unauthorized");
    }
  }
}
