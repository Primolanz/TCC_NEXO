import "./App.css";

function Nav({carrinho, dark, setDark}) {
  return (
    <div className="BodyNav">
      <h1 className="TextoNav">Home</h1>
      <h1 className="TextoNav">Medicamentos</h1>
      <h1 className="TextoNav">Higiene & Beleza</h1>
      <h1 className="TextoNav">Infantil</h1>
      <h1 className="TextoNav">Bem-estar</h1>
      <h1 className="TextoNav">Ofertas</h1>
      <h1 className="TextoNav">Minha Conta</h1>
      <h1 className="Carrinho">🛒 {carrinho.length}</h1>
      <button onClick={() => setDark(!dark)} className="ButtonBark">
        {dark ? "☀ Light" : "🌑 Dark"}
      </button>
    </div> 
  )
}

export default Nav