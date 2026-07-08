import Landing from './screen/Landing'
import { Profile, DailyDiscovery } from './components'
import { useSpotifyAuth } from './hooks'

function App() {
  // El hook centraliza el estado de login. La UI solo reacciona a él.
  const { user, loading, logout } = useSpotifyAuth()

  // 1. Mientras resolvemos la sesión.
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-subdued">Cargando…</p>
      </div>
    )
  }

  // 2. Sin sesión → landing page que explica de qué va la web.
  if (!user) {
    return <Landing />
  }

  // 3. Con sesión → la app.
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <span className="text-lg font-bold">Liner</span>
      </header>
      <main className="mx-auto flex max-w-3xl flex-col items-center gap-8 p-8">
        <Profile user={user} onLogout={logout} />
        <DailyDiscovery userId={user.id} />
      </main>
    </div>
  )
}

export default App
