import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../paginasCSS/Login.css";
import CabecalhoPagina from "../../componentes/CabecalhoPagina.jsx";
import CampoSenha from "../../componentes/CampoSenha.jsx";
import { saveSession } from "../../servicos/apiClient.js";
import { friendlyAuthMessage } from "../../servicos/authErrors.js";

const toTitleCase = (str) => {
  const preposicoes = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);
  return str.toLowerCase().split(' ').filter(Boolean).map((word, index) => {
    if (index !== 0 && preposicoes.has(word)) return word;
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
};

function CadastroAluno() {
  const navegar = useNavigate();
  const [nome, definirNome] = useState("");
  const [email, definirEmail] = useState("");
  const [senha, definirSenha] = useState("");
  const [confirmarSenha, definirConfirmarSenha] = useState("");
  const [erro, definirErro] = useState("");
  const [carregando, definirCarregando] = useState(false);

  const senhasDiferentes =
    confirmarSenha.length > 0 && senha !== confirmarSenha;

  async function cadastrarAluno(evento) {
    evento.preventDefault();
    definirErro("");

    if (senha !== confirmarSenha) {
      definirErro("As senhas precisam ser iguais.");
      return;
    }

    definirCarregando(true);

    try {
      // Substitua o fetch no CadastroAluno.jsx por este formato que atende ambas as convenções:
      const resposta = await fetch(`${import.meta.env.VITE_API_URL}/api/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: toTitleCase(nome),
          name: toTitleCase(nome), // Envia nas duas variantes
          email,
          senha,
          password: senha, // Envia nas duas variantes
          role: "STUDENT",
        }),
      });

      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) {
        let errorMsg = dados.message || dados.error || "Ocorreu um erro ao processar sua solicitação.";
        const normalizedError = errorMsg.toLowerCase();
        if (normalizedError.includes("error sending confirmation email") || normalizedError.includes("rate limit")) {
          errorMsg = "Limite de e-mails atingido. Tente novamente mais tarde ou entre em contato com o suporte.";
        }
        definirErro(errorMsg);
        return;
      }

      // 2. Se a API já retornar um token JWT no cadastro, salvamos a sessão
      const tokenRecebido =
        dados.token || dados.accessToken || dados.session?.access_token;
      if (tokenRecebido) {
        saveSession(dados.session || { access_token: tokenRecebido, refresh_token: dados.refresh_token });
        localStorage.setItem("nexo_user", JSON.stringify(dados.user || {}));
      }

      if (!tokenRecebido) {
        navegar('/cadastro/confirmar-codigo', { state: { email, role: 'STUDENT' } });
      } else {
        navegar('/login', { replace: true, state: { successMessage: 'Conta criada com sucesso! Você já pode fazer login.' } });
      }
    } catch (err) {
      definirErro(friendlyAuthMessage(err));
    } finally {
      definirCarregando(false);
    }
  }

  return (
    <main className="pagina-login animate-fade-in">
      <CabecalhoPagina nomePagina="Criar conta" showBack={false} />
      <div className="conteudo-central-login">
        <section
          className="cartao-login"
          aria-labelledby="titulo-cadastro-aluno"
        >
          <h1 id="titulo-cadastro-aluno" className="titulo-login">
            Criar Conta
          </h1>
          <p className="descricao-login">
            Preencha os dados abaixo para criar sua conta.
          </p>

          <nav
            className="seletor-perfil seletor-perfil-cadastro"
            aria-label="Tipo de cadastro"
          >
            <Link
              className="opcao-perfil opcao-perfil-ativa"
              to="/cadastro/aluno"
            >
              Sou Aluno
            </Link>
            <Link className="opcao-perfil" to="/cadastro/professor">
              Professor
            </Link>
          </nav>

          {/* Exibição de mensagens de erro retornado pela API */}
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

          <form className="formulario-login" onSubmit={cadastrarAluno}>
            <div className="grupo-campo">
              <label className="rotulo-campo" htmlFor="nome-aluno">
                NOME COMPLETO
              </label>
              <input
                className="campo-login"
                id="nome-aluno"
                name="nome"
                type="text"
                placeholder="Digite aqui seu nome"
                value={nome}
                onChange={(e) => definirNome(`${toTitleCase(e.target.value)}${e.target.value.endsWith(' ') ? ' ' : ''}`)}
                required
              />
            </div>

            <div className="grupo-campo">
              <label className="rotulo-campo" htmlFor="email-aluno">
                E-MAIL EDUCACIONAL/PESSOAL
              </label>
              <input
                className="campo-login"
                id="email-aluno"
                name="email"
                type="email"
                placeholder="aluno@email.com"
                value={email}
                onChange={(e) => definirEmail(e.target.value)}
                required
              />
            </div>

            <CampoSenha
              id="senha-aluno"
              value={senha}
              onChange={(evento) => definirSenha(evento.target.value)}
            />

            <CampoSenha
              id="confirmar-senha-aluno"
              rotulo="CONFIRMAR SENHA DE ACESSO"
              name="confirmarSenha"
              value={confirmarSenha}
              onChange={(evento) => definirConfirmarSenha(evento.target.value)}
              temErro={senhasDiferentes}
              mensagemErro="As senhas precisam ser iguais."
            />

            <button
              type="submit"
              className="botao-entrar"
              disabled={carregando || senhasDiferentes}
            >
              {carregando ? "Criando conta..." : "Criar conta"}
            </button>
          </form>

          <p className="rodape-login">
            Já tem uma conta?
            <Link className="link-cadastro" to="/login">
              Faça login aqui
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

export default CadastroAluno;
