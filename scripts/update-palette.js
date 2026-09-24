const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '../public/pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));

const replacements = [
  // Hex replacements (case-insensitive)
  { regex: /#7A286F/gi, replacement: '#2B2D42' },
  { regex: /#63205A/gi, replacement: '#1E202F' },
  { regex: /#4A1547/gi, replacement: '#1E202F' },
  { regex: /#9B4A90/gi, replacement: '#3D405B' },
  { regex: /#CA0097/gi, replacement: '#2B2D42' },
  { regex: /#E600A9/gi, replacement: '#1E202F' },
  { regex: /#1E001B/gi, replacement: '#2B2D42' },
  { regex: /#2A0B29/gi, replacement: '#1E202F' },
  { regex: /#381535/gi, replacement: '#353852' },
  { regex: /#F1E3EF/gi, replacement: '#EDF2F4' },
  { regex: /#F8F6F8/gi, replacement: '#EDF2F4' },
  { regex: /#F8F3F8/gi, replacement: '#EDF2F4' },
  { regex: /#F8E6F4/gi, replacement: '#FFFFFF' },
  { regex: /#E5E0E5/gi, replacement: '#D5D8DC' },
  // RGBA replacements
  { regex: /rgba\(\s*122\s*,\s*40\s*,\s*111\s*,/g, replacement: 'rgba(43, 45, 66,' },
  { regex: /rgba\(122,40,111,/g, replacement: 'rgba(43,45,66,' },
  { regex: /rgba\(\s*182\s*,\s*0\s*,\s*149\s*,/g, replacement: 'rgba(43, 45, 66,' },
  { regex: /rgba\(182,0,149,/g, replacement: 'rgba(43,45,66,' },
  { regex: /rgba\(\s*202\s*,\s*0\s*,\s*151\s*,/g, replacement: 'rgba(43, 45, 66,' },
  { regex: /rgba\(202,0,151,/g, replacement: 'rgba(43,45,66,' }
];

let totalChanges = 0;

files.forEach(file => {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  replacements.forEach(({ regex, replacement }) => {
    content = content.replace(regex, replacement);
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    totalChanges++;
    console.log(`Updated: ${file}`);
  }
});

console.log(`\nCompleted! Updated ${totalChanges} page templates.`);
