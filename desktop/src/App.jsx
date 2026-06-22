import { useState } from 'react'
import './App.css'

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="app">
      <header className="header">
        <h1>Fédération des Orphelinats</h1>
        <p className="subtitle">Application Desktop</p>
      </header>

      <main className="main">
        <div className="card">
          <h2>Bienvenue sur le desktop</h2>
          <p>Interface de gestion pour les administrateurs</p>
          <button className="btn" onClick={() => setCount(c => c + 1)}>
            Compteur : {count}
          </button>
        </div>
      </main>

      <footer className="footer">
        <p>Built on Backend / Frontend / Desktop / Mobile — v2.4.1</p>
      </footer>
    </div>
  )
}
