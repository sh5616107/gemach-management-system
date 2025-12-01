import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: number;
  username?: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = (req as any).headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'נדרשת הרשאה' });
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'default-secret-change-this';
    
    const decoded = jwt.verify(token, secret) as any;
    req.userId = decoded.sub;
    req.username = decoded.username;
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'טוקן לא תקין' });
  }
};
