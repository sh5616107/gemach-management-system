// בדיקת תקינות מספר זהות ישראלי
export function validateIsraeliId(id: string): boolean {
  // הסר רווחים ומקפים
  const cleanId = id.replace(/[\s-]/g, '');

  // בדוק שהמספר מכיל רק ספרות ואורכו 9
  if (!/^\d{9}$/.test(cleanId)) {
    return false;
  }

  // בדיקת ספרת ביקורת
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let digit = parseInt(cleanId[i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) {
        digit = Math.floor(digit / 10) + (digit % 10);
      }
    }
    sum += digit;
  }

  return sum % 10 === 0;
}

// פורמט מספר זהות (XXX-XX-XXXX)
export function formatIdNumber(idNumber: string): string {
  const cleanId = idNumber.replace(/[\s-]/g, '');
  if (cleanId.length === 9) {
    return `${cleanId.slice(0, 3)}-${cleanId.slice(3, 5)}-${cleanId.slice(5)}`;
  }
  return cleanId;
}
