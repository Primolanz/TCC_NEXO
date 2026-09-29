import LivroClaro from './assets/LivroClaro.jpg'
import LivroEscuro from './assets/LivroEscuro.png'
import './App.css'

function Livro({ dark, setDark }) {
  const capaLivro = dark ? LivroEscuro : LivroClaro

  return (
    <div className="livro-card">
      <button onClick={() => setDark(!dark)} className="ButtonDark">
        {dark ? 'Light' : 'Dark'}
      </button>

      <img src={capaLivro} alt="Capa do livro A Biblioteca da Meia-Noite" />

      <div className="livro-conteudo">
        <h1>A Biblioteca da Meia-Noite - Matt Haig</h1>
        <p>
          Sinopse: Nora Seed se sente arrependida de varias escolhas da sua
          vida. Um dia, ela vai parar em uma biblioteca magica onde cada livro
          mostra como sua vida teria sido se tivesse tomado decisoes
          diferentes. Enquanto explora essas possibilidades, Nora comeca a
          entender o verdadeiro valor da vida e das escolhas que fazemos.
        </p>
      </div>
    </div>
  )
}

export default Livro
