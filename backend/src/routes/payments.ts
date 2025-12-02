import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authMiddleware } from '../middleware/auth';

export const paymentsRouter = Router();

paymentsRouter.use(authMiddleware);

// קבל תשלומים לפי הלוואה
paymentsRouter.get('/loan/:loanId', async (req: Request, res: Response) => {
  try {
    const loanId = parseInt(req.params.loanId);
    
    const payments = await prisma.payment.findMany({
      where: { loanId },
      orderBy: { date: 'desc' }
    });

    res.json(payments);
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'שגיאה בטעינת תשלומים' });
  }
});

// צור תשלום
paymentsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const data = req.body;

    if (!data.loanId || !data.amount || !data.date || !data.type) {
      return res.status(400).json({ error: 'חסרים שדות חובה' });
    }

    const payment = await prisma.payment.create({
      data: {
        loanId: data.loanId,
        amount: parseFloat(data.amount),
        date: new Date(data.date),
        type: data.type,
        paymentMethod: data.paymentMethod,
        paymentDetails: data.paymentDetails,
        paymentDetailsComplete: data.paymentDetailsComplete || false,
        notes: data.notes,
        paidBy: data.paidBy,
        guarantorId: data.guarantorId,
        guarantorName: data.guarantorName
      }
    });

    res.status(201).json(payment);
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'שגיאה ביצירת תשלום' });
  }
});

// עדכן תשלום
paymentsRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        ...data,
        amount: data.amount ? parseFloat(data.amount) : undefined,
        date: data.date ? new Date(data.date) : undefined
      }
    });

    res.json(payment);
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ error: 'שגיאה בעדכון תשלום' });
  }
});

// מחק תשלום
paymentsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.payment.delete({ where: { id } });
    res.json({ message: 'תשלום נמחק בהצלחה' });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({ error: 'שגיאה במחיקת תשלום' });
  }
});
