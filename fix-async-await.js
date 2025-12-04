/**
 * סקריפט להוספת async/await אוטומטית
 * 
 * הרצה: node fix-async-await.js
 */

const fs = require('fs');
const path = require('path');

const DIRS_TO_SCAN = ['src/pages', 'src/components'];

let filesChanged = 0;
let totalChanges = 0;

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let fileChanges = 0;

  // תבניות לתיקון
  const patterns = [
    // const x = dataService.something() → const x = await dataService.something()
    {
      from: /(\s+)(const|let|var)\s+(\w+)\s*=\s*dataService\.(\w+)\(/g,
      to: '$1$2 $3 = await dataService.$4('
    },
    // dataService.something() בתחילת שורה → await dataService.something()
    {
      from: /^(\s+)dataService\.(\w+)\(/gm,
      to: '$1await dataService.$2('
    },
    // return dataService.something() → return await dataService.something()
    {
      from: /return\s+dataService\.(\w+)\(/g,
      to: 'return await dataService.$1('
    }
  ];

  patterns.forEach(({ from, to }) => {
    const matches = content.match(from);
    if (matches) {
      fileChanges += matches.length;
      content = content.replace(from, to);
    }
  });

  // הוסף async לפונקציות שצריכות
  // מצא פונקציות שיש בהן await אבל אין async
  const functionPatterns = [
    // function name() { ... await ... }
    /function\s+(\w+)\s*\([^)]*\)\s*\{[^}]*await\s+dataService/g,
    // const name = () => { ... await ... }
    /const\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*\{[^}]*await\s+dataService/g,
    // const name = function() { ... await ... }
    /const\s+(\w+)\s*=\s*function\s*\([^)]*\)\s*\{[^}]*await\s+dataService/g
  ];

  functionPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      // הוסף async אם חסר
      content = content.replace(
        /function\s+(\w+)\s*\(/g,
        'async function $1('
      );
      content = content.replace(
        /const\s+(\w+)\s*=\s*\(/g,
        'const $1 = async ('
      );
      content = content.replace(
        /const\s+(\w+)\s*=\s*function\s*\(/g,
        'const $1 = async function('
      );
    }
  });

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
      scanDirectory(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      processFile(filePath);
    }
  });
}

console.log('🚀 מתחיל תיקון async/await...\n');

DIRS_TO_SCAN.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`📁 סורק ${dir}...`);
    scanDirectory(dir);
  }
});

console.log('\n' + '='.repeat(50));
console.log(`✨ סיום! ${filesChanged} קבצים שונו, ${totalChanges} תיקונים בוצעו`);
console.log('='.repeat(50));

if (filesChanged > 0) {
  console.log('\n⚠️  שים לב:');
  console.log('1. בדוק שהקוד עדיין עובד');
  console.log('2. ייתכן שיש מקומות שצריכים תיקון ידני');
  console.log('3. רענן את הדפדפן ובדוק שגיאות');
}
