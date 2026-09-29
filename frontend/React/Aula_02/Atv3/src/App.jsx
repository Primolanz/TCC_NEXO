import Cards from "./Cards"
import Arraia from "./assets/Arraia.jpg"
import AguaViva from "./assets/AguaViva.jpg"

function App(){
  return(
    <div>
      <Cards
        titulo="Arraia"
        descricao="Arraia azul e laranja"
        foto={Arraia}
        status="Ativo"
      />

      <Cards
        titulo="Agua Viva"
        descricao="Agua viva transparente"
        foto={AguaViva}
        status="Inativo"
      />
    </div>
  )
}

export default App
