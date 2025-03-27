import { createConnection } from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
const { Pool } = pg;

// Function to check if a PostgreSQL server is ready to accept connections
async function waitForPostgres(connectionString: string, maxAttempts = 10, delayMs = 1000): Promise<boolean> {
  const { hostname, port } = new URL(connectionString);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await new Promise<void>((resolve, reject) => {
        const socket = createConnection(Number(port), hostname);
        socket.on('connect', () => {
          socket.end();
          resolve();
        });
        socket.on('error', reject);
      });
      console.log('PostgreSQL server is ready to accept connections');
      return true;
    } catch (error) {
      console.log(`Waiting for PostgreSQL server (attempt ${attempt}/${maxAttempts})...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  console.error('Failed to connect to PostgreSQL server after multiple attempts');
  return false;
}

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  // Wait for PostgreSQL to be ready
  const ready = await waitForPostgres(connectionString);
  if (!ready) {
    process.exit(1);
  }
  
  // Create a connection pool
  const pool = new Pool({
    connectionString,
  });

  try {
    // Read the migration SQL file
    const migrationFile = path.join(process.cwd(), 'migrations', '0000_fat_pride.sql');
    const sql = fs.readFileSync(migrationFile, 'utf-8');
    
    // Execute the migration
    console.log('Running database migration...');
    await pool.query(sql);
    console.log('Migration completed successfully');

    // Create the session table
    console.log('Creating session table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      )
    `);
    console.log('Session table created successfully');

    // Seed an admin user
    console.log('Checking for admin user...');
    const { rows } = await pool.query('SELECT COUNT(*) as count FROM users WHERE username = $1', ['admin']);
    
    if (parseInt(rows[0].count) === 0) {
      console.log('Creating admin user...');
      
      // This is a sample password hash for "password" - in a production app, this would be generated
      const passwordHash = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8.d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592';
      
      await pool.query(
        'INSERT INTO users (username, password, full_name, is_admin) VALUES ($1, $2, $3, $4)',
        ['admin', passwordHash, 'Admin User', true]
      );
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration().catch(console.error);