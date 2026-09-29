function Home(){
    const Cards = [
        {
            titulo: "Meteorologia",
            emoji: "🌦️",
            descricao: "Veja a previsão do tempo e informações climáticas em tempo real.",
            rota: "/clima",
        },
        {
            titulo: "Música",
            emoji: "🎵",
            descricao: "Explore músicas, artistas e descubra novos sons.",
            rota: "/musica",
        },
        {
            titulo: "Geolocalização",
            emoji: "📍",
            descricao: "Encontre locais próximos e veja sua localização em tempo real.",
            rota: "/geolocalizacao",
        },
        {
            titulo: "Marvel",
            emoji: "🦸‍♂️",
            descricao: "Explore personagens, filmes e o universo Marvel.",
            rota: "/marvel",
        },
        {
            titulo: "Inteligência Artificial",
            emoji: "🤖",
            descricao: "Aprenda e explore ferramentas e conceitos de IA.",
            rota: "/ia",
        }

    ];

    return(
        <div className="Home">
            <header className="HeaderHome">
                <h1>API Explorer</h1>
                <p>Bem-vindo ao portal de APIs em React. Explore exemplos práticos
                    de
                </p>
            </header>
        </div>
    )
}

export default Home;