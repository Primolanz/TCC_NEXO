function Card({ titulo, descricao, foto, status }) {
  return (
    <div>
      <h1>{titulo}</h1>
      <p>{descricao}</p>
      <img src={foto} alt={titulo} style={{ width: '300px' }} />
      <h3>Status: {status}</h3>
    </div>
  )
}

export default Card
