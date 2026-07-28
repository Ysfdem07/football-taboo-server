const fs = require('fs');

const words2 = [
  // Italy Serie A Teams
  { word: 'Juventus', forbidden: ['Siyah Beyaz', 'Torino', 'Yaşlı Kadın', 'Zebra', 'Ronaldo'] },
  { word: 'AC Milan', forbidden: ['Kırmızı Siyah', 'San Siro', 'Şampiyonlar Ligi', 'İtalya', 'Maldini'] },
  { word: 'Inter', forbidden: ['Mavi Siyah', 'Milano', 'Giuseppe Meazza', 'Zanetti', 'İtalya'] },
  { word: 'Napoli', forbidden: ['Mavi Beyaz', 'Maradona', 'Güney', 'San Paolo', 'İtalya'] },
  { word: 'Roma', forbidden: ['Sarı Kırmızı', 'Olimpiyat', 'Kurt', 'Totti', 'Başkent'] },
  { word: 'Lazio', forbidden: ['Açık Mavi', 'Olimpiyat', 'Kartal', 'Roma', 'Derbi'] },
  { word: 'Atalanta', forbidden: ['Mavi Siyah', 'Bergamo', 'Gasperini', 'Hücum', 'İtalya'] },
  { word: 'Fiorentina', forbidden: ['Mor Menekşeler', 'Floransa', 'Artemio Franchi', 'Batistuta', 'İtalya'] },
  
  // Germany Bundesliga Teams
  { word: 'Bayern Münih', forbidden: ['Kırmızı Beyaz', 'Allianz Arena', 'Almanya', 'Bavyera', 'Şampiyon'] },
  { word: 'Borussia Dortmund', forbidden: ['Sarı Siyah', 'Signal Iduna Park', 'Sarı Duvar', 'Almanya', 'Ruhr'] },
  { word: 'Bayer Leverkusen', forbidden: ['Kırmızı Siyah', 'İlaç', 'Xabi Alonso', 'Yenilgisiz', 'Almanya'] },
  { word: 'RB Leipzig', forbidden: ['Kırmızı Boğalar', 'Red Bull', 'Doğu Almanya', 'Enerji İçeceği', 'Yeni'] },
  { word: 'Schalke 04', forbidden: ['Mavi Beyaz', 'Gelsenkirchen', 'Maden', 'Ruhr', 'Almanya'] },
  { word: 'Werder Bremen', forbidden: ['Yeşil Beyaz', 'Mızıkacılar', 'Almanya', 'Kuzey', 'Mesut Özil'] },
  { word: 'Stuttgart', forbidden: ['Kırmızı Beyaz', 'Mercedes', 'Almanya', 'Mario Gomez', 'Güney'] },
  
  // Legends
  { word: 'Pele', forbidden: ['Brezilya', 'Efsane', '10 Numara', 'Santos', 'Dünya Kupası'] },
  { word: 'Diego Maradona', forbidden: ['Arjantin', 'Napoli', 'Tanrının Eli', '10 Numara', 'Efsane'] },
  { word: 'Johan Cruyff', forbidden: ['Hollanda', 'Ajax', 'Barcelona', 'Total Futbol', '14 Numara'] },
  { word: 'Franz Beckenbauer', forbidden: ['Almanya', 'Kaiser', 'İmparator', 'Libero', 'Bayern Münih'] },
  { word: 'Ronaldo Nazario', forbidden: ['Brezilya', 'Fenomen', '9 Numara', 'Kel', 'Sakatlık'] },
  { word: 'Ronaldinho', forbidden: ['Brezilya', 'Gülümseme', 'Çalım', 'Barcelona', '10 Numara'] },
  { word: 'Zinedine Zidane', forbidden: ['Fransa', 'Kel', 'Kafa', 'Real Madrid', 'Efsane'] },
  { word: 'Thierry Henry', forbidden: ['Fransa', 'Arsenal', '14 Numara', 'Hızlı', 'Plase'] },
  { word: 'Andres Iniesta', forbidden: ['İspanya', 'Barcelona', 'Xavi', 'Pas', 'Dünya Kupası'] },
  { word: 'Xavi Hernandez', forbidden: ['İspanya', 'Barcelona', 'Pas', '8 Numara', 'Tiki Taka'] },
  { word: 'Paolo Maldini', forbidden: ['İtalya', 'Milan', 'Sol Bek', 'Efsane', '3 Numara'] },
  { word: 'Roberto Carlos', forbidden: ['Brezilya', 'Sol Bek', 'Frikik', 'Falso', 'Fenerbahçe'] },
  { word: 'Gianluigi Buffon', forbidden: ['İtalya', 'Kaleci', 'Juventus', 'Efsane', 'Eldiven'] },
  { word: 'Iker Casillas', forbidden: ['İspanya', 'Kaleci', 'Real Madrid', 'Kaptan', 'Aziz'] },
  { word: 'David Beckham', forbidden: ['İngiltere', 'Frikik', 'Manchester United', 'Real Madrid', 'Yakışıklı'] },
  { word: 'Francesco Totti', forbidden: ['İtalya', 'Roma', 'Kaptan', 'Gladyatör', '10 Numara'] },
  { word: 'Steven Gerrard', forbidden: ['İngiltere', 'Liverpool', 'Kaptan', '8 Numara', 'Kaymak'] },
  { word: 'Frank Lampard', forbidden: ['İngiltere', 'Chelsea', 'Uzaktan Şut', 'Orta Saha', '8 Numara'] },
  { word: 'Andrea Pirlo', forbidden: ['İtalya', 'Pas', 'Frikik', 'Juventus', 'Milan'] },
  { word: 'Kaka', forbidden: ['Brezilya', 'Milan', 'Hızlı', '22 Numara', 'Altın Top'] },
  { word: 'Alessandro Del Piero', forbidden: ['İtalya', 'Juventus', '10 Numara', 'Kaptan', 'Frikik'] },
  { word: 'Wayne Rooney', forbidden: ['İngiltere', 'Manchester United', '10 Numara', 'Forvet', 'Agresif'] },
  { word: 'Didier Drogba', forbidden: ['Fildişi Sahili', 'Chelsea', 'Galatasaray', 'Güçlü', 'Forvet'] },
  { word: 'Samuel Eto\'o', forbidden: ['Kamerun', 'Barcelona', 'Inter', 'Antalyaspor', 'Hızlı'] },
  { word: 'Zlatan Ibrahimovic', forbidden: ['İsveç', 'Gol', 'Tekvando', 'Ego', 'Milan'] },
  { word: 'Wesley Sneijder', forbidden: ['Hollanda', 'Galatasaray', 'Inter', '10 Numara', 'Uzaktan Şut'] },
  { word: 'Gheorghe Hagi', forbidden: ['Romanya', 'Galatasaray', 'Karpatların Maradonası', 'Sol Ayak', '10 Numara'] },
  { word: 'Alex de Souza', forbidden: ['Brezilya', 'Fenerbahçe', 'Heykel', 'Kaptan', '10 Numara'] },
  { word: 'Ricardo Quaresma', forbidden: ['Portekiz', 'Beşiktaş', 'Trivela', 'Rabona', 'Çalım'] },
  { word: 'Felipe Melo', forbidden: ['Brezilya', 'Galatasaray', 'Pitbull', 'Ön Libero', 'Agresif'] },
  
  // More concepts
  { word: 'Man-to-Man', forbidden: ['Adam Adama', 'Savunma', 'Taktik', 'Markaj', 'Takip'] },
  { word: 'Bölge Savunması', forbidden: ['Alan', 'Defans', 'Taktik', 'Kapatmak', 'Markaj'] },
  { word: 'Suni Çim', forbidden: ['Plastik', 'Saha', 'Zemin', 'Yeşil', 'Halı Saha'] },
  { word: 'Çim Saha', forbidden: ['Doğal', 'Yeşil', 'Zemin', 'Stadyum', 'Sulama'] },
  { word: 'Top Toplayıcı', forbidden: ['Çocuk', 'Kenar', 'Topu Vermek', 'Hızlı', 'Zaman'] },
  { word: 'Soyunma Odası', forbidden: ['Devre Arası', 'Taktik', 'Dolap', 'Forma', 'Maç Öncesi'] },
  { word: 'Taktik Tahtası', forbidden: ['Çizim', 'Mıknatıs', 'Hoca', 'Anlatmak', 'Soyunma Odası'] },
  { word: 'Kale Direği', forbidden: ['Üst', 'Yan', 'Çarpmak', 'Çizgi', 'Beyaz'] },
  { word: 'Kale Ağları', forbidden: ['File', 'Gol', 'Dalgalanmak', 'Yırtılmak', 'Top'] },
  { word: 'Santra', forbidden: ['Başlama Vuruşu', 'Orta Yuvarlak', 'Hakem Düdüğü', 'Maç Başı', 'Gol Sonrası'] },
  { word: 'Top Çizgiyi Geçti mi?', forbidden: ['Hakem', 'Gol Çizgisi Teknolojisi', 'İtiraz', 'VAR', 'Karar'] },
  { word: 'Aut', forbidden: ['Dışarı', 'Kaleci Vuruşu', 'Çizgi', 'Top', 'Kale Vuruşu'] },
  { word: 'Şampiyonlar Ligi Müziği', forbidden: ['Tüyler Ürpertici', 'Seremoni', 'Maç Öncesi', 'Avrupa', 'Marş'] },
  { word: 'Ziraat Türkiye Kupası', forbidden: ['Banka', 'Kupa', 'Eleme', 'Yerel', 'Sponsor'] },
  { word: 'Süper Kupa', forbidden: ['Şampiyonlar', 'Final', 'Tek Maç', 'Yazın', 'Kazanmak'] }
];

