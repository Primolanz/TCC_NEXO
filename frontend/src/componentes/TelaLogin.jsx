import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CampoSenha from "./CampoSenha.jsx";
import CabecalhoPagina from "./CabecalhoPagina.jsx";
import { apiClient, saveSession } from "../servicos/apiClient.js";
import "../paginasCSS/Login.css";

const caminhosPorPerfil = {
  aluno: "/login",
  professor: "/login/professor",
  administrador: "/login/administrador",
};

// URL da API configurada de forma dinâmica (Render ou Localhost)
function TelaLogin({ perfilAtivo, titulo, descricao, emailExemplo }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [mensagemAviso, setMensagemAviso] = useState("");
  const [validandoSessao, setValidandoSessao] = useState(() => perfilAtivo === "aluno" && Boolean(localStorage.getItem("nexo_token")));

  const navigate = useNavigate();

  useEffect(() => {
    if (perfilAtivo !== "aluno" || !localStorage.getItem("nexo_token")) return;

    let ativo = true;
    apiClient("/dashboard")
      .then((response) => {
        if (response.ok) navigate("/inicio", { replace: true });
      })
      .catch(() => {})
      .finally(() => { if (ativo) setValidandoSessao(false); });
    return () => { ativo = false; };
  }, [perfilAtivo, navigate]);

  async function manipularSubmissao(evento) {
    evento.preventDefault();
    setErro("");
    setCarregando(true);
    setMensagemAviso("");

    // Temporizador para avisar o usuário caso o servidor no Render esteja "acordando"
    const timerColdStart = setTimeout(() => {
      setMensagemAviso("Conectando aos servidores do NEXO... Isso pode levar alguns segundos na primeira conexão.");
    }, 2500);

    try {
      // 1. Requisitar login para a API Node.js (dinâmico)
      const rawUrl = import.meta.env.VITE_API_URL || 'https://nexo-backend.onrender.com';
      const cleanedUrl = rawUrl.replace(/^["'\[]+|["'\]\)]+$/g, '').replace(/\/+$/, '');
      const resposta = await fetch(`${cleanedUrl}/api/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const textoResposta = await resposta.text();
      let dados = {};
      if (textoResposta) {
        try {
          dados = JSON.parse(textoResposta);
        } catch {
          throw new Error(`Resposta inválida do servidor (HTTP ${resposta.status}).`);
        }
      }

      if (!resposta.ok) {
        throw new Error(
          dados.message || dados.error || `Erro (${resposta.status}) ao conectar ao servidor.`,
        );
      }

      // 2. Extrair e validar o Token JWT
      const tokenRecebido =
        dados.token || dados.accessToken || dados.session?.access_token;

      if (!tokenRecebido) {
        throw new Error("Servidor não retornou um token válido.");
      }

      // 3. Salvar o Token e dados do usuário no localStorage
      saveSession(dados.session || { access_token: tokenRecebido, refresh_token: dados.refresh_token });
      const usuario = dados.user || {};
      localStorage.setItem("nexo_user", JSON.stringify(usuario));

      // 4. Redirecionamento condicional inteligente
      const role = String(usuario.role || "").toUpperCase();
      const destinosPorPerfil = {
        STUDENT: "/inicio",
        TEACHER: "/professor/dashboard",
        ADMIN: "/admin/dashboard",
      };
      const destino = destinosPorPerfil[role];

      if (destino) {
        navigate(destino, { replace: true });
      } else {
        throw new Error("O perfil desta conta não possui um destino de acesso configurado.");
      }
    } catch (err) {
      setErro(err.message);
    } finally {
      clearTimeout(timerColdStart);
      setCarregando(false);
      setMensagemAviso("");
    }
  }

  if (validandoSessao) return <main className="pagina-login animate-fade-in" aria-busy="true" />;

  return (
    <main className="pagina-login animate-fade-in">
      <CabecalhoPagina nomePagina={`Login ${titulo}`} showBack={false} />
      <div className="conteudo-central-login">
        <section className="cartao-login" aria-labelledby="titulo-login">
          <h1 id="titulo-login" className="titulo-login">
            Acessar como {titulo}
          </h1>
          <p className="descricao-login">{descricao}</p>

          <nav className="seletor-perfil" aria-label="Tipo de acesso">
            {Object.entries(caminhosPorPerfil).map(([perfil, caminho]) => (
              <Link
                key={perfil}
                className={`opcao-perfil ${perfil === perfilAtivo ? "opcao-perfil-ativa" : ""}`}
                to={caminho}
              >
                {perfil === "aluno"
                  ? "Aluno"
                  : perfil === "professor"
                    ? "Professor"
                    : "Administrador"}
              </Link>
            ))}
          </nav>

          {/* Mensagem de Erro */}
          {erro && (
            <div
              style={{
                color: "#ef4444",
                backgroundColor: "#fee2e2",
                padding: "10px",
                borderRadius: "6px",
                marginBottom: "15px",
                fontSize: "14px",
                textAlign: "center",
              }}
            >
              {erro}
            </div>
          )}

          {/* Aviso de Cold Start do Render */}
          {mensagemAviso && (
            <div
              style={{
                color: "#c084fc",
                backgroundColor: "rgba(124, 58, 237, 0.15)",
                border: "1px solid rgba(168, 85, 247, 0.3)",
                padding: "10px",
                borderRadius: "6px",
                marginBottom: "15px",
                fontSize: "13px",
                textAlign: "center",
              }}
            >
              <span className="login-cold-start-spinner" aria-hidden="true" />{mensagemAviso}
            </div>
          )}

          <form className="formulario-login" onSubmit={manipularSubmissao}>
            <div className="grupo-campo">
              <label className="rotulo-campo" htmlFor={`email-${perfilAtivo}`}>
                E-MAIL EDUCACIONAL/PESSOAL
              </label>
              <input
                className="campo-login"
                id={`email-${perfilAtivo}`}
                name="email"
                type="email"
                placeholder={emailExemplo}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <CampoSenha
              id={`senha-${perfilAtivo}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="submit"
              className="botao-entrar"
              disabled={carregando}
            >
              {carregando ? "Entrando..." : "Entrar no Sistema"}
            </button>
          </form>

          {(perfilAtivo === "aluno" || perfilAtivo === "professor") && (
            <p className="rodape-login"><Link className="link-cadastro" to="/recuperar-senha">Esqueci minha senha</Link></p>
          )}

          {perfilAtivo === "aluno" || perfilAtivo === "professor" ? (
            <p className="rodape-login">
              Não tem uma conta?
              <Link className="link-cadastro" to={perfilAtivo === "professor" ? "/cadastro/professor" : "/cadastro/aluno"}>
                {perfilAtivo === "professor" ? "Criar conta" : "Crie uma aqui"}
              </Link>
            </p>
          ) : (
            <p className="rodape-login">
              Não possui acesso? Fale com o administrador.
            </p>
          )}
        </section>
      </div>
      {mensagemAviso && <div className="login-cold-start-backdrop" role="alertdialog" aria-modal="true" aria-live="assertive"><section className="login-cold-start-modal"><span className="login-cold-start-spinner" aria-hidden="true" /><strong>⏳ Conectando aos servidores do NEXO...</strong><p>Isso pode levar alguns segundos no primeiro acesso.</p></section></div>}
    </main>
  );
}

export default TelaLogin;
