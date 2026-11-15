import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
          uid BIGINT PRIMARY KEY,
          telegram_id BIGINT UNIQUE NOT NULL,
          username VARCHAR(255),
          balance_real DECIMAL(15, 2) DEFAULT 0.00,
          balance_demo DECIMAL(15, 2) DEFAULT 1000.00,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS trades (
          id VARCHAR(50) PRIMARY KEY,
          user_uid BIGINT REFERENCES users(uid),
          symbol VARCHAR(20) NOT NULL,
          direction VARCHAR(10) NOT NULL,
          amount DECIMAL(15, 2) NOT NULL,
          entry_price DECIMAL(15, 8) NOT NULL,
          exit_price DECIMAL(15, 8),
          payout_percent DECIMAL(5, 2) NOT NULL,
          result VARCHAR(20) DEFAULT 'pending',
          is_demo BOOLEAN DEFAULT false,
          status VARCHAR(20) DEFAULT 'open',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL
      );
    `);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}