const xlsx = require('xlsx');
const path = require('path');

const newItems = [
  // 13 Turkish Music Words - Batch 3 (Final)
  ["Orkestra", "Şef", "Senfoni", "Klasik Müzik", "Topluluk", "Enstrüman", "Terim", "Easy"],
  ["Şef", "Orkestra", "Baton", "Yönetmek", "Klasik Müzik", "Maestro", "Terim", "Medium"],
  ["Stüdyo", "Kayıt", "Albüm", "Mikrofon", "Kulaklık", "Aranjör", "Terim", "Easy"],
  ["Albüm", "Kaset", "CD", "Plak", "Şarkı", "Çıkarmak", "Terim", "Easy"],
  ["Klip", "Video", "Youtube", "Şarkı", "Çekmek", "Yönetmen", "Terim", "Easy"],
  ["Plak", "Pikap", "Eski", "Siyah", "İğne", "Müzik", "Terim", "Medium"],
  ["Konser", "Canlı", "Sahne", "Bilet", "Seyirci", "Şarkıcı", "Terim", "Easy"],
  ["Sahne", "Konser", "Işık", "Şarkıcı", "Tiyatro", "Perde", "Terim", "Easy"],
  ["Mikrofon", "Ses", "Şarkı", "Şarkıcı", "Söylemek", "Kablo", "Enstrüman", "Easy"],
  ["Kulaklık", "Dinlemek", "Müzik", "Kablo", "Bluetooth", "Kafa", "Terim", "Easy"],
  ["Amfi", "Ses", "Yükseltici", "Gitar", "Elektro", "Hoparlör", "Terim", "Medium"],
  ["Hoparlör", "Ses", "Müzik", "Kolon", "Kabin", "Çıkış", "Terim", "Easy"],
  ["Aranjör", "Düzenleme", "Müzik", "Ozan Çolakoğlu", "İskender Paydaş", "Stüdyo", "Terim", "Hard"]
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
