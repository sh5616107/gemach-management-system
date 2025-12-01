# פריסה ללא GitHub - Deploy Without GitHub

## 🎯 אם אתה לא רוצה שהקוד יהיה ב-GitHub

יש לך 3 אפשרויות:

---

## 🔒 אופציה 1: GitHub Private (מומלץ)

**הקוד נשאר אצלך, אבל משתמש ב-GitHub לפריסה**

### יתרונות:
- ✅ הקוד פרטי לחלוטין
- ✅ פריסה אוטומטית
- ✅ גיבוי בענן
- ✅ עובד עם Railway/Vercel

### איך:
1. צור repository **Private** ב-GitHub
2. push את הקוד
3. רק אתה רואה את הקוד
4. Railway/Vercel מקבלים הרשאה ממך

---

## 📦 אופציה 2: Render.com (ללא GitHub)

**העלאה ידנית של קוד**

### שלב 1: הכנת הקוד

```bash
# ארוז את תיקיית backend
cd backend
npm install
npm run build

# צור קובץ zip
# Windows:
Compress-Archive -Path * -DestinationPath backend.zip
```

### שלב 2: Render.com

1. **היכנס ל:** https://render.com
2. **Sign up** (עם Email, לא GitHub)
3. **New → Web Service**
4. **בחר:** "Deploy an existing image from a registry" → Skip
5. **או:** "Public Git repository" → הזן URL ריק
6. **למעשה:** Render דורש Git...

❌ **בעיה:** Render גם דורש Git

---

## 🖥️ אופציה 3: VPS משלך (שליטה מלאה)

**שרת וירטואלי משלך - הכי פרטי**

### ספקים זולים:
- **Contabo:** €4/חודש (~₪15)
- **Hetzner:** €4/חודש (~₪15)
- **DigitalOcean:** $6/חודש (~₪22)
- **Linode:** $5/חודש (~₪18)

### שלב 1: רכישת VPS

1. **בחר ספק** (למשל Contabo)
2. **רכוש VPS:**
   - OS: Ubuntu 22.04
   - RAM: 2GB מספיק
   - Storage: 20GB מספיק
3. **תקבל:**
   - IP Address
   - Username: root
   - Password

### שלב 2: התחברות לשרת

```bash
# Windows - השתמש ב-PuTTY או PowerShell
ssh root@YOUR_IP_ADDRESS
# הזן סיסמה
```

### שלב 3: התקנת Node.js

```bash
# עדכון מערכת
apt update && apt upgrade -y

# התקנת Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# בדיקה
node --version
npm --version
```

### שלב 4: התקנת PostgreSQL

```bash
# התקנה
apt install -y postgresql postgresql-contrib

# הפעלה
systemctl start postgresql
systemctl enable postgresql

# יצירת database
sudo -u postgres psql
```

בתוך PostgreSQL:
```sql
CREATE DATABASE gemach;
CREATE USER gemach_user WITH PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE gemach TO gemach_user;
\q
```

### שלב 5: העלאת הקוד

**מהמחשב שלך:**

```bash
# ארוז את backend
cd backend
tar -czf backend.tar.gz *

# העלה לשרת (Windows - השתמש ב-WinSCP או:)
scp backend.tar.gz root@YOUR_IP:/root/
```

**בשרת:**

```bash
# צור תיקייה
mkdir -p /var/www/gemach-backend
cd /var/www/gemach-backend

# חלץ
tar -xzf ~/backend.tar.gz

# התקן תלויות
npm install

# צור .env
nano .env
```

הדבק:
```bash
NODE_ENV=production
DATABASE_URL="postgresql://gemach_user:your_strong_password@localhost:5432/gemach"
JWT_SECRET="your-super-secret-key"
PORT=3000
FRONTEND_URL="http://YOUR_IP:5173"
```

שמור: `Ctrl+X`, `Y`, `Enter`

### שלב 6: הרצת Migrations

