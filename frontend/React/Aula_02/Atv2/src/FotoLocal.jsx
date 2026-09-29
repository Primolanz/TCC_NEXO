import Capa from './assets/VoltemosCapa.jpg'

function FotoLocal({ cor }) {
  return (
    <div>
      <h1 style={{ color: cor }}>Voltemos ao Inicio</h1>
      <img src={Capa} alt="Capa do louvor" style={{ width: '300px' }} />
      {/*esse whiteSpace: 'pre-line' serve pra quebrar o texto onde a linha estiver quebrada substituindo o pre */}
      <p style={{ whiteSpace: 'pre-line' }}>
        {`Voltemos ao inicio, voltemos ao principio
        Onde tudo era simples, onde tudo era belo
        Voltemos ao inicio, voltemos ao principio
        Onde tudo era simples, onde tudo era belo

        Leva-nos de volta ao primeiro amor
        Leva-nos de volta ao primeiro amor
        Leva-nos de volta ao primeiro amor (leva-nos)

        Sim, nos iremos contigo
        Amado amigo
        Retornaremos ao lugar que pertencemos`}
      </p>
    </div>
  )
}

export default FotoLocal
