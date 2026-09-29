import "./App.css";
import Logo from "./assets/Logo_Farmacia.png"


function Header() {
  return (
    <div className="BodyHeader">
      <img src={Logo} alt="Logo Farmacia" style={{ width: '400px' }}></img>
    </div>
  )
}

export default Header