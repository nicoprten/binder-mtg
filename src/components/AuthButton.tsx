import { useData } from '../data'
import { firebaseEnabled } from '../firebase'

/** Google sign-in / sign-out, shown only when Firebase is configured. */
export function AuthButton() {
  const { user, isEditor, signIn, signOut } = useData()
  if (!firebaseEnabled) return null
  if (!user) {
    return (
      <button type="button" className="auth-button" onClick={() => void signIn()}>
        Sign in
      </button>
    )
  }
  return (
    <span className="auth-user" title={user.email ?? undefined}>
      {user.photoURL && <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />}
      <span className="auth-name">
        {user.displayName ?? user.email}
        {!isEditor && <span className="muted"> · read only</span>}
      </span>
      <button type="button" className="auth-button" onClick={() => void signOut()}>
        Sign out
      </button>
    </span>
  )
}
