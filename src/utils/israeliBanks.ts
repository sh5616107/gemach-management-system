// רשימת הבנקים הישראליים עם מספרי הבנק הרשמיים

export interface IsraeliBank {
  code: string
  name: string
  fullName: string
}

export const israeliBanks: IsraeliBank[] = [
  { code: '10', name: 'בנק לאומי', fullName: 'בנק לאומי לישראל בע"מ' },
  { code: '11', name: 'בנק דיסקונט', fullName: 'בנק דיסקונט לישראל בע"מ' },
  { code: '12', name: 'בנק הפועלים', fullName: 'בנק הפועלים בע"מ' },
  { code: '13', name: 'בנק איגוד', fullName: 'בנק איגוד לישראל בע"מ' },
  { code: '14', name: 'בנק אוצר החייל', fullName: 'בנק אוצר החייל בע"מ' },
  { code: '15', name: 'בנק ירושלים', fullName: 'בנק ירושלים בע"מ' },
  { code: '16', name: 'בנק מרכנתיל', fullName: 'בנק מרכנתיל דיסקונט בע"מ' },
  { code: '17', name: 'בנק מזרחי טפחות', fullName: 'בנק מזרחי טפחות בע"מ' },
  { code: '18', name: 'בנק הבינלאומי', fullName: 'הבנק הבינלאומי הראשון לישראל בע"מ' },
  { code: '19', name: 'בנק יהב', fullName: 'בנק יהב לעובדי המדינה בע"מ' },
  { code: '20', name: 'בנק מסד', fullName: 'בנק מסד בע"מ' },
  { code: '22', name: 'סיטיבנק', fullName: 'סיטיבנק ישראל בע"מ' },
  { code: '23', name: 'HSBC', fullName: 'HSBC בנק בע"מ' },
  { code: '26', name: 'בנק אדנים', fullName: 'בנק אדנים בע"מ' },
  { code: '27', name: 'בנק פועלי אגודת ישראל', fullName: 'בנק פועלי אגודת ישראל בע"מ' },
  { code: '31', name: 'בנק הדואר', fullName: 'בנק הדואר בע"מ' },
  { code: '34', name: 'בנק פאג', fullName: 'בנק פאג בע"מ' },
  { code: '46', name: 'בנק מסד (סניף)', fullName: 'בנק מסד בע"מ - סניף' },
  { code: '52', name: 'בנק אקספרס', fullName: 'בנק אקספרס בע"מ' },
  { code: '54', name: 'בנק ערבי ישראלי', fullName: 'הבנק הערבי הישראלי בע"מ' },
  { code: '59', name: 'UBank', fullName: 'UBank בע"מ' },
  { code: '65', name: 'בנק לימן ברדרס', fullName: 'בנק לימן ברדרס בע"מ' },
  { code: '66', name: 'בנק דויטשה', fullName: 'בנק דויטשה בע"מ' },
  { code: '68', name: 'בנק הבינלאומי (סניף)', fullName: 'הבנק הבינלאומי הראשון לישראל בע"מ - סניף' },
  { code: '71', name: 'בנק JP מורגן', fullName: 'בנק JP מורגן צ\'ייס בע"מ' },
  { code: '72', name: 'בנק BNP פריבה', fullName: 'בנק BNP פריבה בע"מ' },
  { code: '73', name: 'בנק ברקליס', fullName: 'בנק ברקליס בע"מ' },
  { code: '74', name: 'בנק אוף אמריקה', fullName: 'בנק אוף אמריקה בע"מ' },
  { code: '77', name: 'בנק יובנק', fullName: 'בנק יובנק בע"מ' },
  { code: '83', name: 'בנק גמל', fullName: 'בנק גמל בע"מ' },
  { code: '84', name: 'בנק פועלים שוויץ', fullName: 'בנק פועלים שוויץ בע"מ' },
  { code: '89', name: 'בנק HBL', fullName: 'בנק HBL בע"מ' },
  { code: '90', name: 'בנק לאומי (לונדון)', fullName: 'בנק לאומי לישראל (לונדון) בע"מ' },
  { code: '93', name: 'בנק אוניון', fullName: 'בנק אוניון בע"מ' },
  { code: '99', name: 'בנק אחר', fullName: 'בנק אחר' }
]

export const getBankByCode = (code: string): IsraeliBank | undefined => {
  return israeliBanks.find(bank => bank.code === code)
}

export const getBankByName = (name: string): IsraeliBank | undefined => {
  return israeliBanks.find(bank => bank.name === name || bank.fullName === name)
}

export const formatBankOption = (bank: IsraeliBank): string => {
  return `${bank.code} - ${bank.name}`
}