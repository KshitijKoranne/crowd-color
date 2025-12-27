import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { processImage, createThumbnail, uploadImageToStorage } from '../lib/imageUtils';

export default function Upload() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('Image must be smaller than 10MB');
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!file) {
      setError('Please select an image');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      // Process image (resize and convert to grayscale)
      const { canvas, width, height } = await processImage(file);

      // Create board ID
      const boardId = crypto.randomUUID();

      // Upload processed image to storage
      const imageUrl = await uploadImageToStorage(canvas, boardId);

      // Create thumbnail
      const thumbnailDataUrl = createThumbnail(canvas);

      // Insert board into database
      const { data: board, error: boardError } = await supabase
        .from('boards')
        .insert({
          id: boardId,
          title: title.trim(),
          description: description.trim() || null,
          original_image_url: imageUrl,
          thumbnail_url: thumbnailDataUrl,
          width,
          height,
          total_pixels: width * height,
          colored_pixels: 0,
        })
        .select()
        .single();

      if (boardError) throw boardError;

      // Initialize pixels in database (only store grayscale values initially)
      // We'll insert pixels on-demand when users color them
      // This saves database space for large images

      // Navigate to the new board
      navigate(`/board/${board.id}`);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F0F0] font-mono selection:bg-black selection:text-white pb-20">
      {/* Header */}
      <div className="border-b-4 border-black bg-white mb-12">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <a href="/" className="text-2xl font-black uppercase tracking-tighter hover:underline decoration-4">
            CrowdColor
          </a>
          <a href="/" className="text-sm font-bold uppercase border-2 border-black px-4 py-2 hover:bg-black hover:text-white transition-colors">
            Cancel
          </a>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-black uppercase mb-2 tracking-tight">
            Create Canvas
          </h1>
          <p className="text-gray-500 font-bold mb-12 text-lg">
            Upload an image to start a new collaborative art piece.
          </p>

          {error && (
            <div className="mb-8 bg-red-100 border-4 border-red-500 p-4 text-red-600 font-bold uppercase">
              ⚠️ ERROR: {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* File Upload Area */}
            <div 
              className={`relative border-4 border-dashed border-black bg-gray-50 p-12 text-center transition-all cursor-pointer hover:bg-gray-100 ${preview ? 'border-solid p-0 overflow-hidden bg-black' : ''}`}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              {preview ? (
                <div className="relative group">
                  <img 
                    src={preview} 
                    alt="Preview" 
                    className="w-full max-h-[500px] object-contain mx-auto filter grayscale contrast-125" 
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-white font-bold text-xl border-4 border-white px-6 py-3 uppercase bg-black">
                      Change Image
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-6xl mb-4 grayscale opacity-50">📤</div>
                  <h3 className="text-2xl font-black uppercase">Click to Upload</h3>
                  <p className="font-bold text-gray-500 uppercase text-sm tracking-wide">JPG or PNG (Max 10MB)</p>
                </div>
              )}
              <input
                type="file"
                id="file-upload"
                onChange={handleFileChange}
                className="hidden"
                accept="image/jpeg,image/png"
                disabled={processing}
              />
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              <div>
                <label className="block text-xl font-black uppercase mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#F0F0F0] border-4 border-black p-4 text-xl font-bold focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all placeholder-gray-400"
                  placeholder="MY AWESOME CANVAS"
                  disabled={processing}
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-xl font-black uppercase mb-2">
                  Description <span className="text-gray-400 text-sm align-middle font-medium">(OPTIONAL)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#F0F0F0] border-4 border-black p-4 text-lg font-medium focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all h-32 resize-none placeholder-gray-400"
                  placeholder="Tell the story behind this image..."
                  disabled={processing}
                  maxLength={500}
                />
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-black text-white p-6 border-4 border-black flex gap-4 items-start">
              <span className="text-2xl">ℹ️</span>
              <p className="font-bold text-sm leading-relaxed mt-1 uppercase tracking-wide">
                Your image will be resized (max 64px) creates a retro pixel art style. 
                Perfect for smaller communities!
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex-1 px-8 py-4 border-4 border-black text-black font-black uppercase hover:bg-gray-100 transition-colors"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!file || !title.trim() || processing}
                className={`flex-[2] px-8 py-4 bg-black text-white font-black uppercase border-4 border-black transition-all
                  ${(!file || !title.trim() || processing)
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-gray-800 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none'
                  }`}
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block animate-spin h-5 w-5 border-2 border-white border-r-transparent rounded-full"></span>
                    Processing...
                  </span>
                ) : (
                  'Create Canvas'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
