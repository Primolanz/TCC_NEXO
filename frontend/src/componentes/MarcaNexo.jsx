import imagemLogoNexo from '../assets/NEXO_LOGO-sem-fundo.png'

export default function MarcaNexo({ variant = 'sidebar' }) {
  return <img className={`marca-nexo marca-nexo-${variant}`} src={imagemLogoNexo} alt="NEXO" />
}
