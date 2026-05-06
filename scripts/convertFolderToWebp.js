import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".bmp",
  ".tiff",
  ".webp",
]);

async function walkDirectory(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkDirectory(fullPath)));
      continue;
    }
    if (entry.isFile()) files.push(fullPath);
  }

  return files;
}

async function convertFileToWebp(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const dir = path.dirname(filePath);
  const baseName = path.basename(filePath, ext);
  const targetPath = path.join(dir, `${baseName}.webp`);
  const tempOutputPath = path.join(
    dir,
    `${baseName}.tmp-${Date.now()}-${Math.random().toString(36).slice(2)}.webp`,
  );

  await sharp(filePath)
    .rotate()
    .resize({
      width: 1920,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 75 })
    .toFile(tempOutputPath);

  if (path.resolve(filePath) !== path.resolve(targetPath)) {
    await fs.rm(targetPath, { force: true });
    await fs.rename(tempOutputPath, targetPath);
    await fs.rm(filePath, { force: true });
    return { source: filePath, output: targetPath, replacedOriginal: true };
  }

  await fs.rm(filePath, { force: true });
  await fs.rename(tempOutputPath, targetPath);
  return { source: filePath, output: targetPath, replacedOriginal: true };
}

async function main() {
  const folderArg = process.argv[2];
  if (!folderArg) {
    console.error("Usage: node scripts/convertFolderToWebp.js <folder-path>");
    process.exit(1);
  }

  const rootFolder = path.resolve(folderArg);
  const stats = await fs.stat(rootFolder).catch(() => null);
  if (!stats || !stats.isDirectory()) {
    console.error(`Invalid folder path: ${rootFolder}`);
    process.exit(1);
  }

  const allFiles = await walkDirectory(rootFolder);
  const imageFiles = allFiles.filter((file) =>
    IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()),
  );

  if (!imageFiles.length) {
    console.log(`No supported image files found in: ${rootFolder}`);
    return;
  }

  let converted = 0;
  let failed = 0;

  for (const imageFile of imageFiles) {
    try {
      const result = await convertFileToWebp(imageFile);
      converted += 1;
      console.log(`Converted: ${result.source} -> ${result.output}`);
    } catch (error) {
      failed += 1;
      console.error(`Failed: ${imageFile}`);
      console.error(error.message || error);
    }
  }

  console.log(
    `Done. Converted: ${converted}, Failed: ${failed}, Total: ${imageFiles.length}`,
  );

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Conversion script crashed:");
  console.error(error.message || error);
  process.exit(1);
});
