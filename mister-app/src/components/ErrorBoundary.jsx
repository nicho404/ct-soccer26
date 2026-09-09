import { Component } from 'react'

// Senza questo, un errore dentro una pagina smonta tutto l'albero React e
// lascia lo schermo nero: nessun messaggio, niente da riferire. Qui l'errore
// diventa leggibile e copiabile, e il resto dell'app resta raggiungibile.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { errore: null }
  }

  static getDerivedStateFromError(errore) {
    return { errore }
  }

  componentDidCatch(errore, info) {
    // resta anche in console, per chi ha DevTools aperti
    console.error('Errore in pagina:', errore, info)
  }

  render() {
    const { errore } = this.state
    if (!errore) return this.props.children

    const dettaglio = `${errore.message ?? errore}\n\n${errore.stack ?? ''}`.trim()

    return (
      <div className="page">
        <div className="page-header">
          <h1>Qualcosa si è rotto</h1>
        </div>
        <div className="alert-card danger">
          <span>⚠️</span>
          <span>
            Questa schermata non è riuscita ad aprirsi. I tuoi dati sono al sicuro:
            l'errore è solo nella visualizzazione.
          </span>
        </div>
        <div className="card">
          <div className="muted small" style={{ marginBottom: 8 }}>Dettaglio tecnico</div>
          <pre
            className="small"
            style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowX: 'auto' }}
          >
            {dettaglio}
          </pre>
        </div>
        <button
          className="btn btn-primary btn-block"
          onClick={() => {
            this.setState({ errore: null })
            window.location.hash = '#/home'
          }}
        >
          Torna alla home
        </button>
        <button
          className="btn btn-block"
          style={{ marginTop: 10 }}
          onClick={() => navigator.clipboard?.writeText(dettaglio)}
        >
          Copia il dettaglio
        </button>
      </div>
    )
  }
}
