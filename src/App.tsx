import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './pages/Home'
import { LeaderboardPage } from './pages/Leaderboard'
import { MatchDetailPage } from './pages/MatchDetail'
import { MatchesPage } from './pages/Matches'
import { MyBetsPage } from './pages/MyBets'
import { ProfilePage } from './pages/Profile'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/matches/:id" element={<MatchDetailPage />} />
          <Route path="/my-bets" element={<MyBetsPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
