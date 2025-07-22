import crypto from 'crypto';

// Encryption configuration
const ENCRYPTION_ALGORITHM = 'aes-256-ctr';
const KEY_DERIVATION_ITERATIONS = 100000;
const SALT_LENGTH = 32;
const IV_LENGTH = 16;

export interface EncryptedData {
  encryptedData: string;
  salt: string;
  iv: string;
}

export class EncryptionService {
  private static instance: EncryptionService;
  private masterKey: Buffer | null = null;

  private constructor() {}

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  // Initialize encryption with master key (should be called at startup)
  initializeMasterKey(passphrase?: string): void {
    // Use environment variable or generate a secure key
    const keySource = process.env.ZEBULON_MASTER_KEY || passphrase || this.generateSecureKey();
    
    // Derive a strong master key
    const salt = crypto.randomBytes(SALT_LENGTH);
    this.masterKey = crypto.pbkdf2Sync(keySource, salt, KEY_DERIVATION_ITERATIONS, 32, 'sha256');
    
    console.log('Zebulon encryption system initialized with master key');
  }

  private generateSecureKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private ensureMasterKey(): Buffer {
    if (!this.masterKey) {
      this.initializeMasterKey();
    }
    return this.masterKey!;
  }

  // Encrypt sensitive data
  encrypt(data: any, userKey?: string): EncryptedData {
    try {
      // Convert data to JSON string for encryption
      const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
      
      // Generate salt and IV for this encryption
      const salt = crypto.randomBytes(SALT_LENGTH);
      const iv = crypto.randomBytes(IV_LENGTH);
      
      // Derive encryption key from master key + user key + salt
      const keyMaterial = userKey ? 
        Buffer.concat([this.ensureMasterKey(), Buffer.from(userKey, 'utf8')]) : 
        this.ensureMasterKey();
      
      const encryptionKey = crypto.pbkdf2Sync(keyMaterial, salt, KEY_DERIVATION_ITERATIONS, 32, 'sha256');
      
      // Create cipher and encrypt
      const cipher = crypto.createCipher(ENCRYPTION_ALGORITHM, encryptionKey);
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return {
        encryptedData: encrypted,
        salt: salt.toString('hex'),
        iv: iv.toString('hex')
      };
    } catch (error: any) {
      throw new Error(`Encryption failed: ${error.message || 'Unknown error'}`);
    }
  }

  // Decrypt sensitive data
  decrypt(encryptedData: EncryptedData, userKey?: string): any {
    try {
      const { encryptedData: ciphertext, salt, iv } = encryptedData;
      
      // Derive the same encryption key
      const keyMaterial = userKey ? 
        Buffer.concat([this.ensureMasterKey(), Buffer.from(userKey, 'utf8')]) : 
        this.ensureMasterKey();
      
      const encryptionKey = crypto.pbkdf2Sync(
        keyMaterial, 
        Buffer.from(salt, 'hex'), 
        KEY_DERIVATION_ITERATIONS, 
        32, 
        'sha256'
      );
      
      // Create decipher and decrypt
      const decipher = crypto.createDecipher(ENCRYPTION_ALGORITHM, encryptionKey);
      
      let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (error: any) {
      throw new Error(`Decryption failed: ${error.message || 'Unknown error'}`);
    }
  }

  // Hash sensitive data (one-way, for authentication/verification)
  hash(data: string, userSalt?: string): string {
    const salt = userSalt || crypto.randomBytes(SALT_LENGTH).toString('hex');
    return crypto.pbkdf2Sync(data, salt, KEY_DERIVATION_ITERATIONS, 64, 'sha256').toString('hex');
  }

  // Verify hashed data
  verifyHash(data: string, hash: string, salt: string): boolean {
    const computedHash = crypto.pbkdf2Sync(data, salt, KEY_DERIVATION_ITERATIONS, 64, 'sha256').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computedHash, 'hex'));
  }

  // Generate secure session tokens
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Encrypt memory content specifically
  encryptMemoryContent(content: any, userId: number): EncryptedData {
    const userKey = `user_${userId}_memory_key`;
    return this.encrypt(content, userKey);
  }

  // Decrypt memory content specifically
  decryptMemoryContent(encryptedContent: EncryptedData, userId: number): any {
    const userKey = `user_${userId}_memory_key`;
    return this.decrypt(encryptedContent, userKey);
  }

  // Encrypt user configuration
  encryptUserConfig(config: any, userId: number): EncryptedData {
    const userKey = `user_${userId}_config_key`;
    return this.encrypt(config, userKey);
  }

  // Decrypt user configuration
  decryptUserConfig(encryptedConfig: EncryptedData, userId: number): any {
    const userKey = `user_${userId}_config_key`;
    return this.decrypt(encryptedConfig, userKey);
  }

  // Encrypt chat messages
  encryptChatMessage(message: string, userId: number, sessionId?: string): EncryptedData {
    const userKey = sessionId ? 
      `user_${userId}_session_${sessionId}_chat` : 
      `user_${userId}_chat_key`;
    return this.encrypt(message, userKey);
  }

  // Decrypt chat messages
  decryptChatMessage(encryptedMessage: EncryptedData, userId: number, sessionId?: string): string {
    const userKey = sessionId ? 
      `user_${userId}_session_${sessionId}_chat` : 
      `user_${userId}_chat_key`;
    return this.decrypt(encryptedMessage, userKey);
  }

  // Secure data wiping (overwrite memory)
  secureWipe(buffer: Buffer): void {
    // Overwrite with random data multiple times
    for (let i = 0; i < 3; i++) {
      crypto.randomFillSync(buffer);
    }
    // Final overwrite with zeros
    buffer.fill(0);
  }

  // Generate user-specific encryption key
  generateUserEncryptionKey(userId: number, username: string): string {
    const userData = `${userId}_${username}_${Date.now()}`;
    return crypto.createHmac('sha256', this.ensureMasterKey())
      .update(userData)
      .digest('hex');
  }
}

// Export singleton instance
export const encryptionService = EncryptionService.getInstance();

// Initialize on module load
encryptionService.initializeMasterKey();