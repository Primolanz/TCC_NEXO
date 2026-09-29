import { useState } from "react"
import "./App.css"

function Cards({nome, foto, descricaofoto}){
  const [votos, setvotos] = useState(0)

  function contarVotos(){
  setvotos(votos + 1)
  }

  return(
    <div className="DivCard">
        <div className="Card">
            <img className="imgCard" src={foto} alt={descricaofoto}></img>
            <h1 className="H1Card">{nome}</h1>
            <button className="buttonCard" onClick={contarVotos}>Vote</button>
            <h3 className="H3Card">Total de Votos: {votos}</h3>
        </div>
    </div>
  )}

export default Cards
