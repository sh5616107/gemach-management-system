import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authMiddleware } from '../middleware/auth';

export const donationsRouter = Router();

// כל הנתיבים דורשים אימות
donationsRouter.use(authMiddleware);

// קבל את כל התרומות
donationsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const donations = await prisma.donation.findMany({
      orderBy: { donationDate: 'desc' }
    });

    res.json(donations);
  } catch (error) {
    console.error('Get donations error:', error);
    res.status(500).json({ error: 'שגיאה בטעינת תרומות' });
  }
});

// קבל תרומה ספציפית
donationsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    const donation = await prisma.donation.findUnique({
      where: { id }
    });

    if (!donation) {
      return res.status(404).json({ error: 'תרומה לא נמצאה' });
    }

    res.json(donation);
  } catch (error) {
    console.error('Get donation error:', error);
    res.status(500).json({ error: 'שגיאה בטעינת תרומה' });
  }
});

// צור תרומה חדשה
donationsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const data = req.body;

    // בדיקת שדות חובה
    if (!data.donorName || !data.donorLastName || !data.amount || !data.donationDate || !data.method || !data.phone || !data.address) {
      return res.status(400).json({ error: 'חסרים שדות חובה' });
    }

    const donation = await prisma.donation.create({
      data: {
        donorName: data.donorName,
        donorLastName: data.donorLastName,
        amount: parseFloat(data.amount),
        donationDate: new Date(data.donationDate),
        method: data.method,
        paymentDetails: data.paymentDetails,
        phone: data.phone,
        address: data.address,
        notes: data.notes,
        needsReceipt: data.needsReceipt || false
      }
    });

    res.status(201).json(donation);
  } catch (error) {
    console.error('Create donation error:', error);
    res.status(500).json({ error: 'שגיאה ביצירת תרומה' });
  }
});

// עדכן תרומה
donationsRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;

    const donation = await prisma.donation.update({
      where: { id },
      data: {
        ...data,
        amount: data.amount ? parseFloat(data.amount) : undefined,
        donationDate: data.donationDate ? new Date(data.donationDate) : undefined
      }
    });

    res.json(donation);
  } catch (error) {
    console.error('Update donation error:', error);
    res.status(500).json({ error: 'שגיאה בעדכון תרומה' });
  }
});

// מחק תרומה
donationsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    await prisma.donation.delete({ where: { id } });

    res.json({ message: 'תרומה נמחקה בהצלחה' });
  } catch (error) {
    console.error('Delete donation error:', error);
    res.status(500).json({ error: 'שגיאה במחיקת תרומה' });
  }
});
