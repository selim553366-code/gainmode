import sharp from "sharp";

export const AI_IMAGE_MAX_DIMENSION = 1024;

export async function resizeImageForAi(imageData: string) {
  const source = Buffer.from(imageData, "base64");
  const image = sharp(source, {
    failOn: "error",
    limitInputPixels: 40_000_000,
  }).rotate();
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("AI image dimensions could not be read.");
  }

  if (Math.max(metadata.width, metadata.height) <= AI_IMAGE_MAX_DIMENSION) {
    return imageData;
  }

  const resized = await image
    .resize({
      width: AI_IMAGE_MAX_DIMENSION,
      height: AI_IMAGE_MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 82 })
    .toBuffer();

  return resized.toString("base64");
}
