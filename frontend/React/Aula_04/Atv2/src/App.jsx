import Header from "./Header"
import "./App.css"
import Cards from "./Cards"
import FlorRoxa from "./assets/FlorRoxa.png"
import FlorRosa from "./assets/FlorRosa.png"
import FlorLaranja from "./assets/FlorLaranja.png"
import FlorAzul from "./assets/FlorAzul.png"
import FlorAmarela from "./assets/FlorAmarela.png"

function App(){
  return(
    <div>
      <Header />
      <div className="CardsApp">
        <Cards 
        nome = {"Flor Roxa"}
        foto={FlorRoxa}
        descricaofoto = {"Flor Roxa"}/>
        <Cards 
        nome = {"Flor Rosa"}
        foto={FlorRosa}
        descricaofoto = {"Flor Rosa"}/>
        <Cards 
        nome = {"Flor Laranja"}
        foto={FlorLaranja}
        descricaofoto = {"Flor Laranja"}/>
      </div>
      <div className="CardsApp">
        <Cards 
        nome = {"Flor Azul"}
        foto={FlorAzul}
        descricaofoto = {"Flor Azul"}/>
        <Cards 
        nome = {"Flor Amarela"}
        foto={FlorAmarela}
        descricaofoto = {"Flor Amarela"}/>
      </div>
    </div>
  )}

export default App
