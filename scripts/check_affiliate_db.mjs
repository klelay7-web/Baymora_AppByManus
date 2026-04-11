import { createConnection } from 'mysql2/promise';
const conn = await createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute('SELECT COUNT(*) as count FROM affiliate_programs');
console.log('affiliate_programs count:', rows[0].count);
const [fields] = await conn.execute('DESCRIBE affiliate_programs');
console.log('fields:', fields.map(f => f.Field).join(', '));
const [radarFields] = await conn.execute("SHOW COLUMNS FROM users LIKE 'radar%'");
console.log('radar fields in users:', radarFields.map(f => f.Field).join(', '));
await conn.end();
