/**
 * סקריפט להחלפת db. ב-dataService. בכל הקבצים
 * 
 * הרצה: node migrate-to-dataservice.js
 */

const fs = require('fs');
const path = require('path');

// תיקיות לסריקה
const DIRS_TO_SCAN = ['src/pages', 'src/components'];

// תבניות להחלפה
const REPLACEMENTS = [
  {
    // החלף import
    from: /import { db } from ['"]\.\.\/database\/database['"]/g,
    to: "import { dataService } from '../api/dataService'"
  },
  {
    // החלף import (נתיב אחר)
    from: /import { db } from ['"]\.\.\/\.\.\/database\/database['"]/g,
    to: "import { dataService } from '../../api/dataService'"
  },
  {
    // החלף db. ל-dataService.
    from: /\bdb\./g,
    to: 'dataService.'
  }
];

let filesChanged = 0;
let totalChanges = 0;

function processFile(filePath) {
  // קרא את הקובץ
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let fileChanges = 0;

  // בצע את כל ההחלפות
  REPLACEMENTS.forEach(({ from, to }) => {
    const matches = content.match(from);
    if (matches) {
      fileChanges += matches.length;
      content = content.replace(from, to);
    }
  });

  // אם היו שינויים - שמור את הקובץ
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    filesChanged++;
    totalChanges += fileChanges;
    console.log(`✅ ${filePath} - ${fileChanges} שינויים`);
  }
}

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // סרוק תיקיות משנה
      scanDirectory(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      // עבד קבצי TypeScript/React
      processFile(filePath);
    }
  });
}

console.log('🚀 מתחיל מעבר ל-dataService...\n');

// סרוק את כל התיקיות
DIRS_TO_SCAN.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`📁 סורק ${dir}...`);
    scanDirectory(dir);
  }
});

console.log('\n' + '='.repeat(50));
console.log(`✨ סיום! ${filesChanged} קבצים שונו, ${totalChanges} החלפות בוצעו`);
console.log('='.repeat(50));

if (filesChanged > 0) {
  console.log('\n⚠️  שים לב:');
  console.log('1. בדוק שהקוד עדיין עובד');
  console.log('2. חלק מהפונקציות עדיין מקומיות (לא API)');
  console.log('3. תצטרך להוסיף async/await במקומות מסוימים');
}
