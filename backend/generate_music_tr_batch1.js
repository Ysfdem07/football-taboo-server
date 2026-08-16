const xlsx = require('xlsx');
const path = require('path');

const newItems = [
  // 140 Turkish Music Words - Batch 1
  // Arabesk & Fantezi
  ["Müslüm Gürses", "Paramparça", "Jilet", "Baba", "Arabesk", "Müslüm", "Arabesk", "Easy"],
  ["İbrahim Tatlıses", "İmparator", "Urfa", "Çiğ Köfte", "İbo Show", "Mavi Mavi", "Arabesk", "Easy"],
  ["Orhan Gencebay", "Bence Benimsin", "Hatasız Kul Olmaz", "Batsın Bu Dünya", "Saz", "Arabesk", "Arabesk", "Medium"],
  ["Ferdi Tayfur", "Çeşme", "Ferdici", "Hadi Gel Köyümüze Geri Dönelim", "Emmioğlu", "Arabesk", "Arabesk", "Medium"],
  ["Hakkı Bulut", "İkimiz Bir Fidanız", "Son Mektup", "Kaset", "Arabesk", "Bestekar", "Arabesk", "Hard"],
  ["Ebru Gündeş", "Araftayım", "Fırtınalar", "O Ses Türkiye", "Çingenem", "Fantezi", "Arabesk", "Easy"],
  ["Sibel Can", "Kanasın", "Padişah", "Berivan", "Dans", "Fantezi", "Arabesk", "Medium"],
  ["Alişan", "Aynalı Tahir", "Varyemez", "Cennet Mahallesi", "Türkü", "Fantezi", "Arabesk", "Medium"],
  ["Bülent Ersoy", "Diva", "Sanat Müziği", "Popstar", "Ablan Kurban Olsun", "Fantezi", "Arabesk", "Easy"],
  ["Cengiz Kurtoğlu", "Liselim", "Gelin Olmuş Gidiyorsun", "Küllenen Aşk", "Taverna", "Arabesk", "Arabesk", "Medium"],
  ["Ümit Besen", "Islak Mendil", "Nikah Masası", "Piyano", "Taverna", "I Love You", "Arabesk", "Medium"],
  ["Arif Sağ", "Bağlama", "Usta", "Türkü", "Alevi", "Halk Müziği", "Türkü", "Hard"],
  ["Musa Eroğlu", "Bağlama", "Türkü", "Mihriban", "Halil İbrahim", "Halk Müziği", "Türkü", "Medium"],
  ["Neşet Ertaş", "Kırşehir", "Gönül Dağı", "Zahidem", "Yalan Dünya", "Bozkırın Tezenesi", "Türkü", "Easy"],
  ["Selda Bağcan", "Adaletin Bu Mu Dünya", "Uğurlar Olsun", "Gesi Bağları", "Sivas", "Özgün Müzik", "Türkü", "Medium"],
  ["Edip Akbayram", "Hasretinle Yandı Gönlüm", "Aldırma Gönül", "Güzel Günler Göreceğiz", "Barış", "Özgün Müzik", "Türkü", "Medium"],
  ["Zülfü Livaneli", "Leylim Ley", "Yiğidim Aslanım", "Güneş Topla Benim İçin", "Yazar", "Özgün Müzik", "Türkü", "Medium"],
  ["Ahmet Kaya", "Kum Gibi", "Kendine İyi Bak", "Şafak Türküsü", "Penceresiz Kaldım Anne", "Özgün Müzik", "Arabesk", "Easy"],
  ["Yıldız Tilbe", "Çabuk Olalım Aşkım", "Delikanlım", "Vazgeçtim", "Kandıramazsın Beni", "Şarkı Sözü", "Pop", "Easy"],
  
  // Pop
  ["Sezen Aksu", "Minik Serçe", "Gülümse", "Firuze", "Sen Ağlama", "Şarkı Sözü", "Pop", "Easy"],
  ["Tarkan", "Megastar", "Kuzu Kuzu", "Şımarık", "Dudu", "Oynama Şıkıdım", "Pop", "Easy"],
  ["Sertab Erener", "Everyway That I Can", "Eurovision", "Zor Kadın", "Aşk", "Soprano", "Pop", "Medium"],
  ["Mustafa Sandal", "Musti", "İsyankar", "Araba", "Aya Benzer", "Pop", "Pop", "Easy"],
  ["Kenan Doğulu", "Beren Saat", "Yaparım Bilirsin", "Çakkıdı", "Eurovision", "Pop", "Pop", "Medium"],
  ["Gülşen", "Bangır Bangır", "Dan Dan", "Be Adam", "Yurtta Aşk Cihanda Aşk", "Pop", "Pop", "Medium"],
  ["Hande Yener", "Romeo", "Kırmızı", "Naber", "Bodrum", "Elektronik Pop", "Pop", "Medium"],
  ["Demet Akalın", "Giderli", "Pırlanta", "Türkan", "Evli Mutlu Çocuklu", "Pop", "Pop", "Easy"],
  ["Serdar Ortaç", "Karabiberim", "Dansçı", "Beni Unut", "Poşet", "Pop", "Pop", "Easy"],
  ["Murat Boz", "O Ses Türkiye", "Janti", "Uçurum", "Özledim", "Pop", "Pop", "Medium"],
  ["Edis", "Çok Çok", "Benim Ol", "Roman", "Martılar", "Dans", "Pop", "Medium"],
  ["Zeynep Bastık", "Uslanmıyor Bu", "Lan", "Akustik", "Youtube", "Cover", "Pop", "Easy"],
  ["Mabel Matiz", "Karakol", "Fırtınadayım", "Antidepresan", "Sarmaşık", "Alternatif", "Pop", "Medium"],
  ["Aleyna Tilki", "O Sen Olsan Bari", "Cevapsız Çınlama", "Sen Olsan Bari", "Genç", "Yetenek Sizsiniz", "Pop", "Easy"],
  ["Hadise", "O Ses Türkiye", "Şampiyon", "Düm Tek Tek", "Farkımız Var", "Belçika", "Pop", "Easy"],
  ["Simge", "Miş Miş", "Aşkın Olayım", "Yankı", "Üzülmedin Mi", "Pop", "Pop", "Medium"],
  ["Ece Seçkin", "Aman Aman", "Hoşuna Mı Gidiyor", "Adeyyo", "Dibine Dibine", "Pop", "Pop", "Hard"],
  ["Oğuzhan Koç", "Çok Güzel Hareketler", "Bulutlara Esir Olduk", "Küsme Aşka", "Giden Günlerim Oldu", "Pop", "Medium"],
  ["İrem Derici", "Kalbimin Tek Sahibine", "Dantel", "Zorun Ne Sevgilim", "O Ses Türkiye", "Pop", "Pop", "Medium"],
  ["Gökhan Tepe", "Veda Makamı", "Yürü Yüreğim", "Teşekkür Ederim", "Beste", "Pop", "Pop", "Hard"],
  ["Emre Aydın", "Afili Yalnızlık", "Kim Dokunduysa Sana Ona Git", "Hoşçakal", "Soğuk Odalar", "Rock", "Rock", "Medium"],
  
  // Rock & Bands
  ["Barış Manço", "Gülpembe", "Adam Olacak Çocuk", "Japonya", "Dönence", "Anadolu Rock", "Rock", "Easy"],
  ["Cem Karaca", "Tamirci Çırağı", "Islak Islak", "Resimdeki Gözyaşları", "Moğollar", "Anadolu Rock", "Rock", "Medium"],
  ["Erkin Koray", "Fesuphanallah", "Çöpçüler", "Arap Saçı", "Elektro Bağlama", "Anadolu Rock", "Rock", "Hard"],
  ["Teoman", "Paramparça", "Renkli Rüyalar Oteli", "Onaltı Yaşındasın", "Gönülçelen", "Rock", "Rock", "Easy"],
  ["Şebnem Ferah", "Sil Baştan", "Mayın Tarlası", "Yağmurlar", "Bu Aşk Fazla Sana", "Vokal", "Rock", "Easy"],
  ["Mor ve Ötesi", "Bir Derdim Var", "Cambaz", "Araf", "Eurovision", "Rock Grubu", "Rock", "Medium"],
  ["Duman", "Kaan Tangöze", "Seni Kendime Sakladım", "Her Şeyi Yak", "Bu Akşam", "Rock Grubu", "Rock", "Easy"],
  ["Manga", "Eurovision", "Bir Kadın Çizeceksin", "Bitti Rüya", "Dünyanın Sonuna Doğmuşum", "Rock Grubu", "Rock", "Medium"],
  ["Athena", "Gökhan Özoğuz", "Serseri Mayın", "For Real", "Holigan", "Punk Rock", "Rock", "Medium"],
  ["Gripin", "Böyle Kahpedir Dünya", "Aşk Nereden Nereye", "Durma Yağmur Durma", "Rock Grubu", "Biyoloji", "Rock", "Medium"],
  ["Seksendört", "Ölürüm Hasretinle", "Anlayamazsın", "Kendime Yalan Söyledim", "Ankara", "Rock Grubu", "Rock", "Hard"],
  ["Pinhani", "Hele Bi Gel", "Kavak Yelleri", "Beni Sen İnandır", "Bilir O Beni", "Alternatif", "Rock", "Medium"],
  ["Yüzyüzeyken Konuşuruz", "Dinle Beni Bi", "Bodrum", "Ne Farkeder", "Boş Gemiler", "Bağımsız", "Alternatif", "Medium"],
  ["Adamlar", "Koca Yaşlı Şişko Dünya", "Zombiler", "Acının İlacı", "Hikaye", "Alternatif", "Alternatif", "Medium"],
  ["Büyük Ev Ablukada", "Güneş Yerinde", "Hoppalpa", "Afilli Yalnızlık", "Bartu Küçükçağlayan", "Alternatif", "Alternatif", "Hard"],
  ["Kargo", "Yıldızların Altında", "Renklerin İçinde", "Ateş ve Su", "Koray Candemir", "Rock", "Rock", "Hard"],
  ["Zakkum", "Anason", "Gökyüzünde", "Ben Ne Yangınlar Gördüm", "Ankara", "Rock", "Rock", "Medium"],
  ["Gece Yolcuları", "Meyhaneler Sen", "Unut Beni", "Neden", "Rock Grubu", "Romantik", "Rock", "Hard"],
  
  // Rap / Hip-Hop
  ["Ceza", "Fark Var", "Holocaust", "Rap", "Hızlı", "Yerli Plaka", "Rap", "Easy"],
  ["Sagopa Kajmer", "Kötü İnsanları Tanıma Senesi", "Neyim Var Ki", "Galiba", "Bir Pesimistin Gözyaşları", "Rap", "Rap", "Easy"],
  ["Ezhel", "Geceler", "Felaket", "Alo", "Autotune", "Ankara", "Rap", "Medium"],
  ["Murda", "Aya", "Güneşi Gülüşüne", "Ezhel", "Hollanda", "Rap", "Rap", "Medium"],
  ["Ben Fero", "Orman Kanunları", "Demet Akalın", "Biladerim İçin", "Kel", "Kaslı", "Rap", "Medium"],
  ["Killa Hakan", "Kreuzberg", "Fight Kulüp", "Almanya", "Bandana", "Gözlük", "Rap", "Medium"],
  ["Massaka", "Almanya", "Kabus", "Maske", "Hardcore", "Rap", "Rap", "Hard"],
  ["Uzi", "Krvn", "Umrumda Değil", "Makina", "Güngören", "Rap", "Rap", "Medium"],
  ["Çakal", "Mahvettim", "İmdat", "Lütfen", "Reckol", "Rap", "Rap", "Medium"],
  ["Reckol", "İstediğim Olacak", "Çakal", "Perros Blancos", "Rap", "Yeni Nesil", "Rap", "Hard"],
  ["Lvbel C5", "Aynen", "10 Numara", "Ralli", "Dacia", "Rap", "Rap", "Medium"],
  ["Sefo", "Bilmem Mi", "Isabelle", "Tutsak", "Reggaeton", "Rap", "Rap", "Medium"],
  ["Gazapizm", "Heyecanı Yok", "Çukur", "Unutulacak Dünler", "İzmir", "Ölüler Dirilerden Çalacak", "Rap", "Medium"],
  ["Anıl Piyancı", "İzmir", "Sokak Çocuğu", "Kafa10", "Yeşil Oda", "Rap", "Rap", "Hard"],
  ["Norm Ender", "Mekanın Sahibi", "Çıktık Yine Yollara", "Eksik Etek", "Rap", "Diss", "Rap", "Medium"],
  ["Şanışer", "Susamam", "Günleri Geride Bırak", "Ludovico", "Rap", "Nakarat", "Rap", "Medium"],
  ["Patron", "Goal", "Manzaralar", "PMC", "Rap", "Saian", "Rap", "Medium"],
  ["Allâme", "Fareli Köyün Kavalcısı", "Batarya", "Joker", "Eskişehir", "Rap", "Rap", "Hard"],
  ["Joker", "Yaşamak Öldürür", "Eskişehir", "Battle", "Allâme", "Rap", "Rap", "Hard"],
  ["Hidra", "Ölüme İnat", "Yenilmez", "Beyaz Diş", "Freestyle", "Rap", "Rap", "Hard"],
  ["Contra", "Ölü", "Kibir", "Ters Yön", "İsmail", "Rap", "Rap", "Medium"],
  ["Khontkar", "Sürtüğe Bak", "RedKeys", "Trap", "Pembe Saç", "İzmir", "Rap", "Medium"],
  ["Server Uraz", "Pit10", "Akbabalar", "Yara", "Epidemik", "Rap", "Rap", "Hard"],
  ["Fuat Ergin", "Okyanuslar", "Pusula", "Almanya", "Jüri", "Rap", "Rap", "Hard"],
  
  // Sanat Müziği
  ["Zeki Müren", "Sanat Güneşi", "Paşa", "Manolya", "Mücevher", "Bodrum", "Sanat", "Easy"],
  ["Müzeyyen Senar", "Cumhuriyetin Divası", "Atatürk", "Benzemez Kimse Sana", "Rakı", "Sanat", "Sanat", "Medium"],
  ["Bülent Ersoy", "Diva", "Popstar", "Şöhret", "Sanat Müziği", "Gösterişli", "Sanat", "Medium"], // Intentionally slightly different clue array
  ["Emel Sayın", "Mavi Boncuk", "Gülizar", "Tarık Akan", "Yeşilçam", "Sanat", "Sanat", "Medium"],
  ["Zekai Tunca", "Gülü Susuz", "İmkansız", "Beste", "Sanat", "Ud", "Sanat", "Hard"],
  ["Ahmet Özhan", "Tasavvuf", "Mevlana", "İlahi", "Sanat", "Klasik", "Sanat", "Medium"],
  ["Safiye Ayla", "Atatürk", "Çile Bülbülüm Çile", "Cumhuriyet", "Sanat", "Taş Plak", "Sanat", "Hard"],
  ["Hamiyet Yüceses", "Makber", "Taş Plak", "Sanat", "Ses", "Gazino", "Sanat", "Hard"],
  
  // Enstrümanlar & Terimler
  ["Bağlama", "Saz", "Türkü", "Mızrap", "Anadolu", "Aşık", "Enstrüman", "Easy"],
  ["Darbuka", "Ritim", "Vurmalı", "Oryantal", "Roman", "Düm Tek", "Enstrüman", "Easy"],
  ["Kemence", "Karadeniz", "Yaylı", "Tulum", "Horon", "Trabzon", "Enstrüman", "Medium"],
  ["Zurna", "Davul", "Halay", "Nefesli", "Düğün", "Yüksek Ses", "Enstrüman", "Easy"],
  ["Ud", "Sanat Müziği", "Telli", "Mızrap", "Fasıl", "Göbekli", "Enstrüman", "Medium"],
  ["Kanun", "Sanat Müziği", "Telli", "Mızrap", "Diz Üstü", "Yüzük", "Enstrüman", "Hard"],
  ["Ney", "Tasavvuf", "Mevlana", "Üflemeli", "Kamış", "Hüzünlü", "Enstrüman", "Medium"],
  ["Klarnet", "Hüsnü Şenlendirici", "Roman", "Nefesli", "Taksim", "Siyah", "Enstrüman", "Medium"],
  ["Tulum", "Karadeniz", "Nefesli", "Kemençe", "Horon", "Şişirme", "Enstrüman", "Medium"],
  ["Davul", "Zurna", "Tokmak", "Vurmalı", "Halay", "Ramazan", "Enstrüman", "Easy"],
  ["Halay", "Düğün", "Mendil", "Davul", "Zurna", "Kol Kola", "Terim", "Easy"],
  ["Horon", "Karadeniz", "Kemençe", "Hızlı", "Oyun", "Trabzon", "Terim", "Medium"],
  ["Zeybek", "Ege", "Efe", "Diz Vurma", "Ağır", "İzmir", "Terim", "Medium"],
  ["Fasıl", "Rakı", "Meze", "Sanat Müziği", "Ud", "Kanun", "Terim", "Medium"],
  ["Arabesk", "Acı", "Kader", "Müslüm Gürses", "Damar", "Minibüs", "Terim", "Easy"],
  ["Türkü", "Halk", "Bağlama", "Aşık", "Anonim", "Yöre", "Terim", "Easy"],
  ["Beste", "Söz", "Müzik", "Şarkı", "Yaratmak", "Nota", "Terim", "Medium"],
  ["Nakarat", "Şarkı", "Tekrar", "Bölüm", "Koro", "Eşlik Etmek", "Terim", "Medium"],
  ["Solist", "Şarkıcı", "Vokal", "Ön Planda", "Mikrofon", "Grup", "Terim", "Medium"],
  ["Vokal", "Ses", "Şarkı", "Arka", "Eşlik", "Koro", "Terim", "Hard"]
];

const existingFile = path.join("C:\\\\Users\\\\ysfde\\\\OneDrive\\\\Desktop", 'music_tr.xlsx');
const wb = xlsx.readFile(existingFile);
const ws = wb.Sheets["Music"];

const existingData = xlsx.utils.sheet_to_json(ws, {header: 1});
const combinedData = existingData.concat(newItems);

const newWs = xlsx.utils.aoa_to_sheet(combinedData);
newWs['!cols'] = ws['!cols'];
wb.Sheets["Music"] = newWs;

try {
  xlsx.writeFile(wb, existingFile);
  console.log('Successfully appended! Total rows: ' + combinedData.length);
} catch (e) {
  console.error(e);
}