// Replicate logic to add lots of variations quickly to hit 500 total
// I will just add 300 more automatically by looping or adding dummy ones?
// Actually the user wants quality. I will generate 50 more high quality ones.
const words3 = [
  { word: 'Ters Köşe', forbidden: ['Kaleci', 'Penaltı', 'Yatırmak', 'Vuruş', 'Gol'] },
  { word: '90. Dakika', forbidden: ['Son Saniye', 'Gol', 'Uzatma', 'Bitiş', 'Düdük'] },
  { word: 'Son Dakika Golü', forbidden: ['Hayat Öpücüğü', 'Uzatma', 'Galibiyet', 'Heyecan', 'Maç Sonu'] },
  { word: 'Olimpik Gol', forbidden: ['Korner', 'Doğrudan', 'Köşe Vuruşu', 'Kaleci', 'Kavis'] },
  { word: 'Ölü Yaprak Vuruşu', forbidden: ['Cristiano Ronaldo', 'Juninho', 'Frikik', 'Top', 'Düşmek'] },
  { word: 'Rabona', forbidden: ['Quaresma', 'Bacak Arası', 'Vuruş', 'Orta', 'Çalım'] },
  { word: 'Sombrero', forbidden: ['Kafa Üstü', 'Aşırtma', 'Çalım', 'Ronaldinho', 'Brezilya'] },
  { word: 'Bacak Arası', forbidden: ['Çalım', 'Beşlik', 'Geçmek', 'Utanç', 'Top'] },
  { word: 'Çalım', forbidden: ['Geçmek', 'Hareket', 'Bilek', 'Yetenek', 'Brezilyalı'] },
  { word: 'Krampon Çivisi', forbidden: ['Alt', 'Demir', 'Kaymamak', 'Zemin', 'Ayakkabı'] },
  { word: 'Hakem Atışı', forbidden: ['Hava Topu', 'Düşmek', 'Oyun Durması', 'Eski Kural', 'Adil'] },
  { word: 'Fair Play', forbidden: ['Saygı', 'Dürüst', 'Topu Dışarı Atmak', 'Sakatlık', 'Centilmenlik'] },
  { word: 'Topu Dışarı Atmak', forbidden: ['Sakatlık', 'Fair Play', 'Taç', 'Duraklamak', 'Yere Düşmek'] },
  { word: 'Avantaja Bırakmak', forbidden: ['Hakem', 'Faul', 'Devam', 'Oyun', 'Düdük Çalmamak'] },
  { word: 'Endirekt Serbest Vuruş', forbidden: ['Çift Vuruş', 'Ceza Sahası İçi', 'Kaleciye Pas', 'Hakem', 'Kol Havada'] },
  { word: 'Kaleciye Geri Pas', forbidden: ['Elle Tutmak', 'Yasak', 'Ayak', 'Endirekt', 'Kural'] },
  { word: 'Baraj', forbidden: ['Frikik', 'Dokuz Metre', 'Zıplamak', 'Serbest Vuruş', 'Kurulmak'] },
  { word: 'Sprey', forbidden: ['Hakem', 'Beyaz', 'Köpük', 'Çizgi', 'Frikik'] },
  { word: 'Kura Parası', forbidden: ['Hakem', 'Yazı Tura', 'Kale Seçimi', 'Top Seçimi', 'Kaptanlar'] },
  { word: 'Kaptanlık Pazubendi', forbidden: ['Kol', 'Lider', 'Takım', 'Takmak', 'Arma'] },
  { word: 'Isınma Yeleği', forbidden: ['Yedek', 'Kenar', 'Antrenman', 'Renkli', 'Giyinmek'] },
  { word: 'Eşofman', forbidden: ['Takım', 'Yedek', 'Antrenman', 'Isınmak', 'Giyinmek'] },
  { word: 'Teknik Alan', forbidden: ['Çizgi', 'Hoca', 'Kenar', 'Çıkmak', 'Bağırmak'] },
  { word: 'Kulüp Doktoru', forbidden: ['Sağlık', 'Sakatlık', 'Saha', 'Çanta', 'Tedavi'] },
  { word: 'Masör', forbidden: ['Masaj', 'Kas', 'Kramp', 'Saha İçi', 'Rahatlatmak'] },
  { word: 'Kramp', forbidden: ['Kasılma', 'Bacak', 'Yere Düşmek', 'Yorgunluk', 'Germek'] },
  { word: 'Adale Yırtılması', forbidden: ['Sakatlık', 'Arka', 'Koşarken', 'Oyundan Çıkmak', 'Kopmak'] },
  { word: 'Çapraz Bağ', forbidden: ['Diz', 'Kopmak', 'Sakatlık', 'Altı Ay', 'Ameliyat'] },
  { word: 'Menisküs', forbidden: ['Diz', 'Sakatlık', 'Ameliyat', 'Futbolcu', 'Kıkırdak'] },
  { word: 'Ameliyat', forbidden: ['Sakatlık', 'Doktor', 'Hastane', 'Sezonu Kapatmak', 'Bıçak'] }
];

const totalNew = [...words2, ...words3];
const existing2 = JSON.parse(fs.readFileSync('./assets/data/words.json', 'utf8'));

const currentWords2 = new Set(existing2.map(w => w.word));
const uniqueNewWords2 = totalNew.filter(w => !currentWords2.has(w.word));

const finalWords2 = [...existing2, ...uniqueNewWords2];

fs.writeFileSync('./assets/data/words.json', JSON.stringify(finalWords2, null, 2));

console.log(`Added ${uniqueNewWords2.length} new words. Total is now ${finalWords2.length}`);
