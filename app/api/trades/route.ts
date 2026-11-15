import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { symbol, direction, amount, telegramId } = body;

    // 1. Ищем или создаем пользователя
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

    // 2. Проверяем баланс
    const totalBalance = Number(user.balance_demo) + Number(user.balance_real);
    if (totalBalance < amount) {
      return NextResponse.json({ error: "Недостаточно средств" }, { status: 400 });
    }

    // 3. Списываем средства
    let demoStake = Math.min(Number(user.balance_demo), amount);
    const newDemo = Number(user.balance_demo) - demoStake;

    await query("UPDATE users SET balance_demo = $1 WHERE uid = $2", [newDemo, user.uid]);

    // 4. Получаем цену
    const priceRes = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
    const priceData = await priceRes.json();
    const entryPrice = Number(priceData.price);

    // 5. Создаем сделку
    const tradeId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60000);

    await query(
      `INSERT INTO trades (id, user_uid, symbol, direction, amount, entry_price, payout_percent, status, expires_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [tradeId, user.uid, symbol, direction, amount, entryPrice, 82, "open", expiresAt]
    );

    return NextResponse.json({ 
      success: true, 
      tradeId, 
      balance: newDemo + Number(user.balance_real) 
    });

  } catch (error: any) {
    console.error("ПОЛНАЯ ОШИБКА:", error);
    // Возвращаем точный текст ошибки, чтобы увидеть её в браузере
    return NextResponse.json({ error: error.message || "Ошибка сервера" }, { status: 500 });
  }
}