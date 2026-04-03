import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hashKey } from "@/lib/auth";
import { nanoid } from "nanoid";

// List API keys for an org
export async function GET(request: NextRequest) {
  const orgId = request.headers.get("x-org-id");
  if (!orgId) {
    return NextResponse.json({ error: "Missing x-org-id header" }, { status: 400 });
  }

  const sql = getDb();
  const keys = await sql`
    SELECT id, name, key_prefix, provider, is_active, last_used_at, created_at
    FROM api_keys
    WHERE org_id = ${orgId}
    ORDER BY created_at DESC
  `;

  return NextResponse.json({ keys });
}

// Create a new API key
export async function POST(request: NextRequest) {
  const orgId = request.headers.get("x-org-id");
  if (!orgId) {
    return NextResponse.json({ error: "Missing x-org-id header" }, { status: 400 });
  }

  const body = await request.json();
  const { name, provider, upstreamKey } = body;

  if (!name || !provider || !upstreamKey) {
    return NextResponse.json(
      { error: "name, provider, and upstreamKey are required" },
      { status: 400 }
    );
  }

  if (!["openai", "anthropic"].includes(provider)) {
    return NextResponse.json(
      { error: "provider must be 'openai' or 'anthropic'" },
      { status: 400 }
    );
  }

  // Generate a gateway API key
  const rawKey = `sk-gw-${nanoid(32)}`;
  const keyPrefix = rawKey.slice(0, 12);
  const keyHashValue = await hashKey(rawKey);

  const sql = getDb();
  const rows = await sql`
    INSERT INTO api_keys (org_id, name, key_hash, key_prefix, provider, upstream_key_encrypted)
    VALUES (${orgId}, ${name}, ${keyHashValue}, ${keyPrefix}, ${provider}, ${upstreamKey})
    RETURNING id, name, key_prefix, provider, created_at
  `;

  return NextResponse.json(
    {
      key: rows[0],
      rawKey, // Only shown once at creation time
    },
    { status: 201 }
  );
}
