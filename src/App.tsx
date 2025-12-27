import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { isSupabaseConfigured } from './lib/supabase';
import SetupRequired from './components/SetupRequired';
import Gallery from './components/Gallery';
import Upload from './components/Upload';
import BoardView from './components/BoardView';

function App() {
  // Show setup screen if Supabase is not configured
  if (!isSupabaseConfigured) {
    return <SetupRequired />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Gallery />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/board/:id" element={<BoardView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
