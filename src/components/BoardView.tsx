import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, type Board, type Pixel } from '../lib/supabase';
import { COLOR_PALETTE, hexToRgb } from '../lib/imageUtils';
import {
  canPlacePixel,
  setCooldownData,
  getRemainingCooldown,
  formatCooldownTime,
} from '../lib/cooldown';

export default function BoardView() {
  const { id } = useParams<{ id: string }>();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [pixels, setPixels] = useState<Map<number, Pixel>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0].hex);
  const [selectedPixel, setSelectedPixel] = useState<number | null>(null);
  const [canPlace, setCanPlace] = useState(true);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [scale, setScale] = useState(1);

  // Fetch board data
  useEffect(() => {
    if (!id) return;
    fetchBoard();
  }, [id]);

  // Subscribe to real-time pixel updates
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`board-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pixels',
          filter: `board_id=eq.${id}`,
        },
        (payload: any) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const pixel = payload.new as Pixel;
            setPixels((prev) => new Map(prev).set(pixel.pixel_index, pixel));
            renderCanvas();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, board]);

  // Check cooldown timer
  useEffect(() => {
    if (!id) return;

    const checkCooldown = () => {
      const canPlaceNow = canPlacePixel(id);
      setCanPlace(canPlaceNow);

      if (!canPlaceNow) {
        const remaining = getRemainingCooldown(id);
        setCooldownTime(remaining);
      } else {
        setCooldownTime(0);
      }
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);

    return () => clearInterval(interval);
  }, [id]);

  // Render canvas whenever pixels or board changes
  useEffect(() => {
    if (board) {
      renderCanvas();
    }
  }, [board, pixels]);

  async function fetchBoard() {
    if (!id) return;

    try {
      setLoading(true);

      // Fetch board
      const { data: boardData, error: boardError } = await supabase
        .from('boards')
        .select('*')
        .eq('id', id)
        .single();

      if (boardError) throw boardError;
      if (!boardData) throw new Error('Board not found');

      setBoard(boardData);

      // Fetch all colored pixels
      const { data: pixelsData, error: pixelsError } = await supabase
        .from('pixels')
        .select('*')
        .eq('board_id', id);

      if (pixelsError) throw pixelsError;

      const pixelMap = new Map<number, Pixel>();
      pixelsData?.forEach((pixel: Pixel) => {
        pixelMap.set(pixel.pixel_index, pixel);
      });
      setPixels(pixelMap);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load board');
    } finally {
      setLoading(false);
    }
  }

  function renderCanvas() {
    if (!board || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = board.width;
    canvas.height = board.height;

    // Load the original grayscale image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 0, 0, board.width, board.height);

      // Get image data
      const imageData = ctx.getImageData(0, 0, board.width, board.height);
      const data = imageData.data;

      // Apply colored pixels
      pixels.forEach((pixel, index) => {
        const i = index * 4;
        data[i] = pixel.r;
        data[i + 1] = pixel.g;
        data[i + 2] = pixel.b;
        data[i + 3] = pixel.a;
      });

      ctx.putImageData(imageData, 0, 0);

      // Highlight selected pixel
      if (selectedPixel !== null) {
        const x = selectedPixel % board.width;
        const y = Math.floor(selectedPixel / board.width);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, 1, 1);
      }
    };
    img.src = board.original_image_url;
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!board || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = board.width / rect.width;
    const scaleY = board.height / rect.height;

    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    if (x >= 0 && x < board.width && y >= 0 && y < board.height) {
      const pixelIndex = y * board.width + x;
      setSelectedPixel(pixelIndex);
    }
  }

  async function handlePlacePixel() {
    if (!board || !id || selectedPixel === null || !canPlace || placing) return;

    try {
      setPlacing(true);

      const rgb = hexToRgb(selectedColor);

      // Upsert pixel (insert or update)
      const { error: pixelError } = await supabase
        .from('pixels')
        .upsert({
          board_id: id,
          pixel_index: selectedPixel,
          r: rgb.r,
          g: rgb.g,
          b: rgb.b,
          a: 255,
          updated_at: new Date().toISOString(),
        });

      if (pixelError) throw pixelError;

      // Set cooldown
      setCooldownData(id);
      setCanPlace(false);
      setSelectedPixel(null);

      // Refresh board to update stats
      await fetchBoard();
    } catch (err) {
      console.error('Place pixel error:', err);
      alert(err instanceof Error ? err.message : 'Failed to place pixel');
    } finally {
      setPlacing(false);
    }
  }

  function handleDownload() {
    if (!canvasRef.current) return;

    const link = document.createElement('a');
    link.download = `${board?.title || 'crowdcolor'}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  }

  function handleShare() {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('Board URL copied to clipboard!');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F0F0] flex items-center justify-center font-mono">
        <div className="text-center">
          <div className="inline-block animate-spin h-12 w-12 border-4 border-black border-r-transparent rounded-full"></div>
          <p className="mt-4 text-black font-bold text-xl uppercase tracking-widest">Loading Board...</p>
        </div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="min-h-screen bg-[#F0F0F0] flex items-center justify-center p-8 font-mono">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 max-w-md text-center">
          <div className="text-6xl mb-6 grayscale opacity-50">💔</div>
          <h2 className="text-3xl font-black uppercase mb-4">Board Not Found</h2>
          <p className="text-black font-medium mb-8">{error || 'This board does not exist'}</p>
          <Link
            to="/"
            className="block w-full px-6 py-3 bg-black text-white font-bold uppercase hover:bg-gray-800 transition-transform active:translate-y-1"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const progress = Math.round((board.colored_pixels / board.total_pixels) * 100);

  return (
    <div className="min-h-screen bg-[#F0F0F0] font-mono selection:bg-black selection:text-white p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="flex-1">
              <Link
                to="/"
                className="text-black font-bold uppercase tracking-widest hover:underline decoration-2 mb-4 inline-block text-xs"
              >
                ← Back to Gallery
              </Link>
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight leading-none mb-2">
                {board.title}
              </h1>
              {board.description && (
                <p className="text-gray-600 font-medium text-lg border-l-4 border-gray-300 pl-4 py-1">
                  {board.description}
                </p>
              )}
            </div>
            
            <div className="flex gap-4 self-start">
              <button
                onClick={handleShare}
                className="px-6 py-3 border-4 border-black font-bold uppercase hover:bg-black hover:text-white transition-colors"
              >
                Share URL
              </button>
              <button
                onClick={handleDownload}
                className="px-6 py-3 bg-black text-white font-bold uppercase border-4 border-black hover:bg-gray-800 transition-colors"
              >
                Download
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t-4 border-black">
            <div>
              <div className="text-xs font-bold uppercase text-gray-500 mb-1">Dimensions</div>
              <div className="text-2xl font-black">{board.width}×{board.height}</div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase text-gray-500 mb-1">Progress</div>
              <div className="text-2xl font-black">{progress}%</div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase text-gray-500 mb-1">Colored Pixels</div>
              <div className="text-2xl font-black">{board.colored_pixels.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase text-gray-500 mb-1">Total Pixels</div>
              <div className="text-2xl font-black">{board.total_pixels.toLocaleString()}</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6 border-2 border-black h-4 bg-white">
            <div
              className="h-full bg-black transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Canvas Area */}
          <div className="lg:col-span-2">
            <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4 flex flex-col h-[600px]">
              <div className="flex justify-between items-center mb-4 border-b-2 border-gray-200 pb-2">
                <h2 className="font-black uppercase text-xl">Canvas View</h2>
                <div className="flex items-center gap-2 bg-gray-100 p-1 border-2 border-black">
                  <button onClick={() => setScale(Math.max(1, scale - 1))} className="w-8 h-8 flex items-center justify-center font-bold hover:bg-white transition-colors">−</button>
                  <span className="text-sm font-bold w-12 text-center">{scale}x</span>
                  <button onClick={() => setScale(Math.min(25, scale + 1))} className="w-8 h-8 flex items-center justify-center font-bold hover:bg-white transition-colors">+</button>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto bg-[#e5e5e5] border-2 border-black relative cursor-crosshair flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  className="shadow-xl"
                  style={{
                    imageRendering: 'pixelated',
                    transform: `scale(${scale})`,
                    transformOrigin: 'center center',
                    maxWidth: 'none', // Allow canvas to overflow scroll container
                  }}
                />
              </div>
            </div>
          </div>

          {/* Controls Sidebar */}
          <div className="space-y-6">
            {/* Color Palette */}
            <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
              <h2 className="font-black uppercase text-xl mb-4 border-b-4 border-black pb-2">
                Select Color
              </h2>
              <div className="grid grid-cols-5 gap-2">
                {COLOR_PALETTE.map((color) => (
                  <button
                    key={color.hex}
                    onClick={() => setSelectedColor(color.hex)}
                    className={`aspect-square border-2 transition-transform ${
                      selectedColor === color.hex
                        ? 'border-black scale-110 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10'
                        : 'border-transparent hover:scale-105 hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
              
              <div className="mt-6 flex items-center gap-4 bg-gray-50 p-3 border-2 border-black">
                <div
                  className="w-10 h-10 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  style={{ backgroundColor: selectedColor }}
                />
                <div className="font-bold uppercase text-sm">
                  {COLOR_PALETTE.find(c => c.hex === selectedColor)?.name || selectedColor}
                </div>
              </div>
            </div>

            {/* Action Panel */}
            <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 sticky top-6">
              <h2 className="font-black uppercase text-xl mb-4 border-b-4 border-black pb-2">
                Action
              </h2>

              <div className="mb-6 space-y-4">
                {selectedPixel === null ? (
                  <div className="p-4 bg-gray-100 border-2 border-dashed border-gray-400 text-center text-gray-500 font-bold uppercase text-sm">
                    Select a pixel on the canvas
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50 border-2 border-black">
                    <div className="text-xs font-bold uppercase mb-1">Selected Pixel</div>
                    <div className="font-mono text-lg">
                      X: {selectedPixel % board.width}, Y: {Math.floor(selectedPixel / board.width)}
                    </div>
                  </div>
                )}
                
                {!canPlace && (
                  <div className="p-4 bg-black text-white">
                    <div className="text-xs font-bold uppercase mb-1 text-gray-400">Cooldown Active</div>
                    <div className="font-mono text-2xl font-bold text-white">
                      {formatCooldownTime(cooldownTime)}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handlePlacePixel}
                disabled={!canPlace || selectedPixel === null || placing}
                className="w-full px-6 py-4 bg-black text-white rounded-none border-4 border-transparent hover:border-white hover:bg-gray-900 transition-all font-black uppercase text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-[4px_4px_0px_0px_rgba(255,255,255,0)] hover:shadow-[0px_0px_0px_2px_rgba(0,0,0,1)]"
              >
                {placing ? 'PLACING...' : canPlace ? 'PLACE PIXEL' : 'WAIT FOR COOLDOWN'}
              </button>
              
              <div className="mt-4 text-center">
                 <p className="text-xs font-bold uppercase text-gray-400">
                  Rate Limit: 1 Pixel / 5 Minutes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
