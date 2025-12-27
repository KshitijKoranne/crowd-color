import { useEffect, useState } from 'react';
import { supabase, type Board } from '../lib/supabase';

export default function Gallery() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBoards();
  }, []);

  async function fetchBoards() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBoards(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load boards');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F0F0] flex items-center justify-center font-mono">
        <div className="text-center">
          <div className="inline-block animate-spin h-12 w-12 border-4 border-black border-r-transparent rounded-full"></div>
          <p className="mt-4 text-black font-bold text-xl uppercase tracking-widest">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F0F0F0] flex items-center justify-center p-8 font-mono">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 max-w-md">
          <h3 className="text-2xl font-black mb-4 uppercase">Error</h3>
          <p className="text-black mb-6 font-medium">{error}</p>
          <button
            onClick={fetchBoards}
            className="w-full px-6 py-3 bg-black text-white font-bold uppercase hover:bg-gray-800 transition-transform active:translate-y-1"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F0F0] text-black font-mono selection:bg-black selection:text-white">
      {/* Hero Section */}
      <div className="border-b-4 border-black bg-white">
        <div className="max-w-7xl mx-auto px-6 py-24 text-center">
          <h1 className="text-7xl md:text-9xl font-black mb-6 tracking-tighter uppercase leading-none">
            Crowd<br className="md:hidden" />Color
          </h1>

          <p className="text-2xl md:text-3xl font-bold mb-12 max-w-4xl mx-auto leading-tight">
            THE ONLY COLOR HERE IS THE COLOR <span className="underline decoration-4 decoration-black">YOU</span> CREATE.
          </p>
          
          <button
            onClick={() => window.location.href = '/upload'}
            className="group relative inline-block focus:outline-none"
          >
            <span className="absolute inset-0 translate-x-3 translate-y-3 bg-black transition-transform group-hover:translate-x-4 group-hover:translate-y-4"></span>
            <span className="relative inline-block border-4 border-black bg-white px-12 py-6 text-2xl font-black uppercase tracking-widest hover:-translate-y-1 active:translate-y-0 transition-transform">
              Start A Canvas
            </span>
          </button>
        </div>
      </div>

      {/* Active Canvases Section (Moved Up) */}
      <div className="border-b-4 border-black bg-[#E6E6E6]">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none">
              Active<br />Canvases
            </h2>
            <div className="text-right">
              <p className="font-bold text-xl uppercase">{boards.length} Boards Live</p>
              <div className="h-2 w-32 bg-black ml-auto mt-2"></div>
            </div>
          </div>

          {boards.length === 0 ? (
            <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
              <div className="text-8xl mb-8 grayscale opacity-50">🚧</div>
              <h3 className="text-3xl font-black uppercase mb-4">
                No Canvases Yet
              </h3>
              <p className="text-xl font-medium mb-8 max-w-lg mx-auto">
                The gallery is empty. Be the first to break the silence.
              </p>
              <button
                onClick={() => window.location.href = '/upload'}
                className="px-8 py-3 bg-black text-white font-bold uppercase hover:bg-gray-800"
              >
                Create First Canvas
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {boards.map((board) => {
                const progress = Math.round((board.colored_pixels / board.total_pixels) * 100);
                
                return (
                  <a
                    key={board.id}
                    href={`/board/${board.id}`}
                    className="group block bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-200"
                  >
                    {/* Thumbnail */}
                    <div className="aspect-square border-b-4 border-black overflow-hidden relative bg-gray-100">
                      {board.thumbnail_url ? (
                        <img
                          src={board.thumbnail_url}
                          alt={board.title}
                          className="w-full h-full object-cover filter grayscale contrast-125 group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-6xl grayscale">🖼️</span>
                        </div>
                      )}
                      
                      {/* Brutalist Badge */}
                      <div className="absolute top-0 right-0 bg-black text-white px-3 py-1 font-bold border-l-4 border-b-4 border-white">
                        {progress}% DONE
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-6">
                      <h3 className="font-black text-2xl mb-2 truncate uppercase tracking-tight">
                        {board.title}
                      </h3>
                      
                      {board.description ? (
                        <p className="text-sm font-medium text-gray-600 mb-4 line-clamp-2 h-10 border-l-2 border-gray-300 pl-3">
                          {board.description}
                        </p>
                      ) : (
                         <div className="h-10 mb-4"></div>
                      )}

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-4 text-xs font-bold uppercase pt-4 border-t-4 border-black">
                        <div>
                          <span className="block text-gray-500 text-[10px]">Dimensions</span>
                          {board.width} × {board.height}
                        </div>
                        <div className="text-right">
                          <span className="block text-gray-500 text-[10px]">Colored</span>
                          {board.colored_pixels} Pixels
                        </div>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* How It Works Section (Moved Down) */}
      <div className="bg-black text-white py-20 border-b-4 border-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-16 text-center underline decoration-4 underline-offset-8 decoration-white">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: '01', title: 'Upload', desc: 'Upload raw image. Converting to grayscale. Canvas created.' },
              { icon: '02', title: 'Color', desc: 'Select pixel. Choose color. 5 minute cooldown. Make it count.' },
              { icon: '03', title: 'Collaborate', desc: 'Real-time updates. Community effort. Watch art emerge.' }
            ].map((step, i) => (
              <div key={i} className="relative p-8 border-4 border-white hover:bg-white hover:text-black transition-colors duration-300 group">
                <div className="absolute -top-6 -left-6 bg-white text-black text-4xl font-black border-4 border-black w-16 h-16 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] group-hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
                  {step.icon}
                </div>
                <h3 className="text-3xl font-black uppercase mb-4 mt-4">{step.title}</h3>
                <p className="font-medium text-lg leading-relaxed opacity-80 group-hover:opacity-100">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white py-12 border-t-4 border-black">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="font-black text-2xl uppercase tracking-tighter">
            CrowdColor
          </div>
          <p className="font-bold text-sm uppercase tracking-widest text-gray-500">
            Every Pixel Tells A Story
          </p>
          <div className="text-xs font-mono bg-black text-white px-2 py-1">
            v1.0.0
          </div>
        </div>
      </div>
    </div>
  );
}
