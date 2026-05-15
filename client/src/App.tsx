import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Room from './pages/Room'
import Host from './pages/Host'
import Leaderboard from './pages/Leaderboard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/room/:code" element={<Room />} />
        <Route path="/host/:code" element={<Host />} />
        <Route path="/leaderboard/:code" element={<Leaderboard />} />
      </Routes>
    </BrowserRouter>
  )
}
