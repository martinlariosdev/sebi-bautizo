#!/usr/bin/env node
import QRCode from "qrcode";

export async function generateQr(url, outputPath) {
  await QRCode.toFile(outputPath, url, {
    width: 1024,
    margin: 2,
  });
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;

if (isMain) {
  const url = process.argv[2];
  const outputPath = process.argv[3] ?? "qr.png";

  if (!url) {
    console.error("Usage: node scripts/generate-qr.mjs <url> [output-path]");
    process.exit(1);
  }

  await generateQr(url, outputPath);
  console.log(`QR code for ${url} written to ${outputPath}`);
}
