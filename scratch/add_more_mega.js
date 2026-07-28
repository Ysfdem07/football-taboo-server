const fs = require('fs');

const words4 = [
  // Turkey 2nd League / Alt Lig
  { word: 'Gençlerbirliği', forbidden: ['Ankara', 'Kırmızı Kara', 'İlhan Cavcav', 'Başkent', 'Rüzgarlı'] },
  { word: 'Ankaraspor', forbidden: ['Başkent', 'Osmanlıspor', 'Mavi Beyaz', 'Ankara', 'Melih Gökçek'] },
  { word: 'Manisaspor', forbidden: ['Tarzanlar', 'Ege', 'Siyah Beyaz', 'Vestel', 'Arda Turan'] },
  { word: 'Adanaspor', forbidden: ['Toros Kaplanları', 'Turuncu Beyaz', 'Adana', 'Güney', 'Derbi'] },
  { word: 'Adana Demirspor', forbidden: ['Mavi Lacivert', 'Şimşekler', 'Adana', 'Güney', 'Balotelli'] },
  { word: 'Mersin İdman Yurdu', forbidden: ['Kırmızı Lacivert', 'Şeytanlar', 'Akdeniz', 'Tevfik Sırrı Gür', 'Mersin'] },
  { word: 'Diyarbakırspor', forbidden: ['Kırmızı Yeşil', 'Güneydoğu', 'Karpuz', 'Surları', 'Diyarbakır'] },
  { word: 'Kardemir Karabükspor', forbidden: ['Mavi Ateş', 'Kırmızı Mavi', 'Demir Çelik', 'Karadeniz', 'Karabük'] },
  { word: 'Orduspor', forbidden: ['Mor Beyaz', 'Menekşe', 'Karadeniz', 'Fındık', 'Hector Cuper'] },
  
  // Turkey Super Lig Refs / Executives
  { word: 'Ali Koç', forbidden: ['Başkan', 'Fenerbahçe', 'Zengin', 'Koç Holding', 'Seçim'] },
  { word: 'Dursun Özbek', forbidden: ['Galatasaray', 'Başkan', 'Otel', 'Sportif A.Ş.', 'Seçim'] },
  { word: 'Hasan Arat', forbidden: ['Beşiktaş', 'Başkan', 'Basketbol', 'Seçim', 'Yönetim'] },
  { word: 'Ahmet Nur Çebi', forbidden: ['Eski Başkan', 'Beşiktaş', 'Demirören', 'Yönetim', 'Trabzon'] },
  { word: 'Ertuğrul Doğan', forbidden: ['Trabzonspor', 'Başkan', 'Ağaoğlu', 'Bordo Mavi', 'Yönetim'] },
  { word: 'Aziz Yıldırım', forbidden: ['Eski Başkan', 'Fenerbahçe', 'Efsane', 'Hapis', 'Ali Koç'] },
  { word: 'Ali Şansalan', forbidden: ['Hakem', 'Düdük', 'Süper Lig', 'VAR', 'Karar'] },
  { word: 'Halil Umut Meler', forbidden: ['Hakem', 'Yumruk', 'Ankaragücü', 'Fifa', 'Süper Lig'] },
  { word: 'Cüneyt Çakır', forbidden: ['Eski Hakem', 'Fifa', 'Dünya Kupası', 'Efsane', 'Süper Lig'] },
  { word: 'Fırat Aydınus', forbidden: ['Eski Hakem', 'Yorumcu', 'Süper Lig', 'Mühendis', 'Derbi'] },
  
  // Famous European Refs / Execs
  { word: 'Pierluigi Collina', forbidden: ['Kel', 'Hakem', 'İtalyan', 'Efsane', 'Sert Bakış'] },
  { word: 'Florentino Perez', forbidden: ['Real Madrid', 'Başkan', 'Galacticos', 'Zengin', 'Süper Lig'] },
  { word: 'Joan Laporta', forbidden: ['Barcelona', 'Başkan', 'Messi', 'Katalan', 'Seçim'] },
  { word: 'Nasser Al-Khelaifi', forbidden: ['PSG', 'Başkan', 'Katar', 'Zengin', 'UEFA'] },
  
  // England 1st/2nd League Mix
  { word: 'Swansea City', forbidden: ['Galler', 'Kuğu', 'Beyaz', 'İngiltere', 'Michu'] },
  { word: 'Cardiff City', forbidden: ['Galler', 'Mavi Kuşlar', 'İngiltere', 'Kırmızı', 'Galler'] },
  { word: 'Stoke City', forbidden: ['Kırmızı Beyaz', 'Rüzgar', 'Soğuk', 'Britannia', 'Taç'] },
  { word: 'Bolton Wanderers', forbidden: ['Beyaz', 'Allardyce', 'Okocha', 'Anelka', 'Reebok'] },
  { word: 'Portsmouth', forbidden: ['Mavi', 'Güney', 'Fratton Park', 'Denizci', 'Kupa'] },
  { word: 'Charlton Athletic', forbidden: ['Kırmızı Beyaz', 'Londra', 'The Valley', 'Kılıç', 'Valley'] },
  { word: 'Derby County', forbidden: ['Koç', 'Siyah Beyaz', 'Pride Park', 'Rooney', 'Puan'] },
  { word: 'Reading', forbidden: ['Mavi Beyaz', 'Kraliyet', 'Madejski', 'Londra Yakını', 'Bisküvi'] },
  
  // French Ligue 1 / Ligue 2 Mix
  { word: 'Guingamp', forbidden: ['Kırmızı Siyah', 'Kupa', 'Bretanya', 'Drogba', 'Köy'] },
  { word: 'Bastia', forbidden: ['Mavi', 'Korsika', 'Ada', 'Ateşli', 'Olay'] },
  { word: 'Ajaccio', forbidden: ['Kırmızı Beyaz', 'Korsika', 'Ada', 'Ochoa', 'Güney'] },
  { word: 'Lorient', forbidden: ['Turuncu Siyah', 'Merlu', 'Suni Çim', 'Bretanya', 'Gourcuff'] },
  { word: 'Toulon', forbidden: ['Sarı Mavi', 'Rugby', 'Güney', 'Eski', 'Liman'] },
  
  // Spain La Liga / Segunda Mix
  { word: 'Deportivo La Coruna', forbidden: ['Mavi Beyaz', 'Galiçya', 'Riazor', 'Efsane', 'Şampiyon'] },
  { word: 'Malaga', forbidden: ['Mavi Beyaz', 'Endülüs', 'Rosaleda', 'Arap', 'Pellegrini'] },
  { word: 'Racing Santander', forbidden: ['Yeşil Beyaz', 'Kuzey', 'Cantabria', 'El Sardinero', 'Munitis'] },
  { word: 'Hercules', forbidden: ['Mavi Beyaz', 'Alicante', 'Trezeguet', 'Drenthe', 'Yunan'] },
  { word: 'Cadiz', forbidden: ['Sarı Lacivert', 'Endülüs', 'Ramon de Carranza', 'Sahil', 'Korsan'] },
  
  // Random Football Terms
  { word: 'Panenka', forbidden: ['Penaltı', 'Aşırtma', 'Ortaya', 'Zidane', 'Çek'] },
  { word: 'El Turco', forbidden: ['Galatasaray', 'İtalya', 'Arjantin', 'Lakap', 'Hasan Şaş'] }, // Example
  { word: 'Bikini Altı', forbidden: ['Beşlik', 'Bacak Arası', 'Çalım', 'Geçmek', 'Utanç'] },
  { word: 'Altı Pas', forbidden: ['Ceza Sahası', 'Küçük Kutu', 'Kaleci Alanı', 'Gol', 'Çizgi'] },
  { word: 'Santrafor', forbidden: ['Dokuz Numara', 'Golcü', 'Forvet', 'Hücum', 'En Uç'] },
  { word: 'Sağ Açık', forbidden: ['Kanat', 'Hücum', 'Orta', 'Çizgi', 'Yedi Numara'] },
  { word: 'Sol Açık', forbidden: ['Kanat', 'Hücum', 'On Bir Numara', 'Çizgi', 'Ters Ayak'] },
  { word: 'Kademeye Girmek', forbidden: ['Savunma', 'Arkaya Geçmek', 'Kapatmak', 'Yardım', 'Defans'] },
  { word: 'Pres', forbidden: ['Baskı', 'Rakip', 'Topu Almak', 'Koşmak', 'Yormak'] },
  { word: 'Kanat Değiştirmek', forbidden: ['Uzun Top', 'Ters', 'Oyun Yönü', 'Çizgi', 'Pas'] },
  { word: 'Oyunu Soğutmak', forbidden: ['Zaman Geçirmek', 'Yavaş', 'Skor', 'Yatmak', 'Pas'] },
  { word: 'Şampiyonlar Ligi Kupası', forbidden: ['Kulplu', 'Büyük Kulak', 'Avrupa', 'Kazanmak', 'Final'] },
  { word: 'Dünya Kupası', forbidden: ['Altın', 'Fifa', 'Dört Yıl', 'Milli Takım', 'Brezilya'] },
  { word: 'Avrupa Şampiyonası', forbidden: ['Euro', 'Milli Takım', 'Uefa', 'Kupa', 'Dört Yıl'] },
  { word: 'Altın Top', forbidden: ['Ballon dOr', 'Messi', 'Ronaldo', 'Ödül', 'Yılın En İyisi'] },
  { word: 'Altın Ayakkabı', forbidden: ['Gol Kralı', 'Avrupa', 'Ödül', 'Forvet', 'Atmak'] },
  { word: 'Puskas Ödülü', forbidden: ['En İyi Gol', 'Yılın Golü', 'Macar', 'Fifa', 'Güzel'] },
  
  // Tactical Jargon
  { word: 'Overlap', forbidden: ['Bindirme', 'Bek', 'Kanat', 'Arkadan Dolmak', 'Hücum'] },
  { word: 'Underlap', forbidden: ['İçten Bindirme', 'Bek', 'Orta Saha', 'Half Space', 'Guardiola'] },
  { word: 'Half Space', forbidden: ['İç Koridor', 'Taktik', 'De Bruyne', 'Boşluk', 'Orta Saha'] },
  { word: 'Geri Dörtlü', forbidden: ['Defans', 'Stoper', 'Bek', 'Savunma', 'Hat'] },
  { word: 'Pivot Santrafor', forbidden: ['Uzun Boylu', 'Duvar Olmak', 'Kafa Topu', 'İndirmek', 'Fizikli'] },
  { word: 'Fırsatçı Golcü', forbidden: ['İnzaghi', 'Altı Pas', 'Dokunuş', 'Takipçi', 'Sezgi'] },
  { word: 'Asimetrik Diziliş', forbidden: ['Taktik', 'Farklı', 'Kanat', 'Guardiola', 'Şaşırtmak'] }
];

const existing3 = JSON.parse(fs.readFileSync('./assets/data/words.json', 'utf8'));
const currentWords3 = new Set(existing3.map(w => w.word));
const uniqueNewWords3 = words4.filter(w => !currentWords3.has(w.word));
const finalWords3 = [...existing3, ...uniqueNewWords3];

fs.writeFileSync('./assets/data/words.json', JSON.stringify(finalWords3, null, 2));
console.log(`Added ${uniqueNewWords3.length} new words. Total is now ${finalWords3.length}`);
