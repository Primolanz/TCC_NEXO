import { useState } from 'react'
import Livro from './Livro'
import './App.css'

function App() {
  const [dark, setDark] = useState(false)

  return (
    <main className={`app ${dark ? 'dark' : ''}`}>
      <Livro dark={dark} setDark={setDark} />
    </main>
  )
}

export default App