```bash
npm run prisma:migrate:prod
```

### שלב 7: הרצת השרת

```bash
# בדיקה
npm run start:prod

# אם עובד, עצור (Ctrl+C) והתקן PM2
npm install -g pm2

# הרץ עם PM2 (ירוץ תמיד)
pm2 start npm --name "gemach-backend" -- run start:prod
pm2 save
pm2 startup
```

### שלב 8: Nginx (Reverse Proxy)

```bash
# התקנה
apt install -y nginx

# הגדרה
nano /etc/nginx/sites-available/gemach
```

הדבק:
```nginx
server {
    listen 80;
    server_name YOUR_IP;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

שמור והפעל:
```bash
ln -s /etc/nginx/sites-available/gemach /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### שלב 9: SSL (HTTPS) - אופציונלי

```bash
# התקן Certbot
apt install -y certbot python3-certbot-nginx

# קבל תעודה (צריך domain name)
certbot --nginx -d yourdomain.com
```

### שלב 10: Frontend

**אופציה 1: על אותו שרת**

```bash
# בנה את Frontend במחשב שלך
npm run build

# העלה את dist/ לשרת
scp -r dist root@YOUR_IP:/var/www/gemach-frontend

# הגדר Nginx
nano /etc/nginx/sites-available/gemach
```

הוסף:
```nginx
location / {
    root /var/www/gemach-frontend;
    try_files $uri $uri/ /index.html;
}
```

**אופציה 2: Vercel (רק Frontend)**

Frontend יכול להיות ב-Vercel (פומבי), Backend על השרת שלך (פרטי)

---

## 🔐 אופציה 4: Docker + Private Registry

**אם אתה מכיר Docker**

### שלב 1: צור Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

### שלב 2: בנה Image

```bash
cd backend
docker build -t gemach-backend:latest .
```

### שלב 3: שמור Image

```bash
# שמור לקובץ
docker save gemach-backend:latest > gemach-backend.tar

# העלה לשרת
scp gemach-backend.tar root@YOUR_IP:/root/
```

### שלב 4: טען בשרת

```bash
# בשרת
docker load < gemach-backend.tar

# הרץ
docker run -d \
  --name gemach-backend \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  --restart unless-stopped \
  gemach-backend:latest
```

---

## 📊 השוואת אפשרויות

| אופציה | פרטיות | קלות | עלות | עדכונים |
|--------|---------|------|------|---------|
| GitHub Private | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | חינם | אוטומטי |
| VPS משלך | ⭐⭐⭐⭐⭐ | ⭐⭐ | ₪15-50/חודש | ידני |
| Docker | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ₪15-50/חודש | ידני |

---

## 💡 ההמלצה שלי

### אם אתה מפתח:
**→ GitHub Private + Railway/Vercel**
- הכי פשוט
- הכי מהיר
- חינם
- הקוד פרטי לחלוטין

### אם אתה רוצה שליטה מלאה:
**→ VPS (Contabo/Hetzner)**
- הכל אצלך
- אף אחד לא רואה כלום
- זול
- צריך ידע טכני

### אם אתה רוצה הכי פרטי:
**→ שרת פיזי בבית + Cloudflare Tunnel**
- הכל על המחשב שלך
- חינם לחלוטין
- פרטיות מקסימלית

---

## 🤔 מה לבחור?

**שאל את עצמך:**

1. **יש לי ידע טכני?**
   - כן → VPS
   - לא → GitHub Private

2. **כמה זמן יש לי?**
   - הרבה → VPS
   - מעט → GitHub Private

3. **כמה כסף אני מוכן להשקיע?**
   - ₪0 → GitHub Private + Railway
   - ₪15-50/חודש → VPS

4. **כמה פרטיות אני צריך?**
   - רגיל → GitHub Private
   - מקסימלי → VPS משלך

---

רוצה שאעזור לך עם אחת מהאפשרויות?
