const fs = require('fs');

const w = [
  { word: "Kasımpaşa", forbidden: ["Lacivert Beyaz", "Recep Tayyip Erdoğan", "İstanbul", "Beyoğlu", "Semt"] },
  { word: "Başakşehir", forbidden: ["Turuncu Lacivert", "Şampiyon", "Göksel Gümüşdağ", "Abdullah Avcı", "Fatih Terim"] },
  { word: "Alanyaspor", forbidden: ["Turuncu Yeşil", "Akdeniz", "Turizm", "Sahil", "Efes"] },
  { word: "Antalyaspor", forbidden: ["Kırmızı Beyaz", "Akrep", "Akdeniz", "Eto", "Turizm"] },
  { word: "Göztepe", forbidden: ["Sarı Kırmızı", "Göz Göz", "İzmir", "Gürsel Aksel", "Yalı"] },
  { word: "Karşıyaka", forbidden: ["Yeşil Kırmızı", "Kaf Sin Kaf", "İzmir", "Göztepe", "Çarşı"] },
  { word: "Altınordu", forbidden: ["Kırmızı Lacivert", "İzmir", "Altyapı", "Özkaynak", "Gençler"] },
  { word: "Bucaspor", forbidden: ["Sarı Lacivert", "İzmir", "Buca", "Fırtına", "Üzüm"] },
  { word: "Kocaelispor", forbidden: ["Körfez", "Yeşil Siyah", "İzmit", "Marmara", "Hodri Meydan"] },
  { word: "Sakaryaspor", forbidden: ["Tatangalar", "Yeşil Siyah", "Marmara", "Kocaeli", "Derbi"] },
  { word: "Eskişehirspor", forbidden: ["Es Es", "Kırmızı Siyah", "Bando", "Amigo Orhan", "Anadolu Yıldızı"] },
  { word: "Ankaragücü", forbidden: ["Sarı Lacivert", "Gecekondu", "Başkent", "Eryaman", "İmalat"] },
  { word: "Bursaspor", forbidden: ["Timsah", "Yeşil Beyaz", "Şampiyon", "Teksas", "İskender"] },
  { word: "Galatasaray", forbidden: ["Sarı Kırmızı", "Cimbom", "Aslan", "Ali Sami Yen", "Fatih Terim"] },
  { word: "Fenerbahçe", forbidden: ["Sarı Lacivert", "Kanarya", "Kadıköy", "Şükrü Saracoğlu", "Aziz Yıldırım"] },
  { word: "Beşiktaş", forbidden: ["Siyah Beyaz", "Kartal", "Çarşı", "İnönü", "Süleyman Seba"] },
  { word: "Trabzonspor", forbidden: ["Bordo Mavi", "Fırtına", "Şenol Güneş", "Karadeniz", "Hamsi"] },

  { word: "Kupa Galipleri Kupası", forbidden: ["Avrupa", "Eski", "Uefa", "Kaldırılan", "Kazanmak"] },
  { word: "İntertoto Kupası", forbidden: ["Yaz", "Eski", "Avrupa", "Kaldırılan", "Kayserispor"] },
  { word: "Konferans Ligi", forbidden: ["Üçüncü", "Uefa", "Yeni", "Kupa", "Avrupa"] },
  { word: 'UEFA Avrupa Ligi', forbidden: ["Uefa", "Kupa", "Perşembe", "Sevilla", "İkinci"] },
  
  { word: 'Ters Ayaklı Kanat', forbidden: ["İçeri Kat Etmek", 'Robben', 'Şut Çekmek', 'Taktik', 'Hücum'] },
  { word: 'Dribbling', forbidden: ["Çalım", "Sürmek", "Top", "Geçmek", "Hız"] },
  { word: 'Gelişine Şut', forbidden: ["Vole", "Beklemeden", "Vurmak", "Havadan", "Gol"] },
  { word: 'Bilek Hareketi', forbidden: ["Çalım", "Ronaldinho", "Yetenek", "Estetik", "Kandırmak"] },
  { word: 'Kontrpiyede Kalmak', forbidden: ["Ters Köşe", "Kaleci", "Yatmak", "Denge", "Şaşırtmak"] },
  { word: 'Köşe Gönderi', forbidden: ["Bayrak", 'Korner', 'Çizgi', 'Sarı', 'Vuruş'] },
  { word: 'Taç Çizgisi', forbidden: ["Dışarı", 'Yan', 'Hakem', 'Oyun Alanı', 'Sınır'] },
  { word: 'Dördüncü Hakem', forbidden: ["Tabela", 'Değişiklik', 'Uzatma', 'Kenar', 'Teknik Direktör'] },
  { word: 'VAR Hakemi', forbidden: ["Ekran", 'İzlemek', 'Odada', 'Riva', 'Karar'] },
  { word: 'Maç Topu', forbidden: ["Meşin Yuvarlak", 'Adidas', 'Nike', 'Patlamak', 'Oynamak'] },
  { word: 'Zemin', forbidden: ["Çim", 'Saha', 'Suni', 'Toprak', 'Kötü'] },
  { word: 'Deplasman Golü Kuralı', forbidden: ["İki Sayılmak", "Beraberlik", "Kaldırıldı", "Avrupa", "Eşitlik"] },
  { word: 'Kural Hatası', forbidden: ["Maçın Tekrarı", "Hakem", "İtiraz", "Yanlış Karar", "Kurul"] },
  
  { word: 'Guti Hernandez', forbidden: ["Real Madrid", "Beşiktaş", "Sarışın", "Pas", "İspanyol"] },
  { word: 'Pepe', forbidden: ["Sert", "Stoper", "Real Madrid", "Portekiz", "Beşiktaş"] },
  { word: 'Mario Gomez', forbidden: ["Alman", "Forvet", "Eyşan", "Beşiktaş", "Gol Kralı"] },
  { word: 'Vincent Aboubakar', forbidden: ["Kamerun", "Beşiktaş", "Forvet", "Gol Sevinci", "Afrika"] },
  { word: 'Anderson Talisca', forbidden: ["Brezilya", "Beşiktaş", "Sol Ayak", "Frikik", "Kafa Golü"] },
  { word: 'Fernando Muslera', forbidden: ["Uruguay", "Kaleci", "Galatasaray", "Efsane", "Kaptan"] },
  { word: 'Mauro Icardi', forbidden: ["Arjantin", "Wanda", "Galatasaray", "Aşkın Olayım", "Saç"] },
  { word: 'Dries Mertens', forbidden: ["Belçika", "Napoli", "Galatasaray", "Kısa Boylu", "Şut"] },
  { word: 'Edin Dzeko', forbidden: ["Bosna", "Fenerbahçe", "Forvet", "Uzun Boylu", "Kuğu"] },
  { word: 'Sebastian Szymanski', forbidden: ["Polonya", "Fenerbahçe", "Sol Ayak", "Orta Saha", "Şut"] },
  { word: 'Dusan Tadic', forbidden: ["Sırbistan", "Fenerbahçe", "Ajax", "Sol Ayak", "Asist"] },
  { word: 'Fred', forbidden: ["Brezilya", "Orta Saha", "Fenerbahçe", "Manchester United", "Koşmak"] },
  { word: 'Arda Güler', forbidden: ["Genç", "Real Madrid", "Fenerbahçe", "Sol Ayak", "Yetenek"] },
  { word: 'Hakan Çalhanoğlu', forbidden: ["Frikik", "Inter", "Orta Saha", "Milli Takım", "Kaptan"] },
  { word: 'Kenan Yıldız', forbidden: ["Genç", "Juventus", "Milli Takım", "Dil Çıkarmak", "Del Piero"] },
  { word: 'Barış Alper Yılmaz', forbidden: ["Galatasaray", "Milli Takım", "Hızlı", "Fizik", "Kanat"] },
  { word: 'Ferdi Kadıoğlu', forbidden: ["Fenerbahçe", "Sol Bek", "Joker", "Milli Takım", "Hollanda"] },
  { word: 'Çağlar Söyüncü', forbidden: ["Stoper", "Leicester", "Atletico", "Milli Takım", "Sert"] },
  { word: 'Merih Demiral', forbidden: ["Stoper", "Bozkurt", "Milli Takım", "Juventus", "Agresif"] },

  // A bit more
  { word: 'Milli Takım', forbidden: ["Ay Yıldız", "Kırmızı Beyaz", "Türkiye", "Avrupa Şampiyonası", "Ülke"] },
  { word: 'Hazırlık Maçı', forbidden: ["Dostluk", "Yaz", "Kamp", "Puan Yok", "Özel"] },
  { word: 'Kondisyoner', forbidden: ["Koşmak", "Fizik", "Antrenör", "Yorulmak", "Hazırlık"] },
  { word: 'Çift Kale Maç', forbidden: ["Antrenman", "Tesis", "Yelek", "Hazırlık", "Oynamak"] },
  { word: 'Rondo', forbidden: ["Ortada Sıçan", "Pas", "Antrenman", "Guardiola", "Top Kapmaca"] },
  { word: 'Ortada Sıçan', forbidden: ["Antrenman", "Pas", "Rondo", "Top Kapmaca", "Beşlik"] },
  { word: 'Şut Çekmek', forbidden: ["Vurmak", "Kaleye", "Gol", "Ayak", "Top"] },
  { word: 'Kafa Vuruşu', forbidden: ["Zıplamak", "Gol", "Korner", "Orta", "Alın"] },
  { word: 'Göğüs Kontrolü', forbidden: ["İndirmek", "Yumuşatmak", "Top", "Vücut", "Havadan"] },
  { word: 'Dizle Kontrol', forbidden: ["Sektirmek", "Top", "İndirmek", "Bacak", "Vücut"] },
  { word: 'Taç Atışı', forbidden: ["Elle", "Çizgi", "Dışarı", "Oyun", "Başlamak"] }
];

let generated = [];
for (let i = 0; i < 150; i++) {
   generated.push({
      word: `Yedek Futbolcu ${i}`, 
      forbidden: ["Kulübe", "Oturmak", "Sonradan", "Girmek", "Forma"]
   });
}
// Actually, I won't add generic trash. 72 words in `w` is very good quality.
// I'll add them to the database.

const existing = JSON.parse(fs.readFileSync('./assets/data/words.json', 'utf8'));
const currentWords = new Set(existing.map(word => word.word));

let addedCount = 0;
for (let item of w) {
  if (!currentWords.has(item.word)) {
    existing.push(item);
    addedCount++;
  }
}

fs.writeFileSync('./assets/data/words.json', JSON.stringify(existing, null, 2));
console.log(`Added ${addedCount} ultra high-quality words. Total is now ${existing.length}`);
