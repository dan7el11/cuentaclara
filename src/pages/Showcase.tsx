import { useState } from 'react'
import { Button, Badge, Card, OddsButton, Input, LedgerRule, Tab } from '../components/ui'

const THEMES = [
  { id: 'theme-light', name: 'Claro original', note: 'El look previo: papel cálido + slate.' },
  { id: 'theme-warm', name: 'Cálido refrescado', note: 'Mismo papel, acento teal, esquinas más redondeadas.' },
  { id: 'theme-fintech', name: 'Fintech moderno', note: 'Claro, azul brillante, aireado.' },
  { id: 'theme-dark', name: 'Oscuro (sportsbook)', note: 'Índigo casi negro + violeta.' },
]

/** Pantalla pública para comparar estilos del design system lado a lado.
    No afecta a la app: cada bloque sólo sobrescribe tokens en su contenedor. */
export default function Showcase() {
  return (
    <div style={{ minHeight: '100vh', background: '#e9e4d8', padding: '24px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 30, color: '#1c2430', margin: 0 }}>
          Muestra de estilos
        </h1>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'rgba(28,36,48,0.6)', marginTop: 4 }}>
          Los mismos componentes bajo distintos tokens. Decime cuál y lo aplico a toda la app.
        </p>

        <div
          style={{
            marginTop: 24,
            display: 'grid',
            gap: 20,
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          }}
        >
          {THEMES.map((t) => (
            <ThemePanel key={t.id || 'base'} className={t.id} name={t.name} note={t.note} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ThemePanel({ className, name, note }: { className: string; name: string; note: string }) {
  const [stake, setStake] = useState('25')
  const [pick, setPick] = useState('1')

  return (
    <div
      className={className}
      style={{
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: 16,
        padding: 20,
        color: 'var(--color-text)',
        fontFamily: 'var(--font-sans)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--color-text)' }}>{name}</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{note}</div>
      </div>

      <LedgerRule />

      {/* Botones */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <Button>Apostar</Button>
        <Button variant="secondary">Cancelar</Button>
        <Button variant="ghost">Ver más</Button>
        <Button variant="danger" size="sm">
          Riesgo
        </Button>
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        <Badge variant="ficticia">dinero ficticio</Badge>
        <Badge variant="slate" dot>
          en vivo
        </Badge>
        <Badge variant="sage">ganada</Badge>
        <Badge variant="burgundy">perdida</Badge>
      </div>

      {/* Card con gradiente + odds */}
      <Card gradient flush>
        <div style={{ padding: 16 }}>
          <div style={{ color: 'var(--color-paper)', fontSize: 13, opacity: 0.85, marginBottom: 8 }}>
            Real Madrid vs Barcelona
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { l: '1', o: 2.1 },
              { l: 'X', o: 3.3 },
              { l: '2', o: 3.4 },
            ].map((x) => (
              <OddsButton key={x.l} onDark label={x.l} odds={x.o} active={pick === x.l} onClick={() => setPick(x.l)} />
            ))}
          </div>
        </div>
      </Card>

      {/* Input + Card normal */}
      <Card>
        <Input label="Monto" mono prefix="$" value={stake} onChange={(e) => setStake(e.target.value)} />
        <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
          <Tab active>Simple</Tab>
          <Tab>Combinada</Tab>
        </div>
      </Card>
    </div>
  )
}
