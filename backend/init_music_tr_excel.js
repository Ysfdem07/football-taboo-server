const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const csvPath = path.join(__dirname, 'music_tr_temp.csv');
const excelPath = path.join("C:\\Users\\ysfde\\OneDrive\\Desktop", 'music_tr.xlsx');

const csvContent = fs.readFileSync(csvPath, 'utf8');
const rows = csvContent.split('\n').map(row => row.split(',').map(cell => cell.replace(/\r/g, '').trim()));

const ws = xlsx.utils.aoa_to_sheet(rows);

// Ensure columns are properly sized
ws['!cols'] = [
  { wch: 20 }, // Word
  { wch: 20 }, // Clue 1
  { wch: 20 }, // Clue 2
  { wch: 20 }, // Clue 3
  { wch: 20 }, // Clue 4
  { wch: 20 }, // Clue 5
  { wch: 15 }, // Category
  { wch: 10 }  // Difficulty
];

const wb = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb, ws, "Music");

xlsx.writeFile(wb, excelPath);
console.log(`Created ${excelPath} with ${rows.length} rows.`);
