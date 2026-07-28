const fs = require('fs');
const path = require('path');

const wordsPath = path.join(__dirname, '..', 'assets', 'data', 'words.json');
let words = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));

const newWords = [
  // Futbol Terimleri
  { word: 'Ofsayt', forbidden: ['Çizgi', 'Bayrak', 'Hakem', 'Pas', 'Geride'] },
  { word: 'Röveşata', forbidden: ['Ters', 'Havada', 'Zlatan', 'Vuruş', 'Makas'] },
  { word: 'Bonservis', forbidden: ['Transfer', 'Ücret', 'Sözleşme', 'Bedel', 'Satın Alma'] },
  { word: 'Trivela', forbidden: ['Quaresma', 'Dış', 'Ayak', 'Falso', 'Vuruş'] },
  { word: 'Plase', forbidden: ['Köşe', 'Ayak İçi', 'Kibar', 'Vuruş', 'Şut'] },
  { word: 'Aşırtma', forbidden: ['Üstünden', 'Kaleci', 'Aşırmak', 'Vuruş', 'Lop'] },
  { word: 'Hattrick', forbidden: ['Üç', 'Gol', 'Maç', 'Aynı', 'Oyuncu'] },
  { word: 'Topuk Pası', forbidden: ['Guti', 'Arka', 'Topuk', 'Ayak', 'Pas'] },
  { word: 'Asist', forbidden: ['Gol', 'Pas', 'Son', 'Yapan', 'De Bruyne'] },
  { word: 'Frikik', forbidden: ['Serbest Vuruş', 'Baraj', 'Hakem', 'Düdük', 'Juninho'] },
  { word: 'Penaltı', forbidden: ['Nokta', 'On Bir', 'Ceza Sahası', 'Kaleci', 'Hakem'] },
  { word: 'Korner', forbidden: ['Köşe', 'Bayrak', 'Vuruş', 'Kafa', 'Direk'] },
  { word: 'Taç', forbidden: ['Kenar', 'Çizgi', 'Elle', 'Atış', 'Oyun'] },
  { word: 'Averaj', forbidden: ['Gol', 'Fark', 'Puan', 'Eşitlik', 'Lig'] },
  { word: 'Deplasman', forbidden: ['Dış', 'Saha', 'Rakip', 'Seyirci', 'Ev Sahibi'] },
  { word: 'VAR', forbidden: ['Hakem', 'Ekran', 'Video', 'İptal', 'İtiraz'] },
  { word: 'Sarı Kart', forbidden: ['Hakem', 'Uyarı', 'Faul', 'İkinci', 'Cezalı'] },
  { word: 'Kırmızı Kart', forbidden: ['Atılmak', 'Hakem', 'Faul', 'İhraç', 'Sert'] },
  { word: 'Amigo', forbidden: ['Taraftar', 'Tribün', 'Tezahürat', 'Lider', 'Davul'] },
  { word: 'Derbi', forbidden: ['Aynı Şehir', 'Rekabet', 'Olay', 'Maç', 'Büyük'] },
  { word: 'Tiki Taka', forbidden: ['Barcelona', 'Pas', 'Kısa', 'Guardiola', 'Sürekli'] },
  { word: 'Catenaccio', forbidden: ['İtalya', 'Savunma', 'Defans', 'Kilit', 'Sert'] },
  { word: 'Gegenpressing', forbidden: ['Klopp', 'Alman', 'Baskı', 'Kazanmak', 'Top'] },
  { word: 'Box to Box', forbidden: ['Orta Saha', 'Ceza Sahası', 'İki Yönlü', 'Koşu', 'Gerrard'] },
  { word: 'Regista', forbidden: ['Pirlo', 'Orta Saha', 'Oyun Kurucu', 'Geriden', 'Pas'] },
  { word: 'Trequartista', forbidden: ['İtalya', '10 Numara', 'Forvet Arkası', 'Totti', 'Yaratıcı'] },
  { word: 'Sweeper Keeper', forbidden: ['Neuer', 'Kaleci', 'Libero', 'Çıkmak', 'Savunma'] },
  { word: 'False Nine', forbidden: ['Messi', 'Forvet', 'Sahte', 'Geriye', 'Dokuz'] },

  // Spesifik / İkonik Oyuncular (Eski ve Yeni)
  { word: 'Shunsuke Nakamura', forbidden: ['Japon', 'Celtic', 'Frikik', 'Sol Ayak', 'Efsane'] },
  { word: 'Jay-Jay Okocha', forbidden: ['Fenerbahçe', 'Nijerya', 'Çalım', 'Teknik', 'PSG'] },
  { word: 'Hakan Şükür', forbidden: ['Kral', 'Galatasaray', 'Kafa', 'Torino', 'Gol'] },
  { word: 'Jardel', forbidden: ['Galatasaray', 'Brezilya', 'Kafa', 'Süper Kupa', 'Golcü'] },
  { word: 'Claudio Taffarel', forbidden: ['Galatasaray', 'Brezilya', 'Kaleci', 'UEFA', 'Kurtarış'] },
  { word: 'Gheorghe Popescu', forbidden: ['Galatasaray', 'Romanya', 'Stoper', 'Penaltı', 'Kaptan'] },
  { word: 'Uche Okechukwu', forbidden: ['Fenerbahçe', 'Nijerya', 'Stoper', 'Högh', 'Uzun'] },
  { word: 'Elvir Balic', forbidden: ['Fenerbahçe', 'Bosna', 'Real Madrid', 'Sol Ayak', 'Bonservis'] },
  { word: 'Ariel Ortega', forbidden: ['Fenerbahçe', 'Arjantin', '10 Numara', 'River Plate', 'Kaçtı'] },
  { word: 'Milan Baros', forbidden: ['Galatasaray', 'Çekya', 'Forvet', 'Liverpool', 'Gol Kralı'] },
  { word: 'Abdul Kader Keita', forbidden: ['Galatasaray', 'Fildişi', 'Kanat', 'Çalım', 'Lyon'] },
  { word: 'Guti Hernandez', forbidden: ['Beşiktaş', 'Real Madrid', 'Sarı Saç', 'Asist', '14'] },
  { word: 'Matias Almeyda', forbidden: ['Arjantin', 'Orta Saha', 'Lazio', 'Saç', 'Sert'] },
  { word: 'Edgar Davids', forbidden: ['Gözlük', 'Hollanda', 'Juventus', 'Agresif', 'Pitbull'] },
  { word: 'Clarence Seedorf', forbidden: ['Hollanda', 'Milan', 'Şampiyonlar Ligi', 'Kas', 'Şut'] },
  { word: 'Ruud Gullit', forbidden: ['Hollanda', 'Rasta', 'Milan', 'Efsane', 'Van Basten'] },
  { word: 'Marco van Basten', forbidden: ['Hollanda', 'Milan', 'Forvet', 'Bicycle Kick', 'Sakatlık'] },
  { word: 'Oliver Kahn', forbidden: ['Almanya', 'Bayern Münih', 'Kaleci', 'Sinirli', 'Titan'] },
  { word: 'Michael Ballack', forbidden: ['Almanya', 'Chelsea', '13', 'Orta Saha', 'İkinci'] },
  { word: 'Dimitar Berbatov', forbidden: ['Bulgaristan', 'Manchester United', 'Teknik', 'Sakin', 'Dokunuş'] },
  { word: 'Carlos Tevez', forbidden: ['Arjantin', 'Apache', 'Juventus', 'City', 'United'] },
  { word: 'Javier Hernandez', forbidden: ['Meksika', 'Chicharito', 'Forvet', 'United', 'Golcü'] },
  { word: 'Park Ji-sung', forbidden: ['Güney Kore', 'Manchester United', 'Ciğer', 'Koşu', 'Pirlo'] },
  { word: 'Nemanja Matic', forbidden: ['Sırbistan', 'Chelsea', 'United', 'Ön Libero', 'Sol Ayak'] },
  { word: 'Cesc Fabregas', forbidden: ['İspanya', 'Arsenal', 'Chelsea', 'Asist', 'Barcelona'] },
  { word: 'Santi Cazorla', forbidden: ['İspanya', 'Arsenal', 'İki Ayak', 'Gülümseme', 'Orta Saha'] },
  { word: 'Tomas Rosicky', forbidden: ['Çekya', 'Arsenal', 'Küçük Mozart', 'Sakatlık', 'Orta Saha'] },
  { word: 'Hatem Ben Arfa', forbidden: ['Fransa', 'Çalım', 'Teknik', 'Newcastle', 'PSG'] },
  { word: 'Adel Taarabt', forbidden: ['Fas', 'QPR', 'Çalım', 'Yetenek', 'Sokak'] },
  { word: 'Quaresma', forbidden: ['Trivela', 'Rabona', 'Portekiz', 'Beşiktaş', 'Çalım'] },
  { word: 'Anderson Talisca', forbidden: ['Beşiktaş', 'Brezilya', 'Sol Ayak', 'Kafa', 'Frikik'] },
  { word: 'Moussa Sow', forbidden: ['Fenerbahçe', 'Röveşata', 'Senegal', 'Ters', 'Forvet'] },
  { word: 'Emmanuel Emenike', forbidden: ['Fenerbahçe', 'Nijerya', 'Güç', 'Hız', 'Kardemir Karabükspor'] },
  { word: 'Demba Ba', forbidden: ['Beşiktaş', 'Senegal', 'Chelsea', 'Secde', 'Forvet'] },
  { word: 'Vagner Love', forbidden: ['Alanyaspor', 'Beşiktaş', 'Brezilya', 'Saç', 'Forvet'] },
  { word: 'Bafetimbi Gomis', forbidden: ['Galatasaray', 'Aslan', 'Sevinç', 'Forvet', 'Fransa'] },
  { word: 'Alexander Sörloth', forbidden: ['Trabzonspor', 'Kuzeyin Kralı', 'Norveç', 'Gol Kralı', 'Uzun'] },
  { word: 'Anthony Nwakaeme', forbidden: ['Trabzonspor', 'Nijerya', 'Kanat', 'Çalım', 'Beyin'] },
  { word: 'Hugo Almeida', forbidden: ['Beşiktaş', 'Portekiz', 'Forvet', 'Uzun', 'Bıyık'] },
  { word: 'Milos Krasic', forbidden: ['Fenerbahçe', 'Juventus', 'Sırbistan', 'Kanat', 'Saç'] },
  { word: 'Diego Ribas', forbidden: ['Fenerbahçe', 'Atletico Madrid', 'Brezilya', '10 Numara', 'Werder Bremen'] },
  { word: 'Jose Kleberson', forbidden: ['Beşiktaş', 'Brezilya', 'Manchester United', 'Dünya Kupası', 'Orta Saha'] },
  { word: 'Ailton', forbidden: ['Beşiktaş', 'Schalke', 'Brezilya', 'Kilo', 'Forvet'] },
  { word: 'Nicolas Anelka', forbidden: ['Fenerbahçe', 'Fransa', 'Gezgin', 'Chelsea', 'Arsenal'] },
  { word: 'Pierre Webo', forbidden: ['Fenerbahçe', 'Kamerun', 'Başakşehir', 'Forvet', 'Kafa'] },
  { word: 'Didier Zokora', forbidden: ['Trabzonspor', 'Fildişi', 'Emre', 'Tekme', 'Orta Saha'] },
  { word: 'Ondrej Celustka', forbidden: ['Trabzonspor', 'Çekya', 'Inter', 'Gol', 'Defans'] },

  // Değişik / Spesifik Teknik Direktörler
  { word: 'Marcelo Bielsa', forbidden: ['El Loco', 'Arjantin', 'Kova', 'Taktik', 'Leeds'] },
  { word: 'Sam Allardyce', forbidden: ['Big Sam', 'İngiltere', 'Uzun Top', 'Kümede Kalma', 'Defansif'] },
  { word: 'Sean Dyche', forbidden: ['Burnley', 'Everton', 'Sert', 'Defansif', 'İngiliz'] },
  { word: 'Antonio Conte', forbidden: ['İtalya', '3-5-2', 'Juventus', 'Chelsea', 'Agresif'] },
  { word: 'Maurizio Sarri', forbidden: ['Sigara', 'İtalya', 'Napoli', 'Chelsea', 'Eşofman'] },
  { word: 'Zdenek Zeman', forbidden: ['Hücum', 'Sigara', 'Roma', 'Fenerbahçe', 'Merdiven'] },
  { word: 'Mircea Lucescu', forbidden: ['Galatasaray', 'Beşiktaş', 'Shakhtar', 'Romanya', 'Taktik'] },
  { word: 'Gordon Milne', forbidden: ['Beşiktaş', 'İngiliz', 'Şampiyon', 'Üst Üste', 'Metin Ali Feyyaz'] },
  { word: 'Jupp Derwall', forbidden: ['Galatasaray', 'Alman', 'Tesis', 'Devrim', 'Efsane'] },
  { word: 'Christoph Daum', forbidden: ['Fenerbahçe', 'Beşiktaş', 'Alman', 'Şampiyon', 'Pudra'] },
  { word: 'Zico', forbidden: ['Fenerbahçe', 'Brezilya', 'Beyaz Pele', 'Şampiyonlar Ligi', 'Çeyrek Final'] },
  { word: 'Ersun Yanal', forbidden: ['Fenerbahçe', 'Nisan', 'Hücum', 'Şampiyon', 'Trabzonspor'] },
  { word: 'Aykut Kocaman', forbidden: ['Fenerbahçe', 'Konyaspor', 'Forvet', 'Sistem', 'Koşu Mesafesi'] },
  { word: 'Sergen Yalçın', forbidden: ['Beşiktaş', 'Şampiyon', 'Sol Ayak', 'Yetenek', 'Teknik Direktör'] },
  { word: 'Rıza Çalımbay', forbidden: ['Sivasspor', 'Beşiktaş', 'Atom Karınca', 'Teknik Direktör', 'Anadolu'] },
  { word: 'Yılmaz Vural', forbidden: ['Anadolu', 'Agresif', 'Komik', 'Teknik Direktör', 'Kırmızı Kart'] },
  { word: 'Samet Aybaba', forbidden: ['Feda', 'Beşiktaş', 'Teknik Direktör', 'Altyapı', 'Kaptan'] },
  { word: 'Fatih Terim', forbidden: ['İmparator', 'Galatasaray', 'Milli Takım', 'UEFA', 'Fiorentina'] },
  { word: 'Mustafa Denizli', forbidden: ['Galatasaray', 'Fenerbahçe', 'Beşiktaş', 'Şampiyon', 'Sol Ayak'] },
  { word: 'Şenol Güneş', forbidden: ['Trabzonspor', 'Dünya Üçüncüsü', 'Beşiktaş', 'Kaleci', 'Milli Takım'] },
  
  // Eğlenceli Futbol Unsurları / Eşyaları
  { word: 'Meşale', forbidden: ['Tribün', 'Ateş', 'Kırmızı', 'Taraftar', 'Kutlama'] },
  { word: 'Krampon', forbidden: ['Ayakkabı', 'Çivi', 'Futbolcu', 'Giyer', 'Çim'] },
  { word: 'Tozluk', forbidden: ['Çorap', 'Bacak', 'Tekmelik', 'Uzun', 'Forma'] },
  { word: 'Tekmelik', forbidden: ['Bacak', 'Koruma', 'Tozluk', 'Kaval', 'Kemik'] },
  { word: 'Hakem Düdüğü', forbidden: ['Ses', 'Üflemek', 'Maç', 'Başlamak', 'Faul'] },
  { word: 'Yedek Kulübesi', forbidden: ['Oyuncu', 'Teknik Direktör', 'Oturmak', 'Değişiklik', 'Saha Kenarı'] }
];

let added = 0;
for (const word of newWords) {
  if (!words.find(w => w.word.toLowerCase() === word.word.toLowerCase())) {
    words.push(word);
    added++;
  }
}

fs.writeFileSync(wordsPath, JSON.stringify(words, null, 2));
console.log('Successfully added ' + added + ' words. Total is now ' + words.length);
