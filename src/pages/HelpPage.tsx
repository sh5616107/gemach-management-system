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
                        <h3 style={{ color: '#27ae60', margin: '0 0 10px 0' }}>🆕 גרסה 2.9.5 - מה חדש?</h3>
                        <div style={{ textAlign: 'right', fontSize: '14px' }}>
                            <ul style={{ margin: '10px 0', paddingRight: '20px' }}>
                                <li><strong>תיקון כפתורים</strong> - הסרת אפקטים מוגזמים בלחיצה</li>
                                <li><strong>תיקון גלילה</strong> - גלילה מהירה ורספונסיבית</li>
                                <li><strong>תיקון רשימות נפתחות</strong> - הסרת רטט ואנימציות מיותרות</li>
                                <li><strong>תיקון בחירת סניף</strong> - הסניף נשאר בשורה</li>
                                <li><strong>תיקון ניקוי טופס</strong> - הלוואה חדשה מתחילה עם שדות ריקים</li>
                                <li><strong>עדכון אייקון</strong> - אייקון חדש ומעודכן</li>
                            </ul>
                            <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(255,255,255,0.5)', borderRadius: '5px' }}>
                                <strong>גרסאות קודמות כללו:</strong>
                                <ul style={{ margin: '5px 0', paddingRight: '20px', fontSize: '13px' }}>
                                    <li>שיפורים בעיצוב וטבלאות (2.9.4)</li>
                                    <li>ניהול ערבים ורשימה שחורה (2.9.3)</li>
                                    <li>טעינה מהירה ללא הבהובים (2.9.3)</li>
                                </ul>
                            </div>
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
                                    <li>עבור להגדרות (⚙️) לשינוי ערכת נושא, מטבע ובחירת סניף בנק</li>
                                    <li>הפעל פונקציות מתקדמות (אופציונלי) - הלוואות ופרעונות מחזוריים</li>
                                    <li><strong>חדש!</strong> הגדר ערבים בכלים מנהליים לשימוש מהיר</li>
                                </ol>
                            </div>
                        </section>

                        <section style={{ marginBottom: '30px' }}>
                            <h3 style={{ color: '#e67e22', borderBottom: '2px solid #e67e22', paddingBottom: '10px' }}>
                                🛠️ כלים מנהליים (חדש! 🆕)
                            </h3>
                            <div style={{ background: '#fef9e7', padding: '15px', borderRadius: '8px', margin: '10px 0' }}>
                                <h4>ניהול ערבים:</h4>
                                <ul>
                                    <li>לחץ על "כלים מנהליים" בדף הבית</li>
                                    <li>בחר "ניהול ערבים"</li>
                                    <li>הוסף ערבים חדשים עם פרטים מלאים</li>
                                    <li>ערוך או מחק ערבים קיימים</li>
                                    <li>השתמש ברשימה המוכנה בעת יצירת הלוואות</li>
                                </ul>

                                <h4>רשימה שחורה:</h4>
                                <ul>
                                    <li>נהל רשימת לווים חסומים</li>
                                    <li>הוסף לווים לרשימה השחורה עם סיבת החסימה</li>
                                    <li>המערכת תזהיר בעת ניסיון מתן הלוואה ללווה חסום</li>
                                    <li>הסר לווים מהרשימה השחורה בעת הצורך</li>
                                </ul>

                                <h4>מכתבי התראה:</h4>
                                <ul>
                                    <li>צור מכתבי התראה אוטומטיים ללווים</li>
                                    <li>בחר תבנית מכתב מתוך מספר אפשרויות</li>
                                    <li>המכתב יכלול את פרטי הלווה וההלוואה אוטומטית</li>
                                    <li>הדפס או שמור כ-PDF</li>
                                </ul>
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
                                    <li><strong>מספר זהות:</strong> תלוי בהגדרות (חובה/אופציונלי)
                                        <ul style={{ marginTop: '5px' }}>
                                            <li>המערכת בודקת תקינות מספר זהות ישראלי</li>
                                            <li>מציגה הודעה אם המספר לא תקין</li>
                                            <li>ניתן להגדיר בהגדרות אם זה שדה חובה</li>
                                        </ul>
                                    </li>
                                    <li>עיר, טלפון, כתובת, מייל (אופציונלי)</li>
                                    <li><strong>חדש!</strong> המערכת בודקת אם הלווה ברשימה השחורה</li>
                                    <li>לחץ "שמור לווה"</li>
                                </ul>

                                <h4>מתן הלוואה:</h4>
                                <ul>
                                    <li>לחץ על "ניהול הלוואות"</li>
                                    <li>בחר לווה מהרשימה (המערכת תזהיר אם הלווה ברשימה השחורה)</li>
                                    <li>מלא סכום ההלוואה (חובה), תאריכים</li>
                                    <li><strong>ערבים:</strong> בחר מרשימת הערבים המוכנה או הוסף חדש</li>
                                    <li><strong>הלוואות עתידיות:</strong> ניתן להגדיר הלוואה לתאריך עתידי
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
                                    <li>אם הופעל מעקב אמצעי תשלום - בחר אמצעי תשלום והזן פרטים</li>
                                    <li>לחץ "📄 שובר" להפקת שובר פרעון או "📁 PDF" לשמירה (ב-Electron)</li>
                                    <li>אשר את הפעולה</li>
                                </ul>

                                <h4>פרעון מרובה:</h4>
                                <ul>
                                    <li>בחר לווה עם מספר הלוואות</li>
                                    <li>לחץ "💰 פרעון מרובה"</li>
                                    <li>הזן סכום כולל - יחולק אוטומטית בין ההלוואות</li>
                                </ul>

                                <h4>דוח לווה מפורט:</h4>
                                <div style={{ background: '#e8f4fd', padding: '10px', borderRadius: '5px', margin: '10px 0' }}>
                                    <p><strong>איך לגשת לדוח:</strong></p>
                                    <ul>
                                        <li>בחר לווה בכרטיס ההלוואות</li>
                                        <li>לחץ על "📊 דוח" בכרטיס הלווה</li>
                                        <li><strong>חדש!</strong> הדוח כולל עיצוב מקצועי עם לוגו הגמ"ח</li>
                                    </ul>

                                    <p><strong>מה כולל הדוח:</strong></p>
                                    <ul>
                                        <li>פרטי הלווה המלאים (כולל מספר זהות אם קיים)</li>
                                        <li>סיכום כל ההלוואות (פעילות וסגורות)</li>
                                        <li>היסטוריית פרעונות מפורטת לכל הלוואה</li>
                                        <li>חישוב יתרות מדויק ועדכני</li>
                                        <li>סטטיסטיקות כלליות של הלווה</li>
                                        <li><strong>חדש!</strong> פרטי סניף הבנק (אם הוגדר)</li>
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
                                ⚙️ הגדרות מערכת
                            </h3>
                            <div style={{ background: '#f4f0ff', padding: '15px', borderRadius: '8px', margin: '10px 0' }}>
                                <h4>הגדרות בסיסיות:</h4>
                                <ul>
                                    <li>עבור להגדרות (⚙️) בדף הבית</li>
                                    <li>שנה ערכת נושא (בהיר/כהה)</li>
                                    <li>בחר מטבע (שקל/דולר/יורו)</li>
                                    <li><strong>חדש!</strong> הגדר פרטי סניף בנק למסמכים</li>
                                </ul>

                                <h4>פונקציות מתקדמות:</h4>
                                <ul>
                                    <li>הפעל "הלוואות מחזוריות" - למשתמשים שנותנים הלוואות קבועות</li>
                                    <li>הפעל "פרעונות מחזוריים" - למשתמשים עם פרעונות חודשיים קבועים</li>
                                    <li>הגדרת מספר זהות: קבע אם מספר זהות חובה או אופציונלי</li>
                                    <li>הפונקציות יופיעו בטופס ההלוואה רק לאחר ההפעלה</li>
                                </ul>

                                <h4>הגדרות מספר זהות:</h4>
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

                                <h4>🆕 הגדרת סניף בנק:</h4>
                                <div style={{ background: '#e8f4fd', padding: '10px', borderRadius: '5px', margin: '10px 0' }}>
                                    <p><strong>איך להגדיר:</strong></p>
                                    <ul>
                                        <li>עבור להגדרות → "בחירת סניף בנק"</li>
                                        <li>בחר בנק מהרשימה (בנק הפועלים, לאומי, דיסקונט ועוד)</li>
                                        <li>בחר סניף מהרשימה המתעדכנת</li>
                                        <li>הפרטים יופיעו אוטומטית בכל המסמכים</li>
                                    </ul>

                                    <p><strong>מה זה כולל:</strong></p>
                                    <ul>
                                        <li>שם הבנק והסניף</li>
                                        <li>כתובת הסניף המלאה</li>
                                        <li>מספר הסניף</li>
                                        <li>הופעה בשטרי הלוואה ודוחות</li>
                                    </ul>
                                </div>

                                <h4>🖨️ הדפסה משופרת:</h4>
                                <ul>
                                    <li><strong>ב-Electron:</strong> פתרון בעיית "יצוא לפני הדפסה" של Windows</li>
                                    <li><strong>שמירת PDF:</strong> כפתור "📁 שמור PDF" (זמין רק ב-Electron)</li>
                                    <li><strong>תצוגה מקדימה:</strong> בדפדפנים רגילים - חלון עם כפתורי הדפסה וסגירה</li>
                                    <li><strong>תפריט הדפסה:</strong> Ctrl+P להדפסה מהירה, Ctrl+Shift+P לשמירת PDF</li>
                                </ul>

                                <h4>📄 סוגי מסמכים:</h4>
                                <ul>
                                    <li><strong>שטר הלוואה:</strong> מסמך רשמי להלוואה עם כל הפרטים</li>
                                    <li><strong>שובר פרעון:</strong> אישור על קבלת תשלום עם פרטי אמצעי התשלום</li>
                                    <li><strong>שטר הפקדה:</strong> מסמך רשמי להפקדה</li>
                                    <li><strong>קבלה על תרומה:</strong> לצורכי מס</li>
                                    <li><strong>דו"ח לווה:</strong> סיכום מפורט של כל הלוואות הלווה</li>
                                </ul>

                                <h4>💳 מעקב אמצעי תשלום:</h4>
                                <ul>
                                    <li><strong>מופעל כברירת מחדל</strong> - מאפשר מעקב מפורט אחרי אמצעי תשלום</li>
                                    <li><strong>הלוואות מחזוריות:</strong> נוצרות ללא פרטי תשלום ודורשות השלמה</li>
                                    <li><strong>פרעונות אוטומטיים:</strong> נוצרים ללא פרטי תשלום ודורשים השלמה</li>
                                    <li><strong>כפתור "⚠️ השלמת פרטים":</strong> מופיע כשיש פריטים שדורשים השלמה</li>
                                    <li><strong>שוברי פרעון:</strong> כוללים את כל פרטי אמצעי התשלום</li>
                                </ul>

                                <div style={{ background: '#e8f4fd', padding: '10px', borderRadius: '5px', margin: '10px 0' }}>
                                    <p><strong>💡 טיפ:</strong> הפונקציות המתקדמות כבויות כברירת מחדל כדי לשמור על ממשק נקי ופשוט. הפעל אותן רק אם אתה צריך אותן.</p>
                                </div>
                            </div>
                        </section>

                        <section style={{ marginBottom: '30px' }}>
                            <h3 style={{ color: '#9b59b6', borderBottom: '2px solid #9b59b6', paddingBottom: '10px' }}>
                                🔄 עדכונים אוטומטיים
                            </h3>
                            <div style={{ background: '#f8f4fd', padding: '15px', borderRadius: '8px', margin: '10px 0' }}>
                                <h4>🚀 איך זה עובד:</h4>
                                <ul>
                                    <li><strong>בדיקה אוטומטית:</strong> התוכנה בודקת עדכונים בכל פתיחה</li>
                                    <li><strong>הורדה ברקע:</strong> אם יש עדכון, הוא מתחיל להוריד אוטומטית</li>
                                    <li><strong>התקנה בבחירה:</strong> אתה בוחר מתי להפעיל מחדש ולהתקין</li>
                                    <li><strong>מה חדש:</strong> תראה מה השתנה בגרסה החדשה</li>
                                </ul>

                                <h4 style={{ marginTop: '15px' }}>🔧 בדיקה ידנית:</h4>
                                <ul>
                                    <li><strong>דרך התפריט:</strong> עזרה → בדוק עדכונים</li>
                                    <li><strong>קיצור מקלדת:</strong> Alt → עזרה → בדוק עדכונים</li>
                                </ul>

                                <h4 style={{ marginTop: '15px' }}>🔍 איך לבדוק מיקום קבצים:</h4>
                                <div style={{ background: '#f0f8ff', padding: '10px', borderRadius: '5px', margin: '10px 0' }}>
                                    <ol>
                                        <li><strong>פתח Run:</strong> לחץ Windows + R</li>
                                        <li><strong>הקלד:</strong> <code>%LOCALAPPDATA%</code> ולחץ Enter</li>
                                        <li><strong>חפש תיקיה:</strong> <code>gemach-management-system-updater</code></li>
                                        <li><strong>או הקלד ישירות:</strong> <code>%LOCALAPPDATA%\gemach-management-system-updater</code></li>
                                    </ol>
                                    
                                    <p><strong>💡 טיפים:</strong></p>
                                    <ul>
                                        <li>התיקיה נוצרת רק אחרי עדכון ראשון</li>
                                        <li>אם אין עדכונים - התיקיה עשויה להיות ריקה</li>
                                        <li>ניתן למחוק את התיקיה בבטחה אם נדרש</li>
                                        <li>הקבצים נמחקים אוטומטית אחרי התקנה מוצלחת</li>
                                    </ul>
                                </div>

                                <h4 style={{ marginTop: '15px' }}>📋 תהליך בדיקת עדכונים מתקדם:</h4>
                                <div style={{ background: '#e8f4fd', padding: '10px', borderRadius: '5px', margin: '10px 0' }}>
                                    <ol>
                                        <li><strong>לחץ על תפריט "עזרה"</strong> בחלק העליון של החלון</li>
                                        <li><strong>בחר "בדוק עדכונים"</strong> מהתפריט הנפתח</li>
                                        <li><strong>תצוגה מקדימה:</strong> תראה את שלבי התהליך בזמן אמת</li>
                                        <li><strong>מידע מפורט:</strong> גרסה נוכחית, שרת עדכונים ותאריך בדיקה</li>
                                        <li><strong>אם יש עדכון:</strong> הורדה אוטומטית עם התקדמות בכותרת החלון</li>
                                        <li><strong>התקנה גמישה:</strong> בחר להתקין מיד או לדחות למועד מאוחר יותר</li>
                                        <li><strong>אם אין עדכון:</strong> הודעה מפורטת שהמערכת מעודכנת</li>
                                    </ol>
                                    
                                    <p><strong>🎯 תכונות מתקדמות:</strong></p>
                                    <ul style={{ marginTop: '10px' }}>
                                        <li>📊 מעקב התקדמות הורדה בזמן אמת</li>
                                        <li>🔍 הודעות מפורטות עם פרטים טכניים</li>
                                        <li>⚠️ טיפול חכם בשגיאות עם הצעות פתרון</li>
                                        <li>⏰ אפשרות לדחיית התקנה ללא איבוד העדכון</li>
                                    </ul>
                                    
                                    <h4 style={{ marginTop: '15px' }}>📁 איפה העדכונים נשמרים:</h4>
                                    <div style={{ background: '#f0f8ff', padding: '10px', borderRadius: '5px', margin: '10px 0' }}>
                                        <p><strong>📂 מיקומי קבצים:</strong></p>
                                        <ul>
                                            <li><strong>Windows:</strong> <code>%LOCALAPPDATA%\gemach-management-system-updater\</code></li>
                                            <li><strong>נתיב מלא:</strong> <code>C:\Users\[שם משתמש]\AppData\Local\gemach-management-system-updater\</code></li>
                                            <li><strong>קבצי עדכון זמניים:</strong> <code>%TEMP%\</code></li>
                                            <li><strong>לוגים:</strong> <code>%USERPROFILE%\AppData\Roaming\gemach-management-system\logs\</code></li>
                                        </ul>
                                        
                                        <p><strong>🗂️ מה נשמר שם:</strong></p>
                                        <ul>
                                            <li>קבצי עדכון שהורדו</li>
                                            <li>מטא-דאטה של גרסאות</li>
                                            <li>לוגים של תהליך העדכון</li>
                                            <li>קבצי גיבוי זמניים</li>
                                        </ul>
                                        
                                        <p><strong>🧹 ניקוי קבצים:</strong></p>
                                        <ul>
                                            <li>הקבצים נמחקים אוטומטית אחרי התקנה מוצלחת</li>
                                            <li>ניתן למחוק ידנית את התיקיות אם נדרש</li>
                                            <li>הלוגים נשמרים לצורכי דיבוג</li>
                                        </ul>
                                    </div>
                                    
                                    <p><strong>💡 טיפ:</strong> העדכונים אוטומטיים זמינים רק בגרסת ה-EXE. בדפדפן תצטרך להוריד גרסה חדשה ידנית מהאתר.</p>
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
                                    <li><strong>מספר זהות לא מתקבל?</strong> → בדוק שהמספר תקין (9 ספרות עם ספרת ביקורת נכונה)</li>
                                    <li><strong>לא יכול להוסיף הלוואה?</strong> → וודא שבחרת לווה ומילאת סכום</li>
                                    <li><strong>הלוואה עתידית לא מופיעה?</strong> → היא תופיע עם סימון מיוחד (🕐) ברשימת ההלוואות</li>
                                    <li><strong>איך לראות דוח מפורט של לווה?</strong> → לחץ על "📊 דוח" בכרטיס הלווה</li>
                                    <li><strong>חדש! לא רואה כלים מנהליים?</strong> → הכפתור נמצא בדף הבית תחת "כלים מנהליים"</li>
                                    <li><strong>חדש! איך להוסיף ערב מהיר?</strong> → השתמש ברשימת הערבים המוכנה בכלים מנהליים</li>
                                    <li><strong>חדש! מכתב התראה לא נוצר?</strong> → וודא שבחרת לווה עם הלוואות פעילות</li>
                                </ul>
                            </div>
                        </section>

                        <section style={{ marginBottom: '30px' }}>
                            <h3 style={{ color: '#f39c12', borderBottom: '2px solid #f39c12', paddingBottom: '10px' }}>
                                � התקנה  ואזהרות Windows
                            </h3>
                            <div style={{ background: '#fff9e6', padding: '15px', borderRadius: '8px', margin: '10px 0' }}>
                                <h4>🛡️ אזהרת Windows Defender:</h4>
                                <div style={{ background: '#ffeaa7', padding: '10px', borderRadius: '5px', margin: '10px 0' }}>
                                    <p><strong>אם Windows מציג אזהרה "Windows protected your PC":</strong></p>
                                    <ol>
                                        <li><strong>לחץ על "More info"</strong> (פרטים נוספים)</li>
                                        <li><strong>לחץ על "Run anyway"</strong> (הרץ בכל זאת)</li>
                                        <li><strong>או:</strong> לחץ ימין על הקובץ → Properties → Unblock</li>
                                    </ol>
                                    
                                    <p><strong>💡 למה זה קורה?</strong></p>
                                    <ul>
                                        <li>התוכנה לא חתומה דיגיטלית (חתימה עולה כסף)</li>
                                        <li>זה נורמלי לתוכנות קוד פתוח</li>
                                        <li>התוכנה בטוחה לחלוטין - קוד פתוח ב-GitHub</li>
                                        <li>Windows מזהיר מכל תוכנה לא חתומה</li>
                                    </ul>
                                </div>

                                <h4>📥 הוראות התקנה:</h4>
                                <ol>
                                    <li>הורד את קובץ ה-Setup.exe מ-GitHub Releases</li>
                                    <li>אם מופיעה אזהרה - עקוב אחרי ההוראות למעלה</li>
                                    <li>הפעל את קובץ ההתקנה</li>
                                    <li>בחר תיקיית התקנה (או השאר ברירת מחדל)</li>
                                    <li>המתן להתקנה להסתיים</li>
                                    <li>התוכנה תיפתח אוטומטית</li>
                                </ol>

                                <h4>🔧 פתרון בעיות התקנה:</h4>
                                <ul>
                                    <li><strong>ההתקנה נכשלת?</strong> → הפעל כמנהל (Run as Administrator)</li>
                                    <li><strong>אנטי-וירוס חוסם?</strong> → הוסף חריגה לתיקיית ההתקנה</li>
                                    <li><strong>שגיאת הרשאות?</strong> → בדוק שיש מקום פנוי בדיסק</li>
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

                </div>
            </div>

            <button className="back-btn" onClick={() => navigate('/')}>
                🏠
            </button>
        </div>
    )
}

export default HelpPage