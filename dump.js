
const fs = require('fs');
const lines = fs.readFileSync('C:\\\\Users\\\\ysfde\\\\.gemini\\\\antigravity\\\\brain\\\\13653dc5-97b5-40f9-960f-c3523139db17\\\\.system_generated\\\\logs\\\\transcript_full.jsonl', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    try {
        const obj = JSON.parse(lines[i]);
        if (JSON.stringify(obj).includes('File Path: ile:///C:/Dev/FootballTaboo/src/screens/HomeScreen.tsx')) {
            console.log('Found in type:', obj.type);
        }
    } catch(e) {}
}

