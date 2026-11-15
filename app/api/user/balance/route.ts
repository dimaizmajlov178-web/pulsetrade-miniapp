import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const telegramId = Number(searchParams.get("telegramId")) || 123456789;

    let userRes = await query("SELECT * FROM users WHERE telegram_id = $1", [telegramId]);
    let user = userRes.rows[0];

    if (!user) {
      const maxUid = await query("SELECT COALESCE(MAX(uid), 624838) as max_uid FROM users");
      const nextUid = Number(maxUid.rows[0].max_uid) + 1;
      const insertRes = await query(
        `INSERT INTO users (uid, telegram_id, balance_demo) VALUES ($1, $2, 1000) RETURNING *`,
        [nextUid, telegramId]
      );
      user = insertRes.rows[0];
    }

    return NextResponse.json({
      uid: user.uid,
      balance: Number(user.balance_demo) + Number(user.balance_real),
    }, {
      headers: { "Cache-Control": "no-store" }
    });

  } catch (error: any) {
    console.error("Ошибка баланса:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}