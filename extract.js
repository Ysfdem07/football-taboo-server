
const fs = require('fs');
const lines = fs.readFileSync('C:\\\\Users\\\\ysfde\\\\.gemini\\\\antigravity\\\\brain\\\\13653dc5-97b5-40f9-960f-c3523139db17\\\\.system_generated\\\\logs\\\\transcript_full.jsonl', 'utf8').split('\n');

for (let i = lines.length - 1; i >= 0; i--) {
    if (!lines[i].trim()) continue;
    try {
        const obj = JSON.parse(lines[i]);
        if (obj.source === 'SYSTEM' && obj.type === 'TOOL_RESPONSE') {
            const content = obj.content || '';
            if (content.includes('CATEGORIES.map') && content.includes('File Path: ile:///C:/Dev/FootballTaboo/src/screens/HomeScreen.tsx')) {
                const match = content.match(/1: import (.*?)The above content shows the entire/s);
                if (match) {
                    const code_with_lines = '1: import ' + match[1];
                    const clean_code = [];
                    for (const line of code_with_lines.split('\n')) {
                        const m = line.match(/^\d+:\s(.*)/);
                        if (m) {
                            clean_code.push(m[1]);
                        }
                    }
                    fs.writeFileSync('src/screens/HomeScreen.tsx', clean_code.join('\n'));
                    console.log('SUCCESSFULLY EXTRACTED');
                    process.exit(0);
                }
            }
        }
    } catch(e) {}
}
console.log('NOT FOUND');

