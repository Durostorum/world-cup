import { Link } from 'react-router-dom'

const DISCLAIMER =
  'This is a free social prediction game using fictional coins only. Coins have no cash value and cannot be purchased, sold, withdrawn, or exchanged for money, goods, or services.'

function LegalShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-2xl rounded-2xl bg-white/95 p-8 text-pitch shadow-lg">
      <h1 className="mb-6 text-2xl font-bold">{title}</h1>
      <div className="prose prose-sm max-w-none space-y-4 text-gray-700">{children}</div>
      <p className="mt-8 border-t border-gray-200 pt-6 text-xs text-gray-500">{DISCLAIMER}</p>
      <Link to="/" className="mt-4 inline-block text-sm text-pitch underline">
        Back to home
      </Link>
    </article>
  )
}

export function TermsPage() {
  return (
    <LegalShell title="Terms of Service">
      <p>
        World Cup Pool 2026 is a free social prediction game. By creating an account you agree to
        use the service for entertainment only.
      </p>
      <ul className="list-disc space-y-2 pl-5">
        <li>No real-money deposits, withdrawals, or wagering.</li>
        <li>Fictional coins have no cash value and cannot be exchanged for prizes unless separately reviewed.</li>
        <li>One account per person; do not attempt to spoof identity or exploit the betting system.</li>
        <li>We may suspend accounts that abuse the platform or attempt fraud.</li>
        <li>Schedules, odds, and results may be corrected by administrators with ledger audit trails.</li>
      </ul>
      <p>
        The service is provided &quot;as is&quot; without warranty. We are not liable for downtime,
        data loss, or incorrect scores during beta operation.
      </p>
    </LegalShell>
  )
}

export function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy">
      <p>
        We collect your email address and display name to operate your account via Netlify Identity.
        Betting history and coin balances are stored in our database to run the game.
      </p>
      <ul className="list-disc space-y-2 pl-5">
        <li>We do not sell your personal information.</li>
        <li>Authentication tokens are handled by Netlify Identity; we do not store passwords.</li>
        <li>Leaderboard display names are visible to other players.</li>
        <li>Server logs may record errors and admin actions without storing full JWTs.</li>
      </ul>
      <p>
        For data requests or account deletion, contact us using the support page.
      </p>
    </LegalShell>
  )
}

export function RulesPage() {
  return (
    <LegalShell title="Community Rules">
      <ul className="list-disc space-y-2 pl-5">
        <li>Be respectful in display names and interactions.</li>
        <li>Do not use bots or scripts to place bets.</li>
        <li>Do not share accounts or attempt to bet on behalf of others.</li>
        <li>Do not misrepresent this site as real-money gambling.</li>
        <li>Report bugs or suspected cheating via the contact page.</li>
      </ul>
    </LegalShell>
  )
}

export function ContactPage() {
  return (
    <LegalShell title="Contact & Support">
      <p>
        For account issues, settlement questions, or abuse reports, email the site operator at{' '}
        <a href="mailto:support@world-cup-bet-2026.netlify.app" className="text-pitch underline">
          support@world-cup-bet-2026.netlify.app
        </a>
        .
      </p>
      <p className="text-sm text-gray-500">
        Include your display name and a description of the issue. We do not handle real-money
        disputes because this game uses fictional coins only.
      </p>
    </LegalShell>
  )
}

export { DISCLAIMER as LEGAL_DISCLAIMER }
