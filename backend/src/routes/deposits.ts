import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authMiddleware } from '../middleware/auth';

export const depositsRouter = Router();

// כל הנתיבים דורשים אימות
depositsRouter.use(authMiddleware);

// קבל את כל הפיקדונות
depositsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    
    const deposits = await prisma.deposit.findMany({
      where: status ? { status: status as string } : undefined,
      include: {
        depositor: true,
        withdrawals: true
      },
      orderBy: { depositDate: 'desc' }
    });

    res.json(deposits);
  } catch (error) {
    console.error('Get deposits error:', error);
    res.status(500).json({ error: 'שגיאה בטעינת פיקדונות' });
  }
});

// קבל פיקדון ספציפי
depositsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    const deposit = await prisma.deposit.findUnique({
      where: { id },
      include: {
        depositor: true,
        withdrawals: true
      }
    });

    if (!deposit) {
      return res.status(404).json({ error: 'פיקדון לא נמצא' });
    }

    res.json(deposit);
  } catch (error) {
    console.error('Get deposit error:', error);
    res.status(500).json({ error: 'שגיאה בטעינת פיקדון' });
  }
});

// צור פיקדון חדש
depositsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const data = req.body;

    // בדיקת שדות חובה
    if (!data.depositorId || !data.amount || !data.depositDate || !data.depositPeriod) {
      return res.status(400).json({ error: 'חסרים שדות חובה' });
    }

    const deposit = await prisma.deposit.create({
      data: {
        depositorId: data.depositorId,
        amount: parseFloat(data.amount),
        depositDate: new Date(data.depositDate),
        depositPeriod: parseInt(data.depositPeriod),
        reminderDays: data.reminderDays ? parseInt(data.reminderDays) : null,
        notes: data.notes,
        depositPaymentMethod: data.depositPaymentMethod,
        depositPaymentDetails: data.depositPaymentDetails,
        isRecurring: data.isRecurring || false,
        recurringDay: data.recurringDay,
        recurringMonths: data.recurringMonths,
        recurringEndDate: data.recurringEndDate ? new Date(data.recurringEndDate) : null
      },
      include: {
        depositor: true
      }
    });

    res.status(201).json(deposit);
  } catch (error) {
    console.error('Create deposit error:', error);
    res.status(500).json({ error: 'שגיאה ביצירת פיקדון' });
  }
});

// עדכן פיקדון
depositsRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;

    const deposit = await prisma.deposit.update({
      where: { id },
      data: {
        ...data,
        amount: data.amount ? parseFloat(data.amount) : undefined,
        depositDate: data.depositDate ? new Date(data.depositDate) : undefined,
        depositPeriod: data.depositPeriod ? parseInt(data.depositPeriod) : undefined,
        recurringEndDate: data.recurringEndDate ? new Date(data.recurringEndDate) : undefined
      },
      include: {
        depositor: true,
        withdrawals: true
      }
    });

    res.json(deposit);
  } catch (error) {
    console.error('Update deposit error:', error);
    res.status(500).json({ error: 'שגיאה בעדכון פיקדון' });
  }
});

// מחק פיקדון
depositsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    // מחק קודם את המשיכות
    await prisma.withdrawal.deleteMany({
      where: { depositId: id }
    });

    // מחק את הפיקדון
    await prisma.deposit.delete({ where: { id } });

    res.json({ message: 'פיקדון נמחק בהצלחה' });
  } catch (error) {
    console.error('Delete deposit error:', error);
    res.status(500).json({ error: 'שגיאה במחיקת פיקדון' });
  }
});

// צור משיכה
depositsRouter.post('/:id/withdrawals', async (req: Request, res: Response) => {
  try {
    const depositId = parseInt(req.params.id);
    const data = req.body;

    // בדוק שהפיקדון קיים
    const deposit = await prisma.deposit.findUnique({
      where: { id: depositId }
    });

    if (!deposit) {
      return res.status(404).json({ error: 'פיקדון לא נמצא' });
    }

    const withdrawal = await prisma.withdrawal.create({
      data: {
        depositId,
        amount: parseFloat(data.amount),
        date: new Date(data.date),
        paymentMethod: data.paymentMethod,
        paymentDetails: data.paymentDetails,
        paymentDetailsComplete: data.paymentDetailsComplete || false,
        notes: data.notes
      }
    });

    res.status(201).json(withdrawal);
  } catch (error) {
    console.error('Create withdrawal error:', error);
    res.status(500).json({ error: 'שגיאה ביצירת משיכה' });
  }
});
