import { Request, Response, NextFunction } from 'express';
import User, { UserDocument } from '../models/User';
import { JWTUtil } from '@/utils/jwt';

// Fix the interface to properly extend Request
export interface AuthRequest extends Request {
  user?: UserDocument;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;
    
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
      return;
    }
    
    const decoded = JWTUtil.verify(token);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'No user found with this token'
      });
      return;
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};