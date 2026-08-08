
import json
import re

with open(r'C:\Users\ysfde\.gemini\antigravity\brain\13653dc5-97b5-40f9-960f-c3523139db17\.system_generated\logs\transcript_full.jsonl', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(len(lines)-1, -1, -1):
    if not lines[i].strip():
        continue
    try:
        obj = json.loads(lines[i])
        if obj.get('source') == 'SYSTEM' and obj.get('type') == 'TOOL_RESPONSE':
            content = obj.get('content', '')
            if 'CATEGORIES.map' in content and 'File Path: ile:///C:/Dev/FootballTaboo/src/screens/HomeScreen.tsx' in content:
                # We found the view_file output!
                
                # Extract the code
                # Find where code starts ('1: import ...')
                match = re.search(r'(1: import .*?)The above content shows the entire', content, re.DOTALL)
                if match:
                    code_with_lines = match.group(1)
                    clean_code = []
                    for line in code_with_lines.split('\n'):
                        m = re.match(r'^\d+:\s(.*)', line)
                        if m:
                            clean_code.append(m.group(1))
                    
                    with open('src/screens/HomeScreen.tsx', 'w', encoding='utf-8') as out:
                        out.write('\n'.join(clean_code))
                    print('SUCCESSFULLY EXTRACTED')
                    break
    except Exception as e:
        pass

