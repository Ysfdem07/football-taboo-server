import re

with open('src/screens/OnlineLobbyScreen.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    r"<Text style=\{styles.buttonText\}>IPTAL ET</Text>": "<Text style={styles.buttonText}>{language === 'en' ? 'CANCEL' : 'IPTAL ET'}</Text>",
    r"<Text style=\{styles.buttonText\}>IPTAL</Text>": "<Text style={styles.buttonText}>{language === 'en' ? 'CANCEL' : 'IPTAL'}</Text>",
    r"<Text style=\{styles.collapseTitle\}>DERECELI OYNA</Text>": "<Text style={styles.collapseTitle}>{language === 'en' ? 'PLAY RANKED' : 'DERECELI OYNA'}</Text>",
    r"<Text style=\{styles.collapseTitle\}>DOSTLUK MAÇI</Text>": "<Text style={styles.collapseTitle}>{language === 'en' ? 'FRIENDLY MATCH' : 'DOSTLUK MAÇI'}</Text>",
    r"<Text style=\{styles.roundsLabel\}>Özel Oda Tur Sayisi:</Text>": "<Text style={styles.roundsLabel}>{language === 'en' ? 'Private Room Rounds:' : 'Özel Oda Tur Sayisi:'}</Text>",
    r"<Text style=\{styles.buttonText\}>Olustur ve Basla</Text>": "<Text style={styles.buttonText}>{language === 'en' ? 'Create & Start' : 'Olustur ve Basla'}</Text>",
    r"<Text style=\{styles.buttonText\}>Geri Dön</Text>": "<Text style={styles.buttonText}>{language === 'en' ? 'Go Back' : 'Geri Dön'}</Text>",
    r"<Text style=\{\[styles.modeLabel, \{ textShadowRadius: 10 \}\]\}>DERECELI</Text>": "<Text style={[styles.modeLabel, { textShadowRadius: 10 }]}>{language === 'en' ? 'RANKED' : 'DERECELI'}</Text>",
    r"<Text style=\{\[styles.modeSubLabel, \{ color: '#fff' \}\]\}>MAÇI</Text>": "<Text style={[styles.modeSubLabel, { color: '#fff' }]}>{language === 'en' ? 'MATCH' : 'MAÇI'}</Text>",
    r"<Text style=\{styles.backButtonText\}>Ana Menüye Dön</Text>": "<Text style={styles.backButtonText}>{language === 'en' ? 'Back to Main Menu' : 'Ana Menüye Dön'}</Text>"
}

for old, new in replacements.items():
    content = re.sub(old, new, content)

with open('src/screens/OnlineLobbyScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

