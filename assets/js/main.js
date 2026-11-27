/* ==========================================================================
   Estrutura comum a todas as telas
   - monta o cabeçalho (visitante ou logado), o menu inferior do celular
     e o rodapé, a partir de quem está logado
   - sino com as 3 últimas notificações e menu da conta (com nome e e-mail
     sempre atualizados)
   - telas com <body data-acesso="privado"> pedem login antes

   Atributos no <body>:
     data-menu="inicio | buscar | comparar | anunciar | alugueis | perfil"
     data-acesso="privado"      -> precisa estar logado
     data-layout="entrada"      -> telas de login e cadastro (cabeçalho simples)

   Uso nas telas:
     AlugaFacil.app.url("pages/anuncios/busca.html")  -> caminho certo a partir da raiz
     AlugaFacil.app.foto(anuncio.foto)                -> endereço da imagem
     AlugaFacil.app.esc(texto)                        -> texto seguro para innerHTML
     AlugaFacil.app.atualizarCabecalho()              -> redesenha (ex.: depois de salvar o perfil)
   ========================================================================== */

window.AlugaFacil = window.AlugaFacil || {};

(function (AF) {
  var script = document.currentScript;
  var RAIZ = script ? script.src.replace(/assets\/js\/main\.js.*$/, "") : "";
  var corpo = document.body;

  function url(caminho) {
    return RAIZ + String(caminho || "").replace(/^\//, "");
  }

  function foto(src) {
    if (!src) return "";
    return /^(https?:|data:|blob:)/.test(src) ? src : url(src);
  }

  function esc(texto) {
    return String(texto === undefined || texto === null ? "" : texto)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* Caminho da página atual a partir da raiz (para voltar depois do login) */
  function aquiRelativo() {
    var atual = location.href.split("#")[0];
    return atual.indexOf(RAIZ) === 0 ? atual.slice(RAIZ.length) : "index.html";
  }

  function irParaLogin(motivo) {
    var destino = url("pages/auth/login.html") + "?voltar=" + encodeURIComponent(aquiRelativo());
    if (motivo) destino += "&motivo=" + encodeURIComponent(motivo);
    location.replace(destino);
  }

  /* ----- proteção das telas que pedem login ----- */
  var usuario = AF.sessao.usuario();
  if (corpo.dataset.acesso === "privado" && !usuario) {
    corpo.hidden = true;
    irParaLogin(corpo.dataset.motivo || "");
    return;
  }

  /* ----- menus ----- */
  var MENU = [
    { id: "inicio", rotulo: "Início", icone: "inicio", href: "index.html" },
    { id: "buscar", rotulo: "Buscar", icone: "buscar", href: "pages/anuncios/busca.html" },
    { id: "comparar", rotulo: "Comparar", icone: "comparar", href: "pages/anuncios/comparador.html" },
    { id: "anunciar", rotulo: "Anunciar", icone: "anunciar", href: "pages/anuncios/anunciar.html" },
    { id: "alugueis", rotulo: "Aluguéis", icone: "alugueis", href: "pages/alugueis/meus-alugueis.html", logado: true }
  ];

  function linkMenu(item, classe, atual) {
    return '<a class="' + classe + '" href="' + url(item.href) + '"' + (item.id === atual ? ' aria-current="page"' : "") + ">" +
      (classe.indexOf("barra-inferior") === 0 ? '<span class="icone icone--' + item.icone + '" aria-hidden="true"></span>' : "") +
      item.rotulo + "</a>";
  }

  function htmlNotificacao(n) {
    var tipo = AF.notificacoes.TIPOS[n.tipo] || AF.notificacoes.TIPOS.conta;
    return '<a class="notificacao' + (n.lida ? "" : " notificacao--nao-lida") + '" href="' + url(n.link || "pages/notificacoes.html") + '" data-notificacao="' + n.id + '">' +
      '<span class="notificacao__icone notificacao__icone--' + tipo.cor + '"><span class="icone icone--' + tipo.icone + '" aria-hidden="true"></span></span>' +
      '<span class="notificacao__corpo">' +
        '<span class="notificacao__titulo">' + esc(n.titulo) + "</span>" +
        '<span class="notificacao__texto">' + esc(n.texto) + "</span>" +
        '<span class="notificacao__tempo">' + AF.notificacoes.tempo(n.criadoEm) + "</span>" +
      "</span>" +
      (n.lida ? "" : '<span class="notificacao__ponto" aria-label="Não lida"></span>') +
      "</a>";
  }

  function cabecalhoLogado(u, atual) {
    var naoLidas = AF.notificacoes.naoLidas(u.id);
    var ultimas = AF.notificacoes.doUsuario(u.id).slice(0, 3);
    var avatar = u.foto
      ? '<img class="avatar avatar--foto" src="' + esc(foto(u.foto)) + '" alt="">'
      : '<span class="avatar" aria-hidden="true">' + AF.perfil.iniciais(u.nome) + "</span>";

    return '<div class="container cabecalho__conteudo">' +
      '<a class="cabecalho__logo" href="' + url("index.html") + '"><img class="logo__imagem" src="' + url("assets/img/logo/alugafacil.png") + '" alt="AlugaFácil" width="120" height="45"></a>' +
      '<nav class="cabecalho__menu" aria-label="Menu principal">' + MENU.map(function (i) { return linkMenu(i, "cabecalho__link", atual); }).join("") + "</nav>" +
      '<div class="cabecalho__acoes">' +
        '<div class="suspenso" data-suspenso>' +
          '<button class="cabecalho__sino" type="button" aria-expanded="false" aria-controls="painel-sino" aria-label="Notificações' + (naoLidas ? ", " + naoLidas + " não lidas" : "") + '"' + (atual === "notificacoes" ? ' aria-current="page"' : "") + ">" +
            '<span class="icone icone--sino" aria-hidden="true"></span>' +
            (naoLidas ? '<span class="contador">' + naoLidas + "</span>" : "") +
          "</button>" +
          '<div class="suspenso__painel painel-sino" id="painel-sino" hidden>' +
            '<div class="painel-sino__topo"><p class="painel-sino__titulo">Notificações</p>' +
              (naoLidas ? '<button class="link-botao" type="button" data-marcar-lidas>Marcar como lidas</button>' : "") + "</div>" +
            (ultimas.length
              ? '<div class="painel-sino__lista">' + ultimas.map(htmlNotificacao).join("") + "</div>"
              : '<p class="painel-sino__vazio">Você não tem notificações.</p>') +
            '<a class="painel-sino__todas" href="' + url("pages/notificacoes.html") + '">Ver todas as notificações</a>' +
          "</div>" +
        "</div>" +
        '<div class="suspenso" data-suspenso>' +
          '<button class="menu-conta__botao" type="button" aria-expanded="false" aria-controls="painel-conta" aria-label="Menu da conta de ' + esc(u.nome) + '">' +
            avatar + '<span class="menu-conta__primeiro so-computador">' + esc(AF.perfil.primeiroNome(u.nome)) + "</span>" +
            '<span class="icone icone--seta-baixo so-computador" aria-hidden="true"></span>' +
          "</button>" +
          '<div class="suspenso__painel menu-conta__painel" id="painel-conta" hidden>' +
            '<div class="menu-conta__cabeca">' + avatar +
              '<div><p class="menu-conta__nome">' + esc(u.nome) + '</p><p class="menu-conta__email">' + esc(u.email) + "</p></div></div>" +
            '<a class="menu-conta__item" href="' + url("pages/perfil/meu-perfil.html") + '"><span class="icone icone--perfil" aria-hidden="true"></span>Meu perfil</a>' +
            '<a class="menu-conta__item" href="' + url("pages/anuncios/meus-anuncios.html") + '"><span class="icone icone--anunciar" aria-hidden="true"></span>Meus anúncios</a>' +
            '<a class="menu-conta__item" href="' + url("pages/alugueis/meus-alugueis.html") + '"><span class="icone icone--alugueis" aria-hidden="true"></span>Meus aluguéis</a>' +
            '<a class="menu-conta__item" href="' + url("pages/perfil/perfil-publico.html?id=" + u.id) + '"><span class="icone icone--olho" aria-hidden="true"></span>Ver perfil público</a>' +
            '<hr class="menu-conta__divisor">' +
            '<a class="menu-conta__item" href="' + url("pages/auth/login.html?trocar=1") + '"><span class="icone icone--trocar" aria-hidden="true"></span>Trocar de conta</a>' +
            '<button class="menu-conta__item menu-conta__sair" type="button" data-sair><span class="icone icone--sair" aria-hidden="true"></span>Sair</button>' +
          "</div>" +
        "</div>" +
      "</div>" +
    "</div>";
  }

  function cabecalhoVisitante(atual, entrada) {
    var menu = entrada ? "" : '<nav class="cabecalho__menu" aria-label="Menu principal">' +
      MENU.filter(function (i) { return !i.logado; }).map(function (i) { return linkMenu(i, "cabecalho__link", atual); }).join("") + "</nav>";
    return '<div class="container cabecalho__conteudo">' +
      '<a class="cabecalho__logo" href="' + url("index.html") + '"><img class="logo__imagem" src="' + url("assets/img/logo/alugafacil.png") + '" alt="AlugaFácil" width="120" height="45"></a>' + menu +
      '<div class="cabecalho__acoes">' +
        '<a class="botao botao--texto botao--compacto" href="' + url("pages/auth/login.html") + '">Entrar</a>' +
        '<a class="botao botao--primario botao--compacto" href="' + url("pages/auth/cadastro.html") + '">Cadastrar</a>' +
      "</div></div>";
  }

  function barraInferior(u, atual) {
    var itens = u
      ? [MENU[0], MENU[1], MENU[3], MENU[4], { id: "perfil", rotulo: "Perfil", icone: "perfil", href: "pages/perfil/meu-perfil.html" }]
      : [MENU[0], MENU[1], MENU[2], MENU[3], { id: "entrar", rotulo: "Entrar", icone: "perfil", href: "pages/auth/login.html" }];
    return '<ul class="barra-inferior__lista">' + itens.map(function (i) { return "<li>" + linkMenu(i, "barra-inferior__item", atual) + "</li>"; }).join("") + "</ul>";
  }

  function rodape(u) {
    var conta = u
      ? '<li><a href="' + url("pages/perfil/meu-perfil.html") + '">Meu perfil</a></li><li><a href="' + url("pages/anuncios/meus-anuncios.html") + '">Meus anúncios</a></li><li><a href="' + url("pages/alugueis/meus-alugueis.html") + '">Meus aluguéis</a></li><li><a href="' + url("pages/notificacoes.html") + '">Notificações</a></li>'
      : '<li><a href="' + url("pages/auth/login.html") + '">Entrar</a></li><li><a href="' + url("pages/auth/cadastro.html") + '">Criar conta</a></li><li><a href="' + url("pages/auth/esqueci-senha.html") + '">Esqueci a senha</a></li>';
    return '<div class="container rodape__conteudo">' +
      '<div class="rodape__marca"><a class="cabecalho__logo" href="' + url("index.html") + '"><img class="logo__imagem" src="' + url("assets/img/logo/alugafacil-claro.png") + '" alt="AlugaFácil" width="146" height="55"></a>' +
        "<p>Alugue o que precisa, perto de você. Anuncie o que está parado e ganhe uma renda extra.</p></div>" +
      '<nav class="rodape__coluna" aria-label="Explorar"><p class="rodape__titulo">Explorar</p><ul>' +
        '<li><a href="' + url("pages/anuncios/busca.html") + '">Buscar itens</a></li>' +
        '<li><a href="' + url("pages/anuncios/comparador.html") + '">Alugar ou comprar?</a></li>' +
        '<li><a href="' + url("pages/anuncios/anunciar.html") + '">Anunciar um item</a></li></ul></nav>' +
      '<nav class="rodape__coluna" aria-label="Sua conta"><p class="rodape__titulo">Sua conta</p><ul>' + conta + "</ul></nav>" +
    "</div>" +
    '<div class="container rodape__base"><p>© ' + new Date().getFullYear() + " AlugaFácil · Projeto acadêmico · Processos de Software</p></div>";
  }

  function garantir(seletor, tag, classe, antesDe) {
    var el = document.querySelector(seletor);
    if (!el) {
      el = document.createElement(tag);
      el.className = classe;
      if (antesDe) corpo.insertBefore(el, antesDe);
      else corpo.appendChild(el);
    }
    return el;
  }

  /* ----- painéis suspensos (sino e conta) ----- */
  function fecharPaineis(exceto) {
    document.querySelectorAll("[data-suspenso]").forEach(function (s) {
      if (s === exceto) return;
      var botao = s.querySelector("button[aria-expanded]");
      var painel = s.querySelector(".suspenso__painel");
      if (botao) botao.setAttribute("aria-expanded", "false");
      if (painel) painel.hidden = true;
    });
  }

  function ligarCabecalho(cab) {
    cab.querySelectorAll("[data-suspenso]").forEach(function (s) {
      var botao = s.querySelector("button[aria-expanded]");
      var painel = s.querySelector(".suspenso__painel");
      botao.addEventListener("click", function (e) {
        e.stopPropagation();
        var abrir = painel.hidden;
        fecharPaineis(s);
        painel.hidden = !abrir;
        botao.setAttribute("aria-expanded", String(abrir));
      });
      painel.addEventListener("click", function (e) { e.stopPropagation(); });
    });

    var sair = cab.querySelector("[data-sair]");
    if (sair) sair.addEventListener("click", function () {
      AF.sessao.sair();
      if (AF.avisos) AF.avisos.depois("Você saiu da sua conta.", "info");
      location.href = url("index.html");
    });

    var lidas = cab.querySelector("[data-marcar-lidas]");
    if (lidas) lidas.addEventListener("click", function () {
      AF.notificacoes.marcarTodas(AF.sessao.usuario().id);
      atualizarCabecalho();
      document.dispatchEvent(new CustomEvent("alugafacil:notificacoes"));
    });

    cab.querySelectorAll("[data-notificacao]").forEach(function (link) {
      link.addEventListener("click", function () { AF.notificacoes.marcarLida(link.dataset.notificacao); });
    });
  }

  document.addEventListener("click", function () { fecharPaineis(null); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") fecharPaineis(null); });

  function atualizarCabecalho() {
    var u = AF.sessao.usuario();
    var atual = corpo.dataset.menu || "";
    var entrada = corpo.dataset.layout === "entrada";
    var main = document.querySelector("main");

    var cab = garantir(".cabecalho", "header", "cabecalho", corpo.firstElementChild);
    cab.innerHTML = u && !entrada ? cabecalhoLogado(u, atual) : cabecalhoVisitante(atual, entrada);
    ligarCabecalho(cab);

    if (!entrada) {
      var barra = garantir(".barra-inferior", "nav", "barra-inferior", main ? main.nextSibling : null);
      barra.setAttribute("aria-label", "Menu");
      barra.innerHTML = barraInferior(u, atual);
    }

    var rod = garantir(".rodape", "footer", "rodape", null);
    rod.innerHTML = rodape(u);
    var restaurar = rod.querySelector("[data-restaurar]");
    if (restaurar) restaurar.addEventListener("click", function () {
      AF.dados.restaurar();
      if (AF.avisos) AF.avisos.depois("Dados de exemplo restaurados. Entre com uma das contas de teste.", "sucesso");
      location.href = url("index.html");
    });
  }

  atualizarCabecalho();
  corpo.classList.add("pronto");

  AF.app = {
    raiz: RAIZ,
    url: url,
    foto: foto,
    esc: esc,
    usuario: function () { return AF.sessao.usuario(); },
    irParaLogin: irParaLogin,
    atualizarCabecalho: atualizarCabecalho
  };
})(window.AlugaFacil);
