/* ==========================================================================
   Usuários, sessão (login) e reputação                    RF01–RF05
   Usado por todas as telas: o cabeçalho mostra quem está logado.

   Uso:
     AlugaFacil.sessao.usuario()              -> usuário logado ou null
     AlugaFacil.sessao.entrar(email, senha)   -> usuário ou null (dados errados)
     AlugaFacil.sessao.sair()
     AlugaFacil.usuarios.buscar(id)           -> usuário ou null
     AlugaFacil.usuarios.porEmail(email)      -> usuário ou null
     AlugaFacil.usuarios.criar(dados)         -> usuário criado (T01)
     AlugaFacil.usuarios.atualizar(id, dados) -> usuário atualizado (T07)
     AlugaFacil.usuarios.trocarSenha(email, senha)
     AlugaFacil.perfil.reputacao(id, papel)   -> { media, total }
     AlugaFacil.perfil.avaliacoes(id, papel)  -> avaliações recebidas
     AlugaFacil.perfil.avaliar(dados)         -> grava uma avaliação
     AlugaFacil.perfil.iniciais(nome)         -> "MS"
     AlugaFacil.perfil.primeiroNome(nome)     -> "Maria"
   ========================================================================== */

window.AlugaFacil = window.AlugaFacil || {};

(function (AF) {
  var D = AF.dados;
  var EDITAVEIS = ["nome", "email", "telefone", "cep", "estado", "cidade", "bairro", "rua", "whatsapp", "apresentacao", "foto"];
  var MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

  function todos() { return D.ler("usuarios"); }

  function buscar(id) {
    return todos().filter(function (u) { return u.id === id; })[0] || null;
  }

  function normalizarEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function porEmail(email) {
    var alvo = normalizarEmail(email);
    return todos().filter(function (u) { return normalizarEmail(u.email) === alvo; })[0] || null;
  }

  function criar(dados) {
    var lista = todos();
    var hoje = new Date();
    var usuario = {
      id: D.novoId("u"),
      nome: String(dados.nome || "").trim(),
      email: normalizarEmail(dados.email),
      senha: String(dados.senha || ""),
      cpf: String(dados.cpf || "").trim(),
      nascimento: String(dados.nascimento || "").trim(),
      telefone: String(dados.telefone || "").trim(),
      cep: "", estado: "BA", cidade: "Salvador", bairro: "", rua: "",
      whatsapp: true, apresentacao: "", foto: "",
      desde: MESES[hoje.getMonth()] + " de " + hoje.getFullYear(),
      confirmado: false
    };
    lista.push(usuario);
    if (!D.gravar("usuarios", lista)) throw new Error("armazenamento-cheio");
    return usuario;
  }

  function atualizar(id, dados) {
    var lista = todos();
    var indice = lista.findIndex(function (u) { return u.id === id; });
    if (indice === -1) return null;
    EDITAVEIS.forEach(function (campo) {
      if (dados[campo] === undefined) return;
      var valor = dados[campo];
      lista[indice][campo] = typeof valor === "string" ? valor.trim() : valor;
    });
    if (dados.email) lista[indice].email = normalizarEmail(dados.email);
    if (dados.confirmado !== undefined) lista[indice].confirmado = !!dados.confirmado;
    if (!D.gravar("usuarios", lista)) throw new Error("armazenamento-cheio");
    return lista[indice];
  }

  function trocarSenha(email, senha) {
    var usuario = porEmail(email);
    if (!usuario) return null;
    var lista = todos();
    lista.forEach(function (u) { if (u.id === usuario.id) u.senha = senha; });
    D.gravar("usuarios", lista);
    return usuario;
  }

  /* Endereço que aparece no anúncio: só bairro e cidade */
  function local(usuario) {
    if (!usuario) return "";
    return [usuario.bairro, usuario.cidade].filter(Boolean).join(", ");
  }

  /* ----- sessão ----- */

  function usuario() {
    var sessao = D.ler("sessao", null);
    return sessao ? buscar(sessao.usuarioId) : null;
  }

  function entrar(email, senha) {
    var encontrado = porEmail(email);
    if (!encontrado || encontrado.senha !== senha) return null;
    D.gravar("sessao", { usuarioId: encontrado.id, desde: new Date().toISOString() });
    return encontrado;
  }

  function entrarComo(id) {
    if (!buscar(id)) return null;
    D.gravar("sessao", { usuarioId: id, desde: new Date().toISOString() });
    return buscar(id);
  }

  function sair() {
    D.apagar("sessao");
  }

  /* ----- reputação (RF05) ----- */

  function avaliacoes(id, papel) {
    return D.ler("avaliacoes")
      .filter(function (a) { return a.avaliadoId === id && (!papel || a.papel === papel); })
      .sort(function (a, b) { return b.criadoEm.localeCompare(a.criadoEm); });
  }

  function reputacao(id, papel) {
    var lista = avaliacoes(id, papel);
    if (lista.length === 0) return { media: 0, total: 0 };
    var soma = lista.reduce(function (total, a) { return total + a.nota; }, 0);
    return { media: Math.round((soma / lista.length) * 10) / 10, total: lista.length };
  }

  function avaliar(dados) {
    var lista = D.ler("avaliacoes");
    var nova = {
      id: D.novoId("v"),
      avaliadoId: dados.avaliadoId,
      papel: dados.papel,
      autor: dados.autor,
      nota: Number(dados.nota),
      texto: String(dados.texto || "").trim(),
      criadoEm: new Date().toISOString()
    };
    lista.push(nova);
    D.gravar("avaliacoes", lista);
    return nova;
  }

  function iniciais(nome) {
    var partes = String(nome || "").trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return "?";
    var ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
    return (partes[0][0] + ultima).toUpperCase();
  }

  function primeiroNome(nome) {
    return String(nome || "").trim().split(/\s+/)[0] || "";
  }

  /* 4.7 -> "4,7" */
  function nota(valor) {
    return Number(valor || 0).toFixed(1).replace(".", ",");
  }

  AF.usuarios = { todos: todos, buscar: buscar, porEmail: porEmail, criar: criar, atualizar: atualizar, trocarSenha: trocarSenha, local: local };
  AF.sessao = { usuario: usuario, entrar: entrar, entrarComo: entrarComo, sair: sair };
  AF.perfil = { avaliacoes: avaliacoes, reputacao: reputacao, avaliar: avaliar, iniciais: iniciais, primeiroNome: primeiroNome, nota: nota };
})(window.AlugaFacil);
