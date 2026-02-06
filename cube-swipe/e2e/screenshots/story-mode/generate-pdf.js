const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// Get all PNG files in numerical order
const pages = fs.readdirSync(__dirname)
  .filter(f => f.endsWith('.png'))
  .sort();

console.log('Found screenshots:', pages);

// Create PDF document with 1080x1080 size (square format)
const doc = new PDFDocument({
  size: [1080, 1080],
  margin: 0,
  autoFirstPage: false
});

// Output file path
const outputPath = path.join(__dirname, 'elvis-ai-showcase.pdf');
doc.pipe(fs.createWriteStream(outputPath));

// Add each page
pages.forEach((page, index) => {
  console.log(`Adding page ${index + 1}/${pages.length}: ${page}`);

  doc.addPage();
  const imagePath = path.join(__dirname, page);
  doc.image(imagePath, 0, 0, {
    width: 1080,
    height: 1080,
    align: 'center',
    valign: 'center'
  });
});

doc.end();

console.log('\n✅ PDF generated successfully!');
console.log(`📄 Output: ${outputPath}`);
console.log(`📊 Total pages: ${pages.length}`);
console.log('\nFile details:');
const stats = fs.statSync(outputPath);
console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
