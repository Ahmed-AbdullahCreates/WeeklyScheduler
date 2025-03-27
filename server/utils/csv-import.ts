import { parse } from 'csv-parse';
import { Readable } from 'stream';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { InsertUser } from '@shared/schema';

const scryptAsync = promisify(scrypt);

// Hash password for secure storage
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

// Convert CSV file buffer to an array of user objects
export async function parseUsersCsv(buffer: Buffer): Promise<InsertUser[]> {
  return new Promise((resolve, reject) => {
    const results: InsertUser[] = [];
    const parser = parse({
      delimiter: ',',
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    parser.on('readable', function() {
      let record;
      while ((record = parser.read()) !== null) {
        // Validate required fields
        if (!record.username || !record.password) {
          continue; // Skip records without required fields
        }

        const userData: InsertUser = {
          username: record.username,
          password: record.password, // Will be hashed later
          fullName: record.fullName || record.username,
          email: record.email || '',
          isAdmin: record.role?.toLowerCase() === 'admin',
        };
        
        results.push(userData);
      }
    });

    parser.on('error', function(err) {
      reject(new Error(`Error parsing CSV: ${err.message}`));
    });

    parser.on('end', function() {
      resolve(results);
    });

    // Feed the parser with the CSV buffer
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(parser);
  });
}

// Process and hash passwords for user records
export async function processUserImport(users: InsertUser[]): Promise<InsertUser[]> {
  return Promise.all(
    users.map(async (user) => ({
      ...user,
      password: await hashPassword(user.password),
    }))
  );
}