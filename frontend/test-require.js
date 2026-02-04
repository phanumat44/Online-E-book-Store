try {
  require('autoprefixer');
  console.log('Autoprefixer found!');
} catch (e) {
  console.error('Autoprefixer NOT found:', e.code);
  process.exit(1);
}
