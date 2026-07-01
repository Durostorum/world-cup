import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { RequireAuth } from './components/RequireAuth'
import { AuthProvider } from './lib/auth'
import { AuthPage } from './pages/Auth'
import { HomePage } from './pages/Home'
import { LeaderboardPage } from './pages/Leaderboard'
import { MatchDetailPage } from './pages/MatchDetail'
import { MatchesPage } from './pages/Matches'
import { MyBetsPage } from './pages/MyBets'
import { ProfilePage } from './pages/Profile'
import { ContactPage, PrivacyPage, RulesPage, TermsPage } from './pages/Legal'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<HomePage />} />
            <Route path="/matches" element={<MatchesPage />} />
            <Route path="/matches/:id" element={<MatchDetailPage />} />
            <Route
              path="/my-bets"
              element={
                <RequireAuth>
                  <MyBetsPage />
                </RequireAuth>
              }
            />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/rules" element={<RulesPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route
              path="/profile"
              element={
                <RequireAuth>
                  <ProfilePage />
                </RequireAuth>
              }
            />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  )
}
