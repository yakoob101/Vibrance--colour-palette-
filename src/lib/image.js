import { getLuminance, makeColor, rgbToHex } from './color';

function createBox(pixels) {
  let minR = 255;
  let minG = 255;
  let minB = 255;
  let maxR = 0;
  let maxG = 0;
  let maxB = 0;

  for (const pixel of pixels) {
    minR = Math.min(minR, pixel[0]);
    minG = Math.min(minG, pixel[1]);
    minB = Math.min(minB, pixel[2]);
    maxR = Math.max(maxR, pixel[0]);
    maxG = Math.max(maxG, pixel[1]);
    maxB = Math.max(maxB, pixel[2]);
  }

  const ranges = [maxR - minR, maxG - minG, maxB - minB];
  const longest = ranges.indexOf(Math.max(...ranges));

  return {
    pixels,
    ranges,
    longest,
    score: Math.max(...ranges) * Math.cbrt(pixels.length),
  };
}

function averagePixels(pixels) {
  let r = 0;
  let g = 0;
  let b = 0;
  for (const pixel of pixels) {
    r += pixel[0];
    g += pixel[1];
    b += pixel[2];
  }
  return [Math.round(r / pixels.length), Math.round(g / pixels.length), Math.round(b / pixels.length)];
}

function colorDistance(a, b) {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

export function quantizePixels(pixels, count = 5) {
  if (!pixels.length) return [];

  let boxes = [createBox(pixels)];
  const target = Math.max(2, Math.min(8, count));

  while (boxes.length < target) {
    let bestIndex = -1;
    let bestScore = -1;

    boxes.forEach((box, index) => {
      if (box.pixels.length > 1 && box.score > bestScore) {
        bestScore = box.score;
        bestIndex = index;
      }
    });

    if (bestIndex < 0) break;
    const box = boxes[bestIndex];
    if (box.ranges[box.longest] === 0) break;

    const sorted = box.pixels
      .slice()
      .sort((a, b) => a[box.longest] - b[box.longest]);
    const midpoint = Math.floor(sorted.length / 2);
    const first = sorted.slice(0, midpoint);
    const second = sorted.slice(midpoint);

    if (!first.length || !second.length) break;
    boxes = [
      ...boxes.slice(0, bestIndex),
      createBox(first),
      createBox(second),
      ...boxes.slice(bestIndex + 1),
    ];
  }

  const averages = boxes.map((box) => averagePixels(box.pixels));
  const distinct = [];

  for (const average of averages) {
    if (distinct.every((existing) => colorDistance(existing, average) > 22)) {
      distinct.push(average);
    }
  }

  let fallbackIndex = 0;
  while (distinct.length < target) {
    const source = averages[fallbackIndex % Math.max(1, averages.length)] || [128, 128, 128];
    const shift = 14 + fallbackIndex * 8;
    const fallback = source.map((channel, channelIndex) =>
      Math.max(0, Math.min(255, channel + (channelIndex === 1 ? shift : -shift / 2))),
    );
    if (distinct.every((existing) => colorDistance(existing, fallback) > 8)) {
      distinct.push(fallback);
    } else {
      distinct.push([
        Math.max(0, Math.min(255, source[0] + fallbackIndex * 11)),
        Math.max(0, Math.min(255, source[1] - fallbackIndex * 7)),
        Math.max(0, Math.min(255, source[2] + fallbackIndex * 13)),
      ]);
    }
    fallbackIndex += 1;
    if (fallbackIndex > 40) break;
  }

  return distinct
    .slice(0, target)
    .map(([r, g, b]) => makeColor(rgbToHex(r, g, b)))
    .sort((a, b) => getLuminance(b.hex) - getLuminance(a.hex));
}

export function extractPaletteFromImage(image, count = 5) {
  const maxDimension = 220;
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
  const width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
  const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });

  if (!context) throw new Error('Canvas is not available in this browser.');

  context.drawImage(image, 0, 0, width, height);
  const imageData = context.getImageData(0, 0, width, height).data;
  const pixels = [];

  for (let index = 0; index < imageData.length; index += 4) {
    const alpha = imageData[index + 3];
    if (alpha < 120) continue;
    const r = imageData[index];
    const g = imageData[index + 1];
    const b = imageData[index + 2];
    if (r > 248 && g > 248 && b > 248) continue;
    pixels.push([r, g, b]);
  }

  if (pixels.length < 12) {
    throw new Error('That image does not have enough visible color data. Try another photo.');
  }

  return {
    colors: quantizePixels(pixels, count),
    width,
    height,
    sampledPixels: pixels.length,
  };
}

export function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => resolve({ image, url });
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That file could not be read as an image.'));
    };
    image.src = url;
  });
}
