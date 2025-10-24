import { useNavigate } from 'react-router-dom'

function HelpPage() {
    const navigate = useNavigate()

    return (
        <div>
            <header className="header">
                <h1>מדריך שימוש</h1>
                <button className="close-btn" onClick={() => navigate('/')}>×</button>
            </header>
            <div className="container">
                <div className="form-container">
                    <h2 className="form-title">📖 מדריך שימוש במערכת</h2>

                    <div style={{ textAlign: 'right', lineHeight: '1.8', fontSize: '16px' }}>

                        <section style={{ marginBottom: '30px' }}>
                            <h3 style={{ color: '#3498db', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>
                                🚀 התחלה מהירה
                            </h3>
                            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', margin: '10px 0' }}>
                                <h4>הגדרה ראשונית:</h4>
                                <ol>
                                    <li>בדף הבית - לחץ על שם הגמ"ח (הכותרת הגדולה) לעריכה</li>
                                    <li>לחץ על הכותרת העליונה לעריכתה</li>
                                    <li>לחץ על הטקסט התחתון לעריכתו</li>
                                    <li>עבור להגדרות (⚙️) לשינוי ערכת נושא ומטבע</li>
                                    <li><strong>חדש!</strong> הפעל פונקציות מתקדמות (אופציונלי) - הלוואות ופרעונות מחזוריים</li>
                                </ol>
                            </div>
                        </section>

                        <section style={{ marginBottom: '30px' }}>
                            <h3 style={{ color: '#e74c3c', borderBottom: '2px solid #e74c3c', paddingBottom: '10px' }}>
                                💰 ניהול הלוואות
                            </h3>
                            <div style={{ background: '#fff5f5', padding: '15px', borderRadius: '8px', margin: '10px 0' }}>
                                <h4>רישום לווה חדש:</h4>
                                <ul>
                                    <li>לחץ על "הלוואות" בדף הבית</li>
                                    <li>לחץ על "ניהול לווים"</li>
                                    <li>מלא פרטי הלווה: שם פרטי ומשפחה (חובה), עיר, טלפון, כתובת</li>
                                    <li>לחץ "שמור לווה"</li>
                                </ul>

                                <h4>מתן הלוואה:</h4>
                                <ul>
                                    <li>לחץ על "ניהול הלוואות"</li>
                                    <li>בחר לווה מהרשימה</li>
                                    <li>מלא סכום ההלוואה (חובה), תאריכים, ערבים</li>
                                    <li>אם הופעלו פונקציות מתקדמות - הגדר הלוואה מחזורית ופרעון אוטומטי</li>
                                    <li>לחץ "שמור הלוואה"</li>
                                    <li>לחץ "📄 הפק שטר הלוואה" להדפסה או "📁 שמור PDF" (ב-Electron)</li>
                                </ul>

                                <h4>רישום פרעון:</h4>
                                <ul>
                                    <li>בחר הלוואה פעילה</li>
                                    <li>לחץ "הוסף פרעון"</li>
                                    <li>הזן סכום הפרעון</li>
                                    <li>אשר את הפעולה</li>
                                </ul>

                                <h4>פרעון מרובה:</h4>
                                <ul>
                                    <li>בחר לווה עם מספר הלוואות</li>
                                    <li>לחץ "💰 פרעון מרובה"</li>
                                    <li>הזן סכום כולל - יחולק אוטומטית בין ההלוואות</li>
                                </ul>

                                <h4>🔄 הלוואות מחזוריות:</h4>
                                <div style={{ background: '#e8f4fd', padding: '10px', borderRadius: '5px', margin: '10px 0' }}>
                                    <p><strong>מהי הלוואה מחזורית?</strong></p>
                                    <p>הלוואה שמתחדשת אוטומטית כל חודש באותו יום. מתאימה ללווים קבועים.</p>
                                    
                                    <p><strong>איך זה עובד?</strong></p>
                                    <ul>
                                        <li>סמן "הלוואה חוזרת כל חודש" בטופס ההלוואה</li>
                                        <li>בחר יום בחודש (1-31) למתן ההלוואה</li>
                                        <li>המערכת תזכיר אוטומטית כל חודש</li>
                                        <li>כל הלוואה חדשה תיווצר בנפרד עם אותם פרטים</li>
                                    </ul>
                                </div>

                                <h4>💳 פרעון אוטומטי:</h4>
                                <div style={{ background: '#e8f4fd', padding: '10px', borderRadius: '5px', margin: '10px 0' }}>
                                    <p><strong>מהו פרעון אוטומטי?</strong></p>
                                    <p>פרעון חודשי קבוע שמתבצע אוטומטית ביום מסוים בחודש.</p>
                                    
                                    <p><strong>איך זה מחושב?</strong></p>
                                    <ul>
                                        <li>סמן "פרעון חודשי אוטומטי" בטופס ההלוואה</li>
                                        <li>הזן סכום פרעון חודשי</li>
                                        <li>בחר יום בחודש (1-31) לפרעון</li>
                                        <li>המערכת תזכיר ותרשום פרעונים אוטומטית</li>
                                        <li>הפרעון יופיע ברשימת התשלומים עם הערה "פרעון אוטומטי"</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        <section style={{ marginBottom: '30px' }}>
                            <h3 style={{ color: '#27ae60', borderBottom: '2px solid #27ae60', paddingBottom: '10px' }}>
                                🏦 ניהול פקדונות
                            </h3>
                            <div style={{ background: '#f0fff4', padding: '15px', borderRadius: '8px', margin: '10px 0' }}>
                                <h4>רישום פקדון:</h4>
                                <ul>
                                    <li>לחץ על "פקדונות" בדף הבית</li>
                                    <li>מלא פרטי המפקיד: שם (חובה), סכום (חובה), תאריכים</li>
                                    <li>לחץ "הוסף פקדון"</li>
                                </ul>

                                <h4>רישום משיכה:</h4>
                                <ul>
                                    <li>לחץ "משיכה" בשורת הפקדון פעיל</li>
                                    <li>הזן סכום המשיכה</li>
                                    <li>אשר את הפעולה</li>
                                </ul>

                                <h4>עריכת פקדונות:</h4>
                                <ul>
                                    <li>לחץ "✏️ ערוך" בשורת הפקדון</li>
                                    <li>ערוך גם את סכום המשיכות אם נדרש</li>
                                    <li>לחץ "עדכן הפקדה"</li>
                                </ul>
                            </div>
                        </section>

                        <section style={{ marginBottom: '30px' }}>
                            <h3 style={{ color: '#9b59b6', borderBottom: '2px solid #9b59b6', paddingBottom: '10px' }}>
                                🎁 ניהול תרומות
                            </h3>
                            <div style={{ background: '#faf5ff', padding: '15px', borderRadius: '8px', margin: '10px 0' }}>
                                <h4>רישום תרומה:</h4>
                                <ul>
                                    <li>לחץ על "תרומות" בדף הבית</li>
                                    <li>מלא פרטי התורם: שם (חובה), סכום (חובה)</li>
                                    <li>בחר אופן תרומה: מזומן/העברה/צ'ק/אחר</li>
                                    <li>סמן אם נדרשת קבלה</li>
                                    <li>לחץ "רשום תרומה"</li>
                                </ul>

                                <h4>הדפסת קבלה:</h4>
                                <ul>
                                    <li>לחץ "📄 קבלה" בשורת התרומה</li>
                                    <li>הקבלה תודפס אוטומטית</li>
                                </ul>
                            </div>
                        </section>

                        <section style={{ marginBottom: '30px' }}>
                            <h3 style={{ color: '#8e44ad', borderBottom: '2px solid #8e44ad', paddingBottom: '10px' }}>
                                ⚙️ פונקציות מתקדמות (חדש! 🆕)
                            </h3>
                            <div style={{ background: '#f4f0ff', padding: '15px', borderRadius: '8px', margin: '10px 0' }}>
                                <h4>הפעלת פונקציות מתקדמות:</h4>
                                <ul>
                                    <li>עבור להגדרות (⚙️) → פונקציות מתקדמות</li>
                                    <li>הפעל "הלוואות מחזוריות" - למשתמשים שנותנים הלוואות קבועות</li>
                                    <li>הפעל "פרעונות מחזוריים" - למשתמשים עם פרעונות חודשיים קבועים</li>
                                    <li>הפונקציות יופיעו בטופס ההלוואה רק לאחר ההפעלה</li>
                                </ul>

                                <h4>🖨️ הדפסה משופרת:</h4>
                                <ul>
                                    <li><strong>ב-Electron:</strong> פתרון בעיית "יצוא לפני הדפסה" של Windows</li>
                                    <li><strong>שמירת PDF:</strong> כפתור "📁 שמור PDF" (זמין רק ב-Electron)</li>
                                    <li><strong>תצוגה מקדימה:</strong> בדפדפנים רגילים - חלון עם כפתורי הדפסה וסגירה</li>
                                    <li><strong>תפריט הדפסה:</strong> Ctrl+P להדפסה מהירה, Ctrl+Shift+P לשמירת PDF</li>
                                </ul>

                                <div style={{ background: '#e8f4fd', padding: '10px', borderRadius: '5px', margin: '10px 0' }}>
                                    <p><strong>💡 טיפ:</strong> הפונקציות המתקדמות כבויות כברירת מחדל כדי לשמור על ממשק נקי ופשוט. הפעל אותן רק אם אתה צריך אותן.</p>
                                </div>
                            </div>
                        </section>

                        <section style={{ marginBottom: '30px' }}>
                            <h3 style={{ color: '#f39c12', borderBottom: '2px solid #f39c12', paddingBottom: '10px' }}>
                                📊 הבנת הנתונים
                            </h3>
                            <div style={{ background: '#fffbf0', padding: '15px', borderRadius: '8px', margin: '10px 0' }}>
                                <h4>חישוב היתרה:</h4>
                                <div style={{ background: '#fff', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', fontFamily: 'monospace' }}>
                                    יתרה = תרומות + הפקדות פעילות - הלוואות שניתנו
                                </div>

                                <h4 style={{ marginTop: '15px' }}>צבעי סטטוס:</h4>
                                <ul>
                                    <li><span style={{ color: '#27ae60', fontWeight: 'bold' }}>ירוק</span> - מצב חיובי, יתרה טובה</li>
                                    <li><span style={{ color: '#e74c3c', fontWeight: 'bold' }}>אדום</span> - גרעון, יש יותר התחייבויות מכסף</li>
                                    <li><span style={{ color: '#f39c12', fontWeight: 'bold' }}>כתום</span> - הלוואות באיחור</li>
                                </ul>
                            </div>
                        </section>

                        <section style={{ marginBottom: '30px' }}>
                            <h3 style={{ color: '#34495e', borderBottom: '2px solid #34495e', paddingBottom: '10px' }}>
                                🔧 טיפים ועצות
                            </h3>
                            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', margin: '10px 0' }}>
                                <h4>ניהול יעיל:</h4>
                                <ul>
                                    <li>עדכן נתונים באופן שוטף - הזן פרעונות מיד כשמתקבלים</li>
                                    <li>בדוק התראות איחור - בדף הבית יופיעו הלוואות באיחור</li>
                                    <li>גבה נתונים בקביעות - ייצא את הנתונים מדי פעם</li>
                                    <li>השתמש בהערות - הוסף מידע חשוב בשדה ההערות</li>
                                </ul>

                                <h4>פתרון בעיות נפוצות:</h4>
                                <ul>
                                    <li><strong>הנתונים נעלמו?</strong> → ייבא מגיבוי אחרון (עבור להגדרות → "📥 ייבוא נתונים")</li>
                                    <li><strong>המערכת איטית?</strong> → סגור ופתח מחדש את התוכנה</li>
                                    <li><strong>שגיאה בהדפסה?</strong> → בדוק שהמדפסת מחוברת ופועלת</li>
                                    <li><strong>בעיה בתצוגה?</strong> → רענן את הדף (F5) או סגור ופתח מחדש</li>
                                    <li><strong>לא רואה פונקציות מתקדמות?</strong> → עבור להגדרות והפעל "פונקציות מתקדמות"</li>
                                </ul>
                            </div>
                        </section>

                        <section style={{ marginBottom: '30px' }}>
                            <h3 style={{ color: '#e67e22', borderBottom: '2px solid #e67e22', paddingBottom: '10px' }}>
                                🔒 אבטחת מידע
                            </h3>
                            <div style={{ background: '#fdf6e3', padding: '15px', borderRadius: '8px', margin: '10px 0' }}>
                                <ul>
                                    <li>הנתונים נשמרים מקומית בדפדפן</li>
                                    <li>אין שליחת מידע לאינטרנט</li>
                                    <li>גבה נתונים חשובים במקום בטוח</li>
                                    <li>השתמש במחשב מאובטח</li>
                                </ul>
                            </div>
                        </section>

                    </div>

                    <div style={{ textAlign: 'center', marginTop: '30px' }}>
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate('/')}
                            style={{ padding: '15px 30px', fontSize: '16px' }}
                        >
                            🏠 חזור לדף הבית
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default HelpPage