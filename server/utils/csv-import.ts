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

// Define record type for validation
interface CsvRecord {
  username?: string;
  password?: string;
  fullName?: string;
  email?: string;
  role?: string;
  [key: string]: string | undefined;
}

interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

// Validate a CSV record
function validateRecord(record: CsvRecord, index: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Required fields
  if (!record.username) {
    errors.push(`Row ${index + 1}: Missing required field 'username'`);
  } else if (record.username.length < 3) {
    errors.push(`Row ${index + 1}: Username '${record.username}' is too short (minimum 3 characters)`);
  } else if (!/^[a-zA-Z0-9_]+$/.test(record.username)) {
    errors.push(`Row ${index + 1}: Username '${record.username}' contains invalid characters (only letters, numbers, and underscore are allowed)`);
  }

  if (!record.password) {
    errors.push(`Row ${index + 1}: Missing required field 'password'`);
  } else if (record.password.length < 6) {
    errors.push(`Row ${index + 1}: Password is too short (minimum 6 characters)`);
  }

  // Optional fields with validation
  if (record.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) {
    warnings.push(`Row ${index + 1}: Invalid email format '${record.email}'`);
  }

  if (record.role && !['admin', 'teacher'].includes(record.role.toLowerCase())) {
    warnings.push(`Row ${index + 1}: Unknown role '${record.role}', assuming 'teacher'`);
  }

  return {
    success: errors.length === 0,
    errors,
    warnings
  };
}

// Convert CSV file buffer to an array of user objects with validation
export async function parseUsersCsv(buffer: Buffer): Promise<{
  users: InsertUser[],
  errors: string[],
  warnings: string[]
}> {
  return new Promise((resolve, reject) => {
    const users: InsertUser[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    let rowCount = 0;
    let validRowCount = 0;
    
    // Detect UTF-8 BOM and normalize line endings
    let data = buffer.toString('utf8');
    if (data.charCodeAt(0) === 0xFEFF) {
      data = data.slice(1); // Remove BOM if present
    }
    
    // Handle different line endings (CRLF, CR, LF)
    data = data.replace(/\r\n|\r/g, '\n');
    
    // Check for empty file
    if (data.trim() === '') {
      resolve({ users: [], errors: ['The uploaded file is empty'], warnings: [] });
      return;
    }
    
    // Create new buffer with normalized data
    const normalizedBuffer = Buffer.from(data);
    
    const parser = parse({
      delimiter: ',',
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true, // Allow inconsistent column counts
      skip_records_with_error: true, // Continue parsing if one record has an error
    });

    // Handle parsing errors for the entire file
    parser.on('error', function(err) {
      reject(new Error(`Error parsing CSV: ${err.message}`));
    });

    parser.on('readable', function() {
      let record: Record<string, unknown> | null;
      let index = rowCount;
      
      // Read record safely with proper type handling
      while ((record = parser.read()) !== null) {
        rowCount++;
        
        // Skip record if it's not an object (though this is unlikely)
        if (typeof record !== 'object' || record === null) {
          errors.push(`Row ${index + 1}: Invalid record format`);
          continue;
        }
        
        // Normalize keys (make case-insensitive)
        const normalizedRecord: CsvRecord = {};
        
        // Enhanced key mapping
        const keyMap: Record<string, string> = {
          // Username variations
          'user': 'username',
          'username': 'username',
          'user name': 'username',
          'userid': 'username',
          'user id': 'username',
          'login': 'username',
          
          // Name variations
          'name': 'fullName',
          'full name': 'fullName',
          'fullname': 'fullName',
          'displayname': 'fullName',
          'display name': 'fullName',
          'teacher name': 'fullName',
          'teachername': 'fullName',
          
          // Email variations
          'mail': 'email',
          'email': 'email',
          'e-mail': 'email',
          'emailaddress': 'email',
          'email address': 'email',
          
          // Role variations
          'admin': 'role',
          'role': 'role',
          'user role': 'role',
          'userrole': 'role',
          'user type': 'role',
          'usertype': 'role',
          'type': 'role',
          'access': 'role',
          'isadmin': 'role',
          'is admin': 'role',
          'teacher type': 'role',
          
          // Password variations
          'pwd': 'password',
          'pass': 'password',
          'password': 'password',
          'secret': 'password',
          'credentials': 'password'
        };
        
        // Process each field in the record
        Object.entries(record).forEach(([key, value]) => {
          const normalizedKey = key.toLowerCase().trim();
          const mappedKey = keyMap[normalizedKey] || normalizedKey;
          
          // Special handling for role field to normalize values
          if (mappedKey === 'role' && value !== null && value !== undefined) {
            // Convert all role variations to standard formats
            const roleValue = String(value).toLowerCase().trim();
            if (roleValue === 'yes' || roleValue === 'true' || roleValue === '1' || 
                roleValue === 'y' || roleValue === 'admin' || roleValue === 'administrator') {
              normalizedRecord.role = 'admin';
            } else {
              normalizedRecord.role = 'teacher';
            }
          } 
          // Normal field processing
          else if (value !== null && value !== undefined) {
            normalizedRecord[mappedKey] = typeof value === 'string' ? value.trim() : String(value);
          }
        });
        
        // Validation
        const validation = validateRecord(normalizedRecord, index);
        validation.errors.forEach(error => errors.push(error));
        validation.warnings.forEach(warning => warnings.push(warning));
        
        if (validation.success) {
          validRowCount++;
          const userData: InsertUser = {
            username: normalizedRecord.username!,
            password: normalizedRecord.password!, // Will be hashed later
            fullName: normalizedRecord.fullName || normalizedRecord.username || '',
            email: normalizedRecord.email || '',
            isAdmin: (normalizedRecord.role?.toLowerCase() === 'admin') || false,
          };
          
          users.push(userData);
        }
      }
    });

    parser.on('end', function() {
      if (rowCount === 0) {
        errors.push('No valid records found in the CSV file. Please check the file format.');
      } else {
        warnings.push(`Processed ${rowCount} rows, found ${validRowCount} valid user records.`);
      }
      
      resolve({ users, errors, warnings });
    });

    // Feed the parser with the normalized CSV buffer
    const readable = new Readable();
    readable.push(normalizedBuffer);
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