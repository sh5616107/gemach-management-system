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

                    <div style={{ background: '#e8f5e8', padding: '15px', borderRadius: '8px', margin: '20px 0', textAlign: 'center', border: '2px solid #27ae60' }}>
                        <h3 style={{ color: '#27ae60', margin: '0 0 10px 0' }}>🆕 גרסה 2.2 - מה חדש?</h3>
                        <div style={{ textAlign: 'right', fontSize: '14px' }}>
                            <ul style={{ margin: '10px 0', paddingRight: '20px' }}>
                                <li><strong>הלוואות עתידיות</strong> - תכנון הלוואות מראש עם סימון ויזואלי</li>
                                <li><strong>ולידציה למספר זהות</strong> - בדיקת תקינות מספר זהות ישראלי</li>
                                <li><strong>הגדרות גמישות</strong> - מספר זהות חובה או אופציונלי</li>
                                <li><strong>דוח לווה משופר</strong> - תצוגה מפורטת יותר של פעילות הלווה</li>
                                <li><strong>פרעון אוטומטי מתקדם</strong> - תאריך התחלה גמיש ותדירות מותאמת</li>
                                <li><strong>תיקוני באגים רבים</strong> - שיפור יציבות ותקינות המערכת</li>
                            </ul>
                        </div>
                    </div>

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
                                    <li>מלא פרטי הלווה: שם פרטי ומשפחה (חובה)</li>
                                    <li><strong>🆕 מספר זהות:</strong> תלוי בהגדרות (חובה/אופציונלי)
                                        <ul style={{ marginTop: '5px' }}>
                                            <li>המערכת בודקת תקינות מספר זהות ישראלי</li>
                                            <li>מציגה הודעה אם המספר לא תקין</li>
                                            <li>ניתן להגדיר בהגדרות אם זה שדה חובה</li>
                                        </ul>
                                    </li>
                                    <li>עיר, טלפון, כתובת, מייל (אופציונלי)</li>
                                    <li>לחץ "שמור לווה"</li>
                                </ul>

                                <h4>מתן הלוואה:</h4>
                                <ul>
                                    <li>לחץ על "ניהול הלוואות"</li>
                                    <li>בחר לווה מהרשימה</li>
                                    <li>מלא סכום ההלוואה (חובה), תאריכים, ערבים</li>
                                    <li><strong>🆕 הלוואות עתידיות:</strong> ניתן להגדיר הלוואה לתאריך עתידי
                                        <ul style={{ marginTop: '5px' }}>
                                            <li>המערכת תציג סימון מיוחד להלוואות עתידיות</li>
                                            <li>תוצג הודעה כמה ימים נותרו עד ההלוואה</li>
                                            <li>ההלוואה תופיע ברשימה עם אייקון 🕐</li>
                                        </ul>
                                    </li>
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

                                <h4>🆕 דוח לווה מפורט:</h4>
                                <div style={{ background: '#e8f4fd', padding: '10px', borderRadius: '5px', margin: '10px 0' }}>
                                    <p><strong>איך לגשת לדוח:</strong></p>
                                    <ul>
                                        <li>בחר לווה בכרטיס ההלוואות</li>
                                        <li>לחץ על "📊 דוח" בכרטיס הלווה</li>
                                    </ul>

                                    <p><strong>מה כולל הדוח:</strong></p>
                                    <ul>
                                        <li>פרטי הלווה המלאים (כולל מספר זהות אם קיים)</li>
                                        <li>סיכום כל ההלוואות (פעילות וסגורות)</li>
                                        <li>היסטוריית פרעונות מפורטת לכל הלוואה</li>
                                        <li>חישוב יתרות מדויק ועדכני</li>
                                        <li>סטטיסטיקות כלליות של הלווה</li>
                                        <li>תצוגה ברורה ומסודרת להדפסה</li>
                                    </ul>

                                    <p><strong>אפשרויות הדפסה:</strong></p>
                                    <ul>
                                        <li>הדפסה רגילה - Ctrl+P</li>
                                        <li>שמירת PDF - זמין ב-Electron</li>
                                        <li>תצוגה מקדימה בדפדפנים רגילים</li>
                                    </ul>
                                </div>

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
                                    <p>פרעון קבוע שמתבצע אוטומטית לפי לוח זמנים שהגדרתם.</p>

                                    <p><strong>🆕 הגדרות מתקדמות:</strong></p>
                                    <ul>
                                        <li>סמן "פרעון חודשי אוטומטי" בטופס ההלוואה</li>
                                        <li>הזן סכום פרעון</li>
                                        <li>בחר יום בחודש (1-31) לפרעון</li>
                                        <li><strong>🆕 תאריך תחילת פרעון:</strong> קבע מתי יתחיל הפרעון הראשון
                                            <ul style={{ marginTop: '5px' }}>
                                                <li>יכול להיות מיד או בעוד מספר חודשים</li>
                                                <li>דוגמה: הלוואה היום, פרעון מתחיל בעוד 3 חודשים</li>
                                            </ul>
                                        </li>
                                        <li><strong>🆕 תדירות פרעון:</strong> כמה פעמים בשנה
                                            <ul style={{ marginTop: '5px' }}>
                                                <li>כל חודש (ברירת מחדל)</li>
                                                <li>כל חודשיים</li>
                                                <li>כל 3 חודשים (רבעוני)</li>
                                                <li>כל 6 חודשים (חצי שנתי)</li>
                                            </ul>
                                        </li>
                                        <li>המערכת תזכיר ותרשום פרעונים אוטומטית</li>
                                        <li>הפרעון יופיע ברשימת התשלומים עם הערה "פרעון אוטומטי"</li>
                                    </ul>

                                    <p><strong>💡 דוגמאות שימוש:</strong></p>
                                    <ul>
                                        <li><strong>לווה עם חופשה ללא תשלום:</strong> הלוואה היום, פרעון מתחיל בעוד 3 חודשים, כל חודש</li>
                                        <li><strong>לווה עם הכנסה דו-חודשית:</strong> הלוואה היום, פרעון מתחיל בחודש הבא, כל חודשיים</li>
                                        <li><strong>לווה עם בונוס רבעוני:</strong> הלוואה היום, פרעון מתחיל בחודש הבא, כל 3 חודשים</li>
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
                                    <li><strong>🆕 הגדרת מספר זהות:</strong> קבע אם מספר זהות חובה או אופציונלי</li>
                                    <li>הפונקציות יופיעו בטופס ההלוואה רק לאחר ההפעלה</li>
                                </ul>

                                <h4>🆕 הגדרות מספר זהות:</h4>
                                <div style={{ background: '#e8f4fd', padding: '10px', borderRadius: '5px', margin: '10px 0' }}>
                                    <p><strong>מספר זהות חובה:</strong></p>
                                    <ul>
                                        <li><strong>מופעל:</strong> חובה למלא מספר זהות תקין לכל לווה</li>
                                        <li><strong>כבוי:</strong> מספר זהות אופציונלי (ברירת מחדל)</li>
                                        <li>המערכת תמיד בודקת תקינות אם מוזן מספר זהות</li>
                                        <li>תמיכה במספרי זהות ישראליים (9 ספרות עם ספרת ביקורת)</li>
                                        <li>אפשרות להזין עם או בלי מקפים ורווחים</li>
                                    </ul>
                                </div>

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
                                    <li><strong>🆕 מספר זהות לא מתקבל?</strong> → בדוק שהמספר תקין (9 ספרות עם ספרת ביקורת נכונה)</li>
                                    <li><strong>🆕 לא יכול להוסיף הלוואה?</strong> → וודא שבחרת לווה ומילאת סכום</li>
                                    <li><strong>🆕 הלוואה עתידית לא מופיעה?</strong> → היא תופיע עם סימון מיוחד (🕐) ברשימת ההלוואות</li>
                                    <li><strong>🆕 איך לראות דוח מפורט של לווה?</strong> → לחץ על "📊 דוח" בכרטיס הלווה</li>
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