import { useEffect, useState } from "react";
import fogos from "./assets/fogos.jpg"


function Formatura(){
    const [contador, setContador] = useState(10);
    const [mensagemErro, setMensagemErro] = useState("");

    function Dias(){
        setContador(contador => contador - 1);
    }

    useEffect(() => {
        if (contador == 0){
          setMensagemErro("Chegou o dia da formaturaaaaaaa, parabéns formando 🎉🎉") 

        } 
    }, [contador]);

    return(
        <div>
            <h1>Contagem regressiva para a formatura</h1>
            <p>{contador}</p>
            <button onClick={Dias}>Contar Dias</button>
            
            <h2>{mensagemErro}</h2>
            {contador === 0 && (
                <img src={fogos} alt="Formatura" />
            )}
        </div>    
    )
}

export default Formatura