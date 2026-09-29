import { useState } from "react";
import "./App.css"

function Titulo() {
    const [cor, setCor] = useState("blue");

    function mudarCor() {
        setCor("red");
    }

    return (
        <div>
            <h1 style={{ color: cor }}>Titulos</h1>
            <button className="BotãoMudaCorTitulo" onClick={mudarCor}>Mudar a cor</button>
        </div>
    );
}

export default Titulo;