// scripts/download-face-models.js
import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../public/models");

// Create public/models/ if it doesn't exist
fs.mkdirSync(outDir, { recursive: true });

// OFFICIAL & WORKING URL (correct repo)
const baseUrl = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights";

// ONLY THE 6 FILES THAT EXIST
const files = [
  "ssd_mobilenetv1_model-weights_manifest.json",
  "face_landmark_68_model-weights_manifest.json",
  "face_recognition_model-weights_manifest.json",
  "ssd_mobilenetv1_model-shard1.bin",
  "face_landmark_68_model-shard1.bin",
  "face_recognition_model-shard1.bin",
];

console.log("Downloading face-api.js models to public/models/...\n");

let pending = files.length;

// Final message
function done() {
  console.log("\nAll required models downloaded successfully!");
  console.log("Now run: npm run dev");
}

// Download each file
files.forEach((file) => {
  const url = `${baseUrl}/${file}`;
  const filePath = path.join(outDir, file);

  if (fs.existsSync(filePath)) {
    console.log(`Already exists: ${file}`);
    if (--pending === 0) done();
    return;
  }

  console.log(`Downloading: ${file}`);
  const writeStream = fs.createWriteStream(filePath);

  https
    .get(url, (res) => {
      if (res.statusCode !== 200) {
        console.error(`Failed: ${file} (HTTP ${res.statusCode})`);
        fs.unlinkSync(filePath); // delete partial file
        if (--pending === 0) done();
        return;
      }

      res.pipe(writeStream);

      writeStream.on("finish", () => {
        writeStream.close();
        console.log(`Saved: ${file}`);
        if (--pending === 0) done();
      });
    })
    .on("error", (err) => {
      console.error(`Error downloading ${file}: ${err.message}`);
      fs.unlinkSync(filePath);
      if (--pending === 0) done();
    });
});