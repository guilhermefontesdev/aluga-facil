/* ==========================================================================
   T01 a T06 · Entrada e conta: login, cadastro, confirmação de e-mail,
   cadastro concluído, esqueci a senha e nova senha.
   A tela é escolhida pelo data-tela do .entrada__grade.
   ========================================================================== */

(function (AF) {
  var grade = document.querySelector("[data-tela]");
  if (!grade) return;
  var tela = grade.dataset.tela;
  var params = new URLSearchParams(location.search);
  var V = AF.validacao;
  var CHAVE_CADASTRO = "alugafacil:cadastro-email";

  function valores(form) {
    var v = {};
    Array.prototype.forEach.call(form.elements, function (c) {
      if (!c.name) return;
      v[c.name] = c.type === "checkbox" ? c.checked : c.value;
    });
    return v;
  }

  /* Para onde ir depois de entrar: a página que pediu login, ou o início */
  function destino() {
    var voltar = params.get("voltar") || "";
    if (/^(index\.html|pages\/)/.test(voltar)) return AF.app.url(voltar);
    return AF.app.url("index.html");
  }

  /* ----- T04 Login ----- */
  if (tela === "login") {
    var form = document.getElementById("login-form");
    var erro = document.getElementById("login-erro");
    var atual = AF.sessao.usuario();

    var MOTIVOS = {
      solicitacao: "Entre na sua conta para continuar a solicitação de aluguel. Você volta para o mesmo anúncio.",
      anunciar: "Entre na sua conta para anunciar. O anúncio fica ligado ao seu perfil.",
      conta: "Entre na sua conta para ver esta página."
    };
    var motivo = params.get("motivo") || (params.get("voltar") ? "conta" : "");
    if (MOTIVOS[motivo]) {
      document.getElementById("login-motivo").hidden = false;
      document.getElementById("login-motivo-texto").textContent = MOTIVOS[motivo];
    }

    if (atual) {
      document.getElementById("login-atual").hidden = false;
      document.getElementById("login-atual-texto").textContent =
        "Você está conectado como " + atual.nome + ". Entre com outra conta para trocar de usuário.";
    }

    if (params.get("voltar")) {
      document.getElementById("login-criar").href = "cadastro.html?voltar=" + encodeURIComponent(params.get("voltar"));
    }

    function entrar(email, senha) {
      var usuario = AF.sessao.entrar(email, senha);
      if (!usuario) return false;
      AF.avisos.depois("Olá, " + AF.perfil.primeiroNome(usuario.nome) + "! Você entrou na sua conta.", "sucesso");
      location.href = destino();
      return true;
    }

    V.limparAoDigitar(form);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = valores(form);
      var erros = {};
      if (!V.emailValido(v.email)) erros.email = "Use um e-mail válido, como nome@email.com.";
      if (!v.senha) erros.senha = "Digite sua senha.";
      erro.hidden = true;
      if (!V.aplicar(form, erros)) return;
      if (!entrar(v.email, v.senha)) {
        erro.hidden = false;
        form.elements.senha.value = "";
        form.elements.senha.focus();
      }
    });

    // Contas de teste: um clique preenche e entra
    var lista = document.getElementById("contas-teste");
    lista.innerHTML = AF.usuarios.todos().map(function (u) {
      var eu = atual && atual.id === u.id;
      return '<li><button class="conta-teste" type="button" data-email="' + AF.app.esc(u.email) + '" data-senha="' + AF.app.esc(u.senha) + '"' + (eu ? ' aria-current="true"' : "") + ">" +
        '<span class="avatar">' + AF.perfil.iniciais(u.nome) + "</span>" +
        '<span class="conta-teste__texto"><strong>' + AF.app.esc(u.nome) + (eu ? " · conectada agora" : "") + "</strong>" + AF.app.esc(u.email) + "</span>" +
        '<span class="icone icone--seta-direita" aria-hidden="true"></span></button></li>';
    }).join("");
    lista.addEventListener("click", function (e) {
      var botao = e.target.closest("[data-email]");
      if (!botao) return;
      form.elements.email.value = botao.dataset.email;
      form.elements.senha.value = botao.dataset.senha;
      entrar(botao.dataset.email, botao.dataset.senha);
    });
  }

  /* ----- T01 Cadastro ----- */
  if (tela === "cadastro") {
    var cadastro = document.getElementById("cadastro-form");
    V.mascarar(cadastro.elements.cpf, "cpf");
    V.mascarar(cadastro.elements.telefone, "telefone");
    V.limparAoDigitar(cadastro);

    cadastro.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = valores(cadastro);
      if (!V.aplicar(cadastro, V.validarCadastro(v))) return;
      var partes = v.nascimento.split("-");
      var novo = AF.usuarios.criar({
        nome: v.nome, email: v.email, senha: v.senha, cpf: v.cpf,
        nascimento: partes[2] + "/" + partes[1] + "/" + partes[0], telefone: v.telefone
      });
      try { sessionStorage.setItem(CHAVE_CADASTRO, JSON.stringify({ id: novo.id, voltar: params.get("voltar") || "" })); } catch (erro) { /* nada */ }
      location.href = "confirmar-email.html";
    });
  }

  function cadastroPendente() {
    try { return JSON.parse(sessionStorage.getItem(CHAVE_CADASTRO)) || null; } catch (erro) { return null; }
  }

  /* ----- T02 Confirme seu e-mail ----- */
  if (tela === "confirmar-email") {
    var pendente = cadastroPendente();
    var novo = pendente && AF.usuarios.buscar(pendente.id);
    if (!novo) { location.replace("cadastro.html"); return; }
    document.getElementById("confirmar-email").textContent = novo.email;
    document.getElementById("confirmar-reenviar").addEventListener("click", function () {
      AF.avisos.mostrar("Enviamos o link de novo para " + novo.email + ".", "sucesso");
    });
    document.getElementById("confirmar-ok").addEventListener("click", function () {
      AF.usuarios.atualizar(novo.id, { confirmado: true });
      AF.sessao.entrarComo(novo.id);
      AF.notificacoes.criar(novo.id, "conta", "Bem-vindo ao AlugaFácil!", "Complete seu perfil com o endereço para anunciar e alugar mais rápido.", "pages/perfil/meu-perfil.html");
      location.href = "cadastro-concluido.html";
    });
  }

  /* ----- T03 Cadastro concluído ----- */
  if (tela === "concluido") {
    var usuario = AF.sessao.usuario();
    if (!usuario) { location.replace("login.html"); return; }
    document.getElementById("concluido-nome").textContent = "Olá, " + AF.perfil.primeiroNome(usuario.nome) + "! Sua conta";
    var info = cadastroPendente();
    if (info && info.voltar) {
      var primeiro = document.querySelector(".entrada__caixa .botao--primario");
      primeiro.textContent = "Continuar de onde parei";
      primeiro.href = AF.app.url(info.voltar);
    }
    try { sessionStorage.removeItem(CHAVE_CADASTRO); } catch (erro) { /* nada */ }
  }

  /* ----- T05 Esqueci a senha ----- */
  if (tela === "esqueci") {
    var esqueci = document.getElementById("esqueci-form");
    V.limparAoDigitar(esqueci);
    esqueci.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = esqueci.elements.email.value.trim();
      if (!V.aplicar(esqueci, V.emailValido(email) ? {} : { email: "Use um e-mail válido, como nome@email.com." })) return;
      document.getElementById("esqueci-pedido").hidden = true;
      document.getElementById("esqueci-enviado").hidden = false;
      document.getElementById("esqueci-email").textContent = email;
      var link = document.getElementById("esqueci-link");
      if (AF.usuarios.porEmail(email)) link.href = "nova-senha.html?email=" + encodeURIComponent(email);
      else link.hidden = true;
    });
    document.getElementById("esqueci-reenviar").addEventListener("click", function () {
      AF.avisos.mostrar("Link reenviado. Confira também a caixa de spam.", "info");
    });
  }

  /* ----- T06 Nova senha ----- */
  if (tela === "nova-senha") {
    var email = params.get("email") || "";
    var dono = AF.usuarios.porEmail(email);
    if (!dono) { location.replace("esqueci-senha.html"); return; }
    document.getElementById("nova-email").textContent = dono.email;
    var nova = document.getElementById("nova-form");
    V.limparAoDigitar(nova);
    nova.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = valores(nova);
      var erros = {};
      if (!V.senhaForte(v.senha)) erros.senha = "Mínimo de 8 caracteres, com pelo menos uma letra e um número.";
      if (v.confirmar !== v.senha) erros.confirmar = "As senhas não são iguais.";
      if (!V.aplicar(nova, erros)) return;
      AF.usuarios.trocarSenha(dono.email, v.senha);
      AF.sessao.sair();
      AF.avisos.depois("Senha alterada. Entre com a nova senha.", "sucesso");
      location.href = "login.html";
    });
  }
})(window.AlugaFacil);
