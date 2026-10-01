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
  // The name only shows on hover over the picture, to keep the bar short.
  const label = `${user.displayName ?? user.email ?? 'Signed in'}${isEditor ? '' : ' · trade only'}`
  return (
    <span className="auth-user">
      {user.photoURL ? (
        <img src={user.photoURL} alt={label} title={label} referrerPolicy="no-referrer" />
      ) : (
        <span className="auth-initial" title={label} aria-label={label}>
          {(user.displayName ?? user.email ?? '?').charAt(0).toUpperCase()}
        </span>
      )}
      <button type="button" className="auth-button" onClick={() => void signOut()}>
        Sign out
      </button>
    </span>
  )
}
