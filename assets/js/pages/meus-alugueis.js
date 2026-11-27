/* ==========================================================================
   T08 · Meus aluguéis · pedidos em que a pessoa logada participa
   Abas: todos, como locatário (pedi) e como anunciante (recebi).
   Filtro de status. Sem pedidos: T08b (lista vazia).
   ========================================================================== */

(function (AF) {
  var lista = document.getElementById("alugueis-lista");
  if (!lista) return;

  var usuario = AF.sessao.usuario();
  var e = AF.app.esc;
  var params = new URLSearchParams(location.search);
  var papelFiltro = params.get("papel") || "todos";
  var statusFiltro = document.getElementById("alugueis-status");
  var pedidos = AF.alugueis.doUsuario(usuario.id);

  if (pedidos.length === 0) {
    document.getElementById("alugueis-barra").hidden = true;
    document.getElementById("alugueis-vazio").hidden = false;
    lista.hidden = true;
    return;
  }

  // números do topo
  var comoLocatario = pedidos.filter(function (r) { return r.locatarioId === usuario.id; });
  var comoAnunciante = pedidos.filter(function (r) { return r.anuncianteId === usuario.id; });
  var aResponder = comoAnunciante.filter(function (r) { return AF.alugueis.situacao(r) === "pendente"; }).length;
  var ganhos = comoAnunciante.filter(function (r) { return r.status === "concluido" || r.status === "aceito"; })
    .reduce(function (t, r) { return t + r.total; }, 0);
  document.getElementById("alugueis-numeros").innerHTML =
    '<li><strong>' + comoLocatario.length + "</strong>pedidos feitos</li>" +
    '<li><strong>' + aResponder + "</strong>para responder</li>" +
    '<li><strong>' + AF.formatar.preco(ganhos) + "</strong>em aluguéis recebidos</li>";

  function acaoDe(r, papel, s) {
    if (s === "pendente" && papel === "anunciante") return "Responder";
    if (s === "devolucao" && papel === "anunciante") return "Confirmar devolução";
    if (s === "concluido" && !(r.avaliacoes || {})[papel === "anunciante" ? "locatario" : "anunciante"]) return "Avaliar";
    return "Ver detalhes";
  }

  function desenhar() {
    document.querySelectorAll("#alugueis-abas .aba").forEach(function (aba) {
      aba.setAttribute("aria-selected", String(aba.dataset.papel === papelFiltro));
    });
    var visiveis = pedidos.filter(function (r) {
      var papel = AF.alugueis.papelDe(r, usuario.id);
      if (papelFiltro !== "todos" && papel !== papelFiltro) return false;
      if (statusFiltro.value && AF.alugueis.situacao(r) !== statusFiltro.value) return false;
      return true;
    });
    if (visiveis.length === 0) {
      lista.innerHTML = '<li class="linhas__vazio">Nenhum aluguel com esses filtros.</li>';
      return;
    }
    lista.innerHTML = visiveis.map(function (r) {
      var papel = AF.alugueis.papelDe(r, usuario.id);
      var outroId = papel === "locatario" ? r.anuncianteId : r.locatarioId;
      var outro = AF.usuarios.buscar(outroId);
      var s = AF.alugueis.situacao(r);
      var acao = acaoDe(r, papel, s);
      var link = "detalhe-aluguel.html?id=" + encodeURIComponent(r.id);
      return '<li class="linha linha--aluguel">' +
        AF.cardAnuncio.fotoHtml({ foto: r.foto, categoria: "" }, "linha__foto") +
        '<div class="linha__principal">' +
          '<span class="etiqueta etiqueta--' + AF.alugueis.ETIQUETAS[s] + '">' + AF.alugueis.SITUACOES[s] + "</span>" +
          '<a class="linha__titulo" href="' + link + '">' + e(r.nomeItem) + "</a>" +
          '<p class="linha__detalhe">Com ' + e(outro ? AF.perfil.primeiroNome(outro.nome) : "—") + " · " + AF.alugueis.periodoCurto(r.inicio, r.fim) + " · nº " + r.numero + "</p>" +
        "</div>" +
        '<div class="linha__valor"><strong>' + AF.formatar.preco(r.total) + "</strong>" + (papel === "locatario" ? "Você aluga" : "Você anuncia") + "</div>" +
        '<div class="linha__acoes"><a class="botao ' + (acao === "Ver detalhes" ? "botao--contorno" : "botao--primario") + ' botao--compacto" href="' + link + '">' + acao + "</a></div>" +
      "</li>";
    }).join("");
    AF.cardAnuncio.consertarFotos(lista);
  }

  document.getElementById("alugueis-abas").addEventListener("click", function (ev) {
    var aba = ev.target.closest(".aba");
    if (!aba) return;
    papelFiltro = aba.dataset.papel;
    desenhar();
  });
  statusFiltro.addEventListener("change", desenhar);
  desenhar();
})(window.AlugaFacil);
