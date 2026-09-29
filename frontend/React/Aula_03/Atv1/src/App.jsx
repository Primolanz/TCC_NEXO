import "./App.css";
import Header from "./header"
import Nav from "./nav"
import Buscar from "./cards"
import { useState } from "react";

function App() {

  const [carrinho, setCarrinho] = useState([]);

  const[dark, setDark] = useState(false);

  return (
    <div className={dark ? "dark" : ""}>
     <Header />
     <Nav carrinho={carrinho} dark={dark} setDark={setDark} />
     <Buscar carrinho={carrinho} setCarrinho={setCarrinho} />
    </div>
  )
}

export default App
