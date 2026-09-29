import { useState } from "react";
import "./App.css";
import Paracetamol from "./assets/Paracetamol.png";
import Dipirona from "./assets/Dipirona.png";
import Ibuprofeno from "./assets/Ibuprofeno.png";
import Cotonete from "./assets/Cotonete.png";
import CremeNivea from "./assets/CremeNivea.png";
import Sabonete from "./assets/Sabonete.png";
import ShampooJohnson from "./assets/ShampooJohnson.png";

function Buscar({ carrinho, setCarrinho }) {
  const [busca, setBusca] = useState("");

  const filtrar = (lista) =>
    lista.toLowerCase().includes(busca.toLowerCase());

  const adicionarCarrinho = (item) => {
    setCarrinho([...carrinho, item]);
  }

  return (
    <main className="main">
      <div className="Cards">
        <div className="BarraBuscar">
          <input
            className="busca"
            type="text"
            placeholder="Buscar..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {filtrar("Paracetamol") && (
          <div className="Card">
            <h2>Paracetamol</h2>
            <p>
              O paracetamol e um medicamento muito utilizado para aliviar dores
              leves a moderadas, como dor de cabeca, dor muscular e dor de
              dente, alem de ajudar a reduzir a febre.
            </p>
            <img className="ImagemCard" src={Paracetamol} alt="Paracetamol" />
            <button onClick={() => adicionarCarrinho("Paracetamol")}>🛒 Adicionar</button>
          </div>
        )}

        {filtrar("Dipirona") && (
          <div className="Card">
            <h2>Dipirona</h2>
            <p>
              A dipirona e um medicamento muito utilizado para aliviar dores e
              reduzir a febre, sendo comum no tratamento de dores de cabeca,
              musculares e colicas.
            </p>
            <img className="ImagemCard" src={Dipirona} alt="Dipirona" />
            <button onClick={() => adicionarCarrinho("Dipirona")}>🛒 Adicionar</button>
          </div>
        )}

        {filtrar("Ibuprofeno") && (
          <div className="Card">
            <h2>Ibuprofeno</h2>
            <p>
              O ibuprofeno e um medicamento anti-inflamatorio utilizado para
              aliviar dores, reduzir a febre e combater inflamacoes em varias
              situacoes do dia a dia.
            </p>
            <img className="ImagemCard" src={Ibuprofeno} alt="Ibuprofeno" />
            <button onClick={() => adicionarCarrinho("Ibuprofeno")}>🛒 Adicionar</button>
          </div>
        )}

        {filtrar("Cotonete") && (
          <div className="Card">
            <h2>Cotonete</h2>
            <p>
              O cotonete e um item de higiene usado em pequenos cuidados
              pessoais e na limpeza externa, sempre com bastante cuidado no uso.
            </p>
            <img className="ImagemCard" src={Cotonete} alt="Cotonete" />
            <button onClick={() => adicionarCarrinho("Cotonete")}>🛒 Adicionar</button>
          </div>
        )}

        {filtrar("Creme Nivea") && (
          <div className="Card">
            <h2>Creme Nivea</h2>
            <p>
              O creme Nivea ajuda na hidratacao da pele, deixando-a mais macia
              e protegida contra o ressecamento no uso diario.
            </p>
            <img className="ImagemCard" src={CremeNivea} alt="Creme Nivea" />
            <button onClick={() => adicionarCarrinho("Creme Nivea")}>🛒 Adicionar</button>
          </div>
        )}

        {filtrar("Sabonete") && (
          <div className="Card">
            <h2>Sabonete</h2>
            <p>
              O sabonete de enxofre e bastante usado na limpeza da pele oleosa,
              ajudando a controlar a oleosidade e remover impurezas.
            </p>
            <img className="ImagemCard" src={Sabonete} alt="Sabonete" />
            <button onClick={() => adicionarCarrinho("Sabonete")}>🛒 Adicionar</button>
          </div>
        )}

        {filtrar("Shampoo Johnson") && (
          <div className="Card">
            <h2>Shampoo Johnson</h2>
            <p>
              O shampoo Johnson e conhecido por sua formula suave, sendo uma
              opcao pratica para a higiene infantil e para o uso diario.
            </p>
            <img className="ImagemCard" src={ShampooJohnson} alt="Shampoo Johnson"/>
            <button onClick={() => adicionarCarrinho("Shampoo Johnson")}>🛒 Adicionar</button>
          </div>
        )}
      </div>
    </main>
  );
}

export default Buscar;