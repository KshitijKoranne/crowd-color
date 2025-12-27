// Color palette for pixel coloring
export const COLOR_PALETTE = [
  { name: 'Red', hex: '#EF4444' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Amber', hex: '#F59E0B' },
  { name: 'Yellow', hex: '#EAB308' },
  { name: 'Lime', hex: '#84CC16' },
  { name: 'Green', hex: '#22C55E' },
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Teal', hex: '#14B8A6' },
  { name: 'Cyan', hex: '#06B6D4' },
  { name: 'Sky', hex: '#0EA5E9' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Indigo', hex: '#6366F1' },
  { name: 'Violet', hex: '#8B5CF6' },
  { name: 'Purple', hex: '#A855F7' },
  { name: 'Fuchsia', hex: '#D946EF' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Rose', hex: '#F43F5E' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Gray', hex: '#6B7280' },
  { name: 'Black', hex: '#000000' },
];

// Convert hex color to RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

// Convert RGB to hex
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// Process image: resize and convert to grayscale
export async function processImage(
  file: File,
  maxWidth = 64,
  maxHeight = 64
): Promise<{
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  pixels: { r: number; g: number; b: number; a: number }[];
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      // ALWAYS scale down to fit within max dimensions for performance
      let width = img.width;
      let height = img.height;

      // Force resize if image is larger than max dimensions
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Use high quality smoothing for resize
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Draw resized image directly
      ctx.drawImage(img, 0, 0, width, height);

      // Get image data and convert to grayscale
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      const pixels: { r: number; g: number; b: number; a: number }[] = [];

      // Convert to grayscale in place
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // Luminosity method: 0.299 R + 0.587 G + 0.114 B
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

        // Update canvas with grayscale
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
        // alpha remains unchanged

        // Store pixel data for DB
        pixels.push({ r: gray, g: gray, b: gray, a });
      }

      ctx.putImageData(imageData, 0, 0);

      resolve({ canvas, width, height, pixels });
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    reader.onerror = () => reject(new Error('Failed to read file'));

    reader.readAsDataURL(file);
  });
}

// Create thumbnail from canvas
export function createThumbnail(
  canvas: HTMLCanvasElement,
  maxSize = 200
): string {
  const thumbnailCanvas = document.createElement('canvas');
  const ratio = Math.min(maxSize / canvas.width, maxSize / canvas.height);
  thumbnailCanvas.width = Math.floor(canvas.width * ratio);
  thumbnailCanvas.height = Math.floor(canvas.height * ratio);

  const ctx = thumbnailCanvas.getContext('2d');
  if (!ctx) return '';

  ctx.drawImage(canvas, 0, 0, thumbnailCanvas.width, thumbnailCanvas.height);
  return thumbnailCanvas.toDataURL('image/jpeg', 0.8);
}

// Upload image to Supabase Storage
export async function uploadImageToStorage(
  canvas: HTMLCanvasElement,
  boardId: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error('Failed to create blob from canvas'));
        return;
      }

      const { supabase } = await import('./supabase');
      const fileName = `${boardId}.png`;
      const { error } = await supabase.storage
        .from('board-images')
        .upload(fileName, blob, {
          contentType: 'image/png',
          upsert: true,
        });

      if (error) {
        reject(error);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('board-images')
        .getPublicUrl(fileName);

      resolve(urlData.publicUrl);
    }, 'image/png');
  });
}
