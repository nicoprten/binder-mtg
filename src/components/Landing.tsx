import { useState } from 'react'
import { useData } from '../data'

/** First screen for visitors: sign in with Google, or browse the cards to trade. */
export function Landing() {
  const { signIn } = useData()
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  async function handleSignIn() {
    setBusy(true)
    setFailed(false)
    try {
      await signIn()
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="landing">
      <div className="landing-card">
        <img className="landing-art" src="/card-back.png" alt="" width={409} height={585} />
        <h1>Binder MTG</h1>
        <p className="muted">A personal Magic: The Gathering collection. Sign in to open the binder.</p>
        <button type="button" className="google-button" onClick={() => void handleSignIn()} disabled={busy}>
          <svg viewBox="0 0 24 24" width="1.1em" height="1.1em" aria-hidden="true">
            <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4c-.2 1.2-.9 2.3-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4z" />
            <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6C4.8 19.8 8.1 22 12 22z" />
            <path fill="#FBBC05" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1C2.4 8.8 2 10.4 2 12s.4 3.2 1.1 4.6L6.4 14z" />
            <path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8C17 3 14.7 2 12 2 8.1 2 4.8 4.2 3.1 7.4L6.4 10c.8-2.3 3-4.1 5.6-4.1z" />
          </svg>
          {busy ? 'Signing in…' : 'Sign in with Google'}
        </button>
        {failed && <p className="landing-error">Sign-in did not complete. Try again.</p>}
        <p className="landing-alt">
          Not you? <a href="#/trade">Browse the cards to trade</a>
        </p>
      </div>
    </div>
  )
}
