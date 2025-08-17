import jwt from 'jsonwebtoken';

interface JWTPayload {
  id: string;
}

// Define valid expiration values
type ValidExpiresIn = '1h' | '24h' | '7d' | '30d' | '1y' | number;

export class JWTUtil {
  private static getExpiresIn(): ValidExpiresIn {
    const envExpire = process.env.JWT_EXPIRE;
    
    // Map common values to ensure type safety
    switch (envExpire) {
      case '1h':
      case '24h':
      case '7d':
      case '30d':
      case '1y':
        return envExpire;
      default:
        return '30d'; // Default fallback
    }
  }

  static sign(payload: JWTPayload): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    const expiresIn = this.getExpiresIn();
    
    return jwt.sign(payload, secret, { expiresIn });
  }

  static verify(token: string): JWTPayload {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    const decoded = jwt.verify(token, secret) as any;
    return { id: decoded.id };
  }
}