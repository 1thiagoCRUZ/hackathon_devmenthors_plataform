import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Avaliacao from './pages/Avaliacao';
import Vote from './pages/Vote';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:slug" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/avaliacao" element={<Avaliacao />} />
        <Route path="/vote" element={<Vote />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;