import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { authMiddleware } from '../middleware/auth';

export const settingsRouter = Router();
settingsRouter.use(authMiddleware);

// קבל הגדרות
settingsRouter.get('/', async (req, res) => {
  try {
    let settings = await prisma.settings.findFirst();

    // אם אין הגדרות - צור ברירות מחדל
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          gemachName: 'נר שרה',
          headerTitle: 'מערכת ניהול גמח',
          footerText: 'אמר רבי אבא אמר רבי שמעון בן לקיש גדול המלוה יותר מן העושה צדקה',
          contactText: 'ניתן להפצה לזיכוי הרבים'
        }
      });
    }

    // הסר סיסמה מהתגובה
    const { appPassword, ...safeSettings } = settings;

    res.json(safeSettings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'שגיאה בטעינת הגדרות' });
  }
});

// עדכן הגדרות
settingsRouter.put('/', async (req, res) => {
  try {
    const data = req.body;

    // מצא הגדרות קיימות
    let settings = await prisma.settings.findFirst();

    if (!settings) {
      // צור חדש
      settings = await prisma.settings.create({ data });
    } else {
      // עדכן קיים
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data
      });
    }

    // הסר סיסמה מהתגובה
    const { appPassword, ...safeSettings } = settings;

    res.json(safeSettings);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'שגיאה בעדכון הגדרות' });
  }
});
