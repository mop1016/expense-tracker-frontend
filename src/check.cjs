const fs = require('fs');
const content = fs.readFileSync('App.jsx', 'utf8');
const lines = content.split('\n');

// 檢查第1719行附近
for (let i = 1714; i <= 1724; i++) {
  if (lines[i-1]) {
    console.log(`${i}: ${lines[i-1]}`);
  }
}

// 檢查是否有未閉合的字符串或模板字符串
let inString = false;
let inTemplate = false;
let stringChar = '';

for (let i = 1714; i <= 1724; i++) {
  const line = lines[i-1];
  if (!line) continue;
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    const prevChar = j > 0 ? line[j-1] : '';
    
    if (!inString && !inTemplate) {
      if (char === '"' || char === "'") {
        inString = true;
        stringChar = char;
      } else if (char === '`') {
        inTemplate = true;
      }
    } else if (inString && char === stringChar && prevChar !== '\\') {
      inString = false;
      stringChar = '';
    } else if (inTemplate && char === '`' && prevChar !== '\\') {
      inTemplate = false;
    }
  }
  
  if (inString || inTemplate) {
    console.log(`Line ${i}: Unclosed string/template`);
  }
}
