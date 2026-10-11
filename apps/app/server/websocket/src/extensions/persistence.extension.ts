import type { Extension } from "@hocuspocus/server";
import type { Pool } from "pg";
import * as Y from "yjs";

interface DocumentPayload {
  documentName: string;
  document: Y.Doc;
  context: { userId: string; email: string | null; isGuest: boolean };
}

export class PersistenceExtension implements Extension {
  constructor(private readonly pool: Pool) {}

  async onLoadDocument({ documentName, document, context }: DocumentPayload) {
    const { rows } = await this.pool.query(
      `SELECT data, "public", user_id FROM documents WHERE id = $1`,
      [documentName],
    );

    if (rows.length > 0) {
      const row = rows[0];
      
      if (!row.public && context.isGuest) {
        return;
      }

      if (!row.public && row.user_id && row.user_id !== context.userId) {
        throw new Error("Forbidden");
      }

      if (row.data) {
        Y.applyUpdate(document, row.data);
      }
    }
  }

  async onStoreDocument({ documentName, document, context }: DocumentPayload) {
    const state = Buffer.from(Y.encodeStateAsUpdate(document));
    const isPublic = document.getMap("metadata").get("isPublic") === true;
    const type = (document.getMap("metadata").get("type") as string) || "unknown";

    const { rows } = await this.pool.query(
      `SELECT user_id, "public" FROM documents WHERE id = $1`,
      [documentName],
    );
    const existing = rows.length > 0 ? rows[0] : null;

    if (context.isGuest) {
      return;
    }

    if (existing && !existing.public && existing.user_id && existing.user_id !== context.userId) {
      console.warn(`[onStoreDocument] Forbidden: user ${context.userId} cannot write to document "${documentName}" owned by ${existing.user_id}`);
      return;
    }

    const userId = existing?.user_id ?? context.userId;

    await this.pool.query(
      `INSERT INTO documents (id, data, "public", type, user_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         data = EXCLUDED.data,
         "public" = EXCLUDED."public",
         type = EXCLUDED.type,
         updated_at = NOW()`,
      [documentName, state, isPublic, type, userId],
    );
  }
}
