import { drizzle } from 'drizzle-orm/mysql2';
import { eq, desc } from 'drizzle-orm';
import mysql from 'mysql2/promise';
import * as schema from '../drizzle/schema';

async function run() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(conn);
  try {
    const offers = await db.select().from(schema.discountOffers)
      .where(eq(schema.discountOffers.status, 'published'))
      .orderBy(desc(schema.discountOffers.isFeatured))
      .limit(5);
    console.log('Drizzle OK:', offers.length, 'offers');
    console.log('First:', offers[0]?.title);
  } catch(e: any) {
    console.error('Drizzle error:', e.message);
    console.error('Cause:', e.cause?.message);
    console.error('Full:', e);
  }
  await conn.end();
}

run().catch(console.error);
