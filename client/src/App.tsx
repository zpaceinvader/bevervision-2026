import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Searchlights from './components/Searchlights'
import Sparkles from './components/Sparkles'
import { LanguageProvider } from './lib/i18n'
import Landing from './pages/Landing'
import Room from './pages/Room'
import Host from './pages/Host'
import HostCreate from './pages/HostCreate'
import Leaderboard from './pages/Leaderboard'

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Searchlights />
        <Sparkles />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/room/:code" element={<Room />} />
          <Route path="/host" element={<HostCreate />} />
          <Route path="/host/:code" element={<Host />} />
          <Route path="/leaderboard/:code" element={<Leaderboard />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  )
}
