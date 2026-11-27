/* ==========================================================================
   T18 · Central de notificações · cards com ícone, texto e horário
   Clicar abre o aluguel e marca como lida. "Marcar todas como lidas".
   ========================================================================== */

(function (AF) {
  var lista = document.getElementById("notificacoes-lista");
  if (!lista) return;

  var usuario = AF.sessao.usuario();
  var e = AF.app.esc;
  var GRUPOS = { alugueis: ["solicitacao", "aceito", "recusado", "cancelado", "expirado", "lembrete", "andamento", "devolucao"], avaliacoes: ["avaliacao"] };

  function filtro() {
    return document.querySelector('input[name="filtro"]:checked').value;
  }

  function desenhar() {
    var todas = AF.notificacoes.doUsuario(usuario.id);
    var naoLidas = todas.filter(function (n) { return !n.lida; }).length;
    document.getElementById("notificacoes-resumo").textContent = naoLidas
      ? "Você tem " + naoLidas + (naoLidas === 1 ? " notificação não lida." : " notificações não lidas.")
      : "Tudo em dia. Nenhuma notificação nova.";
    document.getElementById("notificacoes-lidas").disabled = naoLidas === 0;

    var f = filtro();
    var visiveis = todas.filter(function (n) {
      if (f === "nao-lidas") return !n.lida;
      if (GRUPOS[f]) return GRUPOS[f].indexOf(n.tipo) !== -1;
      return true;
    });
    document.getElementById("notificacoes-vazio").hidden = visiveis.length !== 0;
    lista.innerHTML = visiveis.map(function (n) {
      var tipo = AF.notificacoes.TIPOS[n.tipo] || AF.notificacoes.TIPOS.conta;
      return '<a class="notificacao notificacao--grande' + (n.lida ? "" : " notificacao--nao-lida") + '" href="' + e(AF.app.url(n.link || "pages/notificacoes.html")) + '" data-id="' + n.id + '">' +
        '<span class="notificacao__icone notificacao__icone--' + tipo.cor + '"><span class="icone icone--' + tipo.icone + '" aria-hidden="true"></span></span>' +
        '<span class="notificacao__corpo"><span class="notificacao__titulo">' + e(n.titulo) + "</span>" +
        '<span class="notificacao__texto">' + e(n.texto) + "</span>" +
        '<span class="notificacao__tempo">' + AF.notificacoes.tempo(n.criadoEm) + "</span></span>" +
        (n.lida ? "" : '<span class="notificacao__ponto" aria-label="Não lida"></span>') +
        '<span class="notificacao__abrir">Abrir <span class="icone icone--seta-direita" aria-hidden="true"></span></span>' +
        "</a>";
    }).join("");
  }

  lista.addEventListener("click", function (ev) {
    var card = ev.target.closest("[data-id]");
    if (card) AF.notificacoes.marcarLida(card.dataset.id);
  });
  document.getElementById("notificacoes-filtro").addEventListener("change", desenhar);
  document.getElementById("notificacoes-lidas").addEventListener("click", function () {
    AF.notificacoes.marcarTodas(usuario.id);
    AF.app.atualizarCabecalho();
    desenhar();
    AF.avisos.mostrar("Todas as notificações foram marcadas como lidas.", "sucesso");
  });
  // o "Marcar como lidas" do sino também atualiza esta lista
  document.addEventListener("alugafacil:notificacoes", desenhar);
  desenhar();
})(window.AlugaFacil);
