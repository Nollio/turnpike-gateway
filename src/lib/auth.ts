import { getDb } from "./db";

export interface AuthResult {
  orgId: string;
  apiKeyId: string;
  provider: string;
  upstreamKey: string;
}

export async function authenticateRequest(
  authHeader: string | null
): Promise<AuthResult | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const keyHash = await hashKey(token);

  const sql = getDb();
  const rows = await sql`
    SELECT ak.id as api_key_id, ak.org_id, ak.provider, ak.upstream_key_encrypted,
           o.plan
    FROM api_keys ak
    JOIN organizations o ON o.id = ak.org_id
    WHERE ak.key_hash = ${keyHash}
      AND ak.is_active = true
  `;

  if (rows.length === 0) return null;

  const row = rows[0];

  // Update last_used_at (fire and forget)
  sql`UPDATE api_keys SET last_used_at = now() WHERE id = ${row.api_key_id}`.catch(
    () => {}
  );

  return {
    orgId: row.org_id,
    apiKeyId: row.api_key_id,
    provider: row.provider,
    upstreamKey: row.upstream_key_encrypted, // TODO: decrypt in production
  };
}

export async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
