import { ArrowLeftRight, LogOut } from 'lucide-react'
import type { SpotifyUser } from '../types'
import { switchAccount } from '../lib'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

// Recibe datos por PROPS: el usuario y una función para cerrar sesión.
interface ProfileProps {
  user: SpotifyUser
  onLogout: () => void
}

function Profile({ user, onLogout }: ProfileProps) {
  return (
    <Card className="w-full max-w-sm">
      <CardContent className="flex flex-col items-center gap-4 p-6">
        {user.images[0] && (
          <img
            src={user.images[0].url}
            alt={user.display_name}
            className="size-24 rounded-full"
          />
        )}

        <div className="text-center">
          <h2 className="text-2xl font-semibold">{user.display_name}</h2>
          <p className="text-muted-foreground">{user.email}</p>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Button variant="outline" size="pill" onClick={switchAccount}>
            <ArrowLeftRight />
            Cambiar de cuenta
          </Button>
          <Button variant="ghost" size="pill" onClick={onLogout}>
            <LogOut />
            Cerrar sesión
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default Profile
