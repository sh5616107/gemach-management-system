import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authMiddleware } from '../middleware/auth';

export const depositorsRouter = Router();

// כל הנתיבים דורשים אימות
depositorsRouter.use(authMiddleware);

// קבל את כל המפקידים
depositorsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const depositors = await prisma.depositor.findMany({
      include: {
        deposits: {
          where: { status: 'active' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(depositors);
  } catch (error) {
    console.error('Get depositors error:', error);
    res.status(500).json({ error: 'שגיאה בטעינת מפקידים' });
  }
});

// קבל מפקיד ספציפי
depositorsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    const depositor = await prisma.depositor.findUnique({
      where: { id },
      include: {
        deposits: {
          include: {
            withdrawals: true
          }
        }
      }
    });

    if (!depositor) {
      return res.status(404).json({ error: 'מפקיד לא נמצא' });
    }

    res.json(depositor);
  } catch (error) {
    console.error('Get depositor error:', error);
    res.status(500).json({ error: 'שגיאה בטעינת מפקיד' });
  }
});

// צור מפקיד חדש
depositorsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const data = req.body;

    // בדיקת שדות חובה
    if (!data.name || !data.phone) {
      return res.status(400).json({ error: 'חסרים שדות חובה' });
    }

    const depositor = await prisma.depositor.create({
      data: {
        name: data.name,
        idNumber: data.idNumber,
        phone: data.phone,
        notes: data.notes,
        bankCode: data.bankCode,
        branchNumber: data.branchNumber,
        accountNumber: data.accountNumber
      }
    });

    res.status(201).json(depositor);
  } catch (error) {
    console.error('Create depositor error:', error);
    res.status(500).json({ error: 'שגיאה ביצירת מפקיד' });
  }
});

// עדכן מפקיד
depositorsRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;

    const depositor = await prisma.depositor.update({
      where: { id },
      data
    });

    res.json(depositor);
  } catch (error) {
    console.error('Update depositor error:', error);
    res.status(500).json({ error: 'שגיאה בעדכון מפקיד' });
  }
});

// מחק מפקיד
depositorsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    // בדוק שאין פיקדונות פעילים
    const activeDeposits = await prisma.deposit.count({
      where: { depositorId: id, status: 'active' }
    });

    if (activeDeposits > 0) {
      return res.status(409).json({ 
        error: 'לא ניתן למחוק מפקיד עם פיקדונות פעילים' 
      });
    }

    await prisma.depositor.delete({ where: { id } });

    res.json({ message: 'מפקיד נמחק בהצלחה' });
  } catch (error) {
    console.error('Delete depositor error:', error);
    res.status(500).json({ error: 'שגיאה במחיקת מפקיד' });
  }
});
