import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';

export const authRouter = Router();

// התחברות
authRouter.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'נדרשים שם משתמש וסיסמה' });
    }

    // חפש משתמש
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(401).json({ error: 'שם משתמש או סיסמה שגויים' });
    }

    // בדוק סיסמה
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ error: 'שם משתמש או סיסמה שגויים' });
    }

    // עדכן lastLogin
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    const token = generateToken(user.username, user.id);
    res.json({ 
      access_token: token,
      expiresIn: '24h',
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'שגיאה בהתחברות' });
  }
});

// הגדרת סיסמה חדשה
authRouter.post('/set-password', async (req, res) => {
  try {
    const { password, hint } = req.body;

    if (!password || password.length < 4) {
      return res.status(400).json({ error: 'סיסמה חייבת להיות לפחות 4 תווים' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // עדכן או צור הגדרות
    const settings = await prisma.settings.findFirst();
    
    if (settings) {
      await prisma.settings.update({
        where: { id: settings.id },
        data: { 
          appPassword: hashedPassword,
          passwordHint: hint || null
        }
      });
    } else {
      await prisma.settings.create({
        data: {
          gemachName: 'נר שרה',
          headerTitle: 'מערכת ניהול גמח',
          footerText: 'אמר רבי אבא אמר רבי שמעון בן לקיש גדול המלוה יותר מן העושה צדקה',
          contactText: 'ניתן להפצה לזיכוי הרבים',
          appPassword: hashedPassword,
          passwordHint: hint || null
        }
      });
    }

    res.json({ message: 'סיסמה הוגדרה בהצלחה' });

  } catch (error) {
    console.error('Set password error:', error);
    res.status(500).json({ error: 'שגיאה בהגדרת סיסמה' });
  }
});

// פונקציה ליצירת טוקן
function generateToken(username: string, userId: number): string {
  const secret = process.env.JWT_SECRET || 'default-secret-change-this';
  
  return jwt.sign(
    { username, sub: userId },
    secret,
    { expiresIn: '24h' }
  );
}
