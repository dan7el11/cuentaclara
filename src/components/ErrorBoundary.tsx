import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from './ui'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

/**
 * Atrapa errores de render para mostrar un mensaje en vez de una pantalla en
 * blanco. Sin esto, cualquier excepción durante el render deja la app vacía.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary capturó un error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-paper p-6">
          <div className="w-full max-w-md rounded-xl border border-paperline bg-white p-6 shadow-sm">
            <h1 className="font-serif text-xl text-ink">Algo se rompió en la pantalla</h1>
            <p className="mt-2 text-sm text-ink/70">
              Ocurrió un error al mostrar esta vista. Probá recargar la página.
            </p>
            <pre className="mt-3 max-h-40 overflow-auto rounded bg-paper/60 p-3 text-[11px] text-burgundy">
              {this.state.error.message}
            </pre>
            <div className="mt-4">
              <Button onClick={() => window.location.reload()}>Recargar</Button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
