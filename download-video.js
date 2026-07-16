import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDir = path.join(__dirname, 'src', 'assets', 'videos');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const destPath = path.join(targetDir, 'school-hero.mp4');
const videoUrl = 'https://assets.mixkit.co/videos/35954/35954-1080.mp4';

console.log('Downloading video from:', videoUrl);

function download(url) {
  https.get(url, (res) => {
    if (res.statusCode === 301 || res.statusCode === 302) {
      console.log('Following redirect to:', res.headers.location);
      download(res.headers.location);
      return;
    }

    if (res.statusCode !== 200) {
      console.error(`Download failed with status code ${res.statusCode}`);
      return;
    }

    const fileStream = fs.createWriteStream(destPath);
    res.pipe(fileStream);

    fileStream.on('finish', () => {
      fileStream.close();
      const stats = fs.statSync(destPath);
      console.log(`Video successfully saved to ${destPath} (${stats.size} bytes)`);
    });
  }).on('error', (err) => {
    console.error('Download error:', err.message);
  });
}

download(videoUrl);
