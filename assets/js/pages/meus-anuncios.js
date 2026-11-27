/* ==========================================================================
   T12 · Meus anúncios · lista os anúncios da pessoa logada        RF08–RF10
   Abas por status, pausar/reativar, editar e remover (T12c).
   ========================================================================== */

(function (AF) {
  var lista = document.getElementById("meus-lista");
  if (!lista) return;

  var usuario = AF.sessao.usuario();
  var e = AF.app.esc;
  var filtro = "todos";
  var removendo = null;
  var modal = document.getElementById("modal-remover");

  function infoAluguel(a) {
    var reservas = AF.alugueis.reservas(a.id);
    var agora = reservas.filter(function (r) { return AF.alugueis.situacao(r) === "em-andamento"; })[0];
    if (agora) return "Alugado agora, até " + AF.alugueis.formatarData(agora.fim, false);
    if (reservas[0]) return "Alugado de " + AF.alugueis.periodoCurto(reservas[0].inicio, reservas[0].fim);
    return "Nenhum aluguel ativo";
  }

  function desenhar() {
    var meus = AF.anuncios.doDono(usuario.id);
    var vazio = meus.length === 0;
    document.getElementById("meus-vazio").hidden = !vazio;
    document.getElementById("meus-abas").hidden = vazio;
    lista.hidden = vazio;

    var contagem = { todos: meus.length, ativo: 0, pausado: 0, rascunho: 0 };
    meus.forEach(function (a) { contagem[a.status]++; });
    document.querySelectorAll("#meus-abas .aba").forEach(function (aba) {
      var n = contagem[aba.dataset.filtro];
      aba.innerHTML = aba.textContent.replace(/\d+$/, "").trim() + ' <span class="aba__total">' + n + "</span>";
      aba.setAttribute("aria-selected", String(aba.dataset.filtro === filtro));
    });
    document.getElementById("meus-resumo").textContent = contagem.ativo + (contagem.ativo === 1 ? " anúncio ativo" : " anúncios ativos") +
      " · " + AF.alugueis.doUsuario(usuario.id).filter(function (r) { return r.anuncianteId === usuario.id && r.status === "concluido"; }).length + " aluguéis concluídos";

    var visiveis = meus.filter(function (a) { return filtro === "todos" || a.status === filtro; });
    if (visiveis.length === 0 && !vazio) {
      lista.innerHTML = '<li class="linhas__vazio">Nenhum anúncio nesta aba.</li>';
      return;
    }
    lista.innerHTML = visiveis.map(function (a) {
      var falta = AF.anuncios.pendencias(a);
      var info = a.status === "rascunho"
        ? (falta.length ? "Falta escolher " + falta.join(", ") : "Pronto para publicar")
        : a.status === "pausado" ? "Pausado: não aparece na busca" : infoAluguel(a);
      var pedidos = AF.alugueis.listar().filter(function (r) { return r.anuncioId === a.id; }).length;
      return '<li class="linha" data-id="' + a.id + '">' +
        AF.cardAnuncio.fotoHtml(a, "linha__foto") +
        '<div class="linha__principal">' +
          '<span class="etiqueta etiqueta--' + a.status + '">' + AF.anuncios.STATUS[a.status] + "</span>" +
          '<a class="linha__titulo" href="' + (a.status === "rascunho" ? "anunciar.html?id=" : "detalhe-anuncio.html?id=") + a.id + '">' + e(a.nome || "Sem nome") + "</a>" +
          '<p class="linha__detalhe">' + (a.precoDia ? AF.formatar.preco(a.precoDia) + "/dia · " : "") + e(info) + "</p>" +
        "</div>" +
        '<div class="linha__numeros so-computador"><strong>' + pedidos + "</strong>" + (pedidos === 1 ? "pedido" : "pedidos") + "</div>" +
        '<div class="linha__acoes">' +
          '<a class="botao botao--contorno botao--compacto" href="anunciar.html?id=' + a.id + '"><span class="icone icone--editar" aria-hidden="true"></span> Editar</a>' +
          (a.status === "ativo" ? '<button class="botao botao--texto botao--compacto" type="button" data-acao="pausar"><span class="icone icone--pausar" aria-hidden="true"></span> Pausar</button>' : "") +
          (a.status === "pausado" ? '<button class="botao botao--texto botao--compacto" type="button" data-acao="reativar"><span class="icone icone--play" aria-hidden="true"></span> Reativar</button>' : "") +
          '<button class="botao botao--texto botao--compacto linha__remover" type="button" data-acao="remover" aria-label="Remover ' + e(a.nome) + '"><span class="icone icone--lixeira" aria-hidden="true"></span></button>' +
        "</div>" +
      "</li>";
    }).join("");
    AF.cardAnuncio.consertarFotos(lista);
  }

  document.getElementById("meus-abas").addEventListener("click", function (ev) {
    var aba = ev.target.closest(".aba");
    if (!aba) return;
    filtro = aba.dataset.filtro;
    desenhar();
  });

  lista.addEventListener("click", function (ev) {
    var botao = ev.target.closest("[data-acao]");
    if (!botao) return;
    var id = botao.closest("[data-id]").dataset.id;
    var anuncio = AF.anuncios.buscar(id);
    if (botao.dataset.acao === "pausar") {
      AF.anuncios.mudarStatus(id, "pausado");
      AF.avisos.mostrar("Anúncio pausado. Ele não aparece mais na busca.", "info");
    }
    if (botao.dataset.acao === "reativar") {
      AF.anuncios.mudarStatus(id, "ativo");
      AF.avisos.mostrar("Anúncio reativado.", "sucesso");
    }
    if (botao.dataset.acao === "remover") {
      removendo = id;
      var ativos = AF.alugueis.reservas(id).length;
      document.getElementById("modal-remover-texto").textContent = "“" + anuncio.nome + "” sai da busca e não pode ser recuperado." +
        (ativos ? " Atenção: há " + ativos + " aluguel(is) aceito(s) para este item." : "");
      modal.showModal();
      return;
    }
    desenhar();
  });

  modal.addEventListener("close", function () {
    if (modal.returnValue === "remover" && removendo) {
      AF.anuncios.excluir(removendo);
      AF.avisos.mostrar("Anúncio removido.", "info");
      desenhar();
    }
    removendo = null;
  });

  desenhar();
})(window.AlugaFacil);
