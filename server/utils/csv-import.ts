import { parse } from 'csv-parse';
import { InsertUser } from '@shared/schema';
import { randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Type for CSV user data
interface CSVUserData {
  username: string;
  password: string;
}

// Type for validation results
interface ValidationResult {
  users: CSVUserData[];
  errors: string[];
  warnings: string[];
}

// Hash passwords for new users
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

// Validate a single user from the CSV
function validateUser(data: Record<string, string>, rowIndex: number): { user?: CSVUserData; error?: string; warning?: string } {
  const requiredFields = ['username', 'password'];
  const missingFields = requiredFields.filter(field => !data[field] || data[field].trim() === '');

  if (missingFields.length > 0) {
    return {
      error: `Row ${rowIndex}: Missing required fields: ${missingFields.join(', ')}`
    };
  }

  // Validate username format
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(data.username)) {
    return {
      error: `Row ${rowIndex}: Username must be 3-20 characters and contain only letters, numbers, and underscores`
    };
  }

  // Validate password length
  if (data.password.length < 6) {
    return {
      error: `Row ${rowIndex}: Password must be at least 6 characters`
    };
  }

  // Create the user object
  const user: CSVUserData = {
    username: data.username.trim(),
    password: data.password.trim()
  };
  return { user };
}

// Parse CSV data and return validated users
export async function parseUsersCsv(buffer: Buffer): Promise<ValidationResult> {
  return new Promise((resolve, reject) => {
    const users: CSVUserData[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    // Parse CSV
    parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      skip_records_with_empty_values: true
    }, (err, records: Record<string, string>[]) => {
      if (err) {
        return reject(new Error(`CSV parsing error: ${err.message}`));
      }

      // CSV file is empty
      if (records.length === 0) {
        errors.push('CSV file is empty or does not contain valid data');
        return resolve({ users, errors, warnings });
      }

      // Check if the CSV has the required columns
      const firstRecord = records[0];
      const requiredColumns = ['username', 'password'];
      const missingColumns = requiredColumns.filter(col => !Object.keys(firstRecord).includes(col));

      if (missingColumns.length > 0) {
        errors.push(`CSV is missing required columns: ${missingColumns.join(', ')}`);
        return resolve({ users, errors, warnings });
      }

      // Process each record
      records.forEach((record, index) => {
        const rowNumber = index + 2; // +2 because index is 0-based and we have a header row
        const validation = validateUser(record, rowNumber);

        if (validation.error) {
          errors.push(validation.error);
        } else if (validation.user) {
          users.push(validation.user);
          if (validation.warning) {
            warnings.push(validation.warning);
          }
        }
      });

      resolve({ users, errors, warnings });
    });
  });
}

// Process validated users (hash passwords, etc.)
export async function processUserImport(users: CSVUserData[]): Promise<InsertUser[]> {
  const processedUsers: InsertUser[] = [];

  for (const user of users) {
    const hashedPassword = await hashPassword(user.password);

    // Create the user object for database insertion with default values for required fields
    const insertUser: InsertUser = {
      username: user.username,
      password: hashedPassword,
      fullName: user.username, // Use username as fullName by default
      isAdmin: false // Default to regular user (teacher)
    };

    processedUsers.push(insertUser);
  }

  return processedUsers;
}