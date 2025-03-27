import pg from 'pg';
import { scrypt } from 'crypto';
import { promisify } from 'util';

const { Pool } = pg;
const scryptAsync = promisify(scrypt);

// Helper function to hash a password
async function hashPassword(password: string) {
  const salt = 'schoolplanner'; // Using a fixed salt for reproducibility in this demo
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function setup() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  const pool = new Pool({
    connectionString,
  });

  try {
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
      
      // Hash the password
      const hashedPassword = await hashPassword('password');
      
      await pool.query(
        'INSERT INTO users (username, password, full_name, is_admin) VALUES ($1, $2, $3, $4)',
        ['admin', hashedPassword, 'Admin User', true]
      );
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }

    // Seed a teacher user if doesn't exist
    const teacherCheck = await pool.query('SELECT COUNT(*) as count FROM users WHERE username = $1', ['teacher']);
    
    if (parseInt(teacherCheck.rows[0].count) === 0) {
      console.log('Creating teacher user...');
      
      // Hash the password
      const hashedPassword = await hashPassword('password');
      
      await pool.query(
        'INSERT INTO users (username, password, full_name, is_admin) VALUES ($1, $2, $3, $4)',
        ['teacher', hashedPassword, 'Teacher User', false]
      );
      console.log('Teacher user created successfully');
    } else {
      console.log('Teacher user already exists');
    }

    // Seed some grades if they don't exist
    console.log('Creating sample grades...');
    const grades = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'];
    
    for (const grade of grades) {
      await pool.query(
        'INSERT INTO grades (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
        [grade]
      );
    }
    console.log('Sample grades created successfully');

    // Seed some subjects if they don't exist
    console.log('Creating sample subjects...');
    const subjects = ['Mathematics', 'Science', 'English', 'History', 'Art', 'Physical Education'];
    
    for (const subject of subjects) {
      await pool.query(
        'INSERT INTO subjects (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
        [subject]
      );
    }
    console.log('Sample subjects created successfully');

    // Create a sample planning week
    console.log('Creating sample planning week...');
    const currentDate = new Date();
    const startDate = new Date(currentDate);
    startDate.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Monday
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 4); // Friday
    
    const weekNumber = Math.ceil((startDate.getDate() - 1 + new Date(startDate.getFullYear(), startDate.getMonth(), 0).getDay()) / 7);
    
    await pool.query(`
      INSERT INTO planning_weeks (week_number, year, start_date, end_date, is_active)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT DO NOTHING
    `, [
      weekNumber,
      startDate.getFullYear(),
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      true
    ]);
    console.log('Sample planning week created successfully');
    
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setup().catch(console.error);