// Colori dell'immagine del modulo da condividere con i giocatori. È un PNG
// che vive fuori dall'app (chat, stampe): ha sempre lo stesso aspetto scuro,
// qualunque sia il tema scelto, e non può leggere le variabili CSS.
export const ESPORTAZIONE = {
  fondo: '#0a0a0e',
  titolo: '#ffffff',
  sottotitolo: '#a1a1b5',
  pedina: '#14141c',
  testo: '#ececf1',
  nome: '#ffffff',
  campo: ['#0c3120', '#0e3a26'],
  linee: (alfa) => `rgba(255,255,255,${alfa})`,
  vuoto: 'rgba(0,0,0,0.28)',
  bordoSegno: '#0a0a0e',
  cambio: '#ef4444',
  naturale: { fondo: '#34d399', testo: '#053022' },
  adattabile: { fondo: '#fbbf24', testo: '#3a2a00' },
  ruolo: { por: '#facc15', dif: '#4ade80', cen: '#60a5fa', att: '#f87171', nessuno: '#9a9aad' },
  intesa: { confermata: '#4ade80', potenziale: '#9a9aad', speciale: '#a78bfa', pattern: '#ffffff' },
}
