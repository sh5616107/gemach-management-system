import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';

export const authRouter = Router();

// התחברות
authRouter.post('/login', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'נדרשת סיסמה' });
    }

    // קבל הגדרות
    const settings = await prisma.settings.findFirst();

    // אם אין סיסמה מוגדרת - אפשר כניסה
    if (!settings?.appPassword) {
      const token = generateToken('admin');
      return res.json({ 
        access_token: token,
        expiresIn: '24h',
        message: 'התחברות ללא סיסמה'
      });
    }

    // בדוק סיסמה
    const isValid = await bcrypt.compare(password, settings.appPassword);

    if (!isValid) {
      return res.status(401).json({ error: 'סיסמה שגויה' });
    }

    const token = generateToken('admin');
    res.json({ 
      access_token: token,
      expiresIn: '24h'
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
function generateToken(username: string): string {
  const secret = process.env.JWT_SECRET || 'default-secret-change-this';
  
  return jwt.sign(
    { username, sub: 1 },
    secret,
    { expiresIn: '24h' }
  );
}
