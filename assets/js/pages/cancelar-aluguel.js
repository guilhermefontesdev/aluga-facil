/* ==========================================================================
   T17 · Cancelar aluguel aceito, com multa pela política           RF18
   cancelar-aluguel.html?id=<pedido>  (só o locatário, antes do início)
   ========================================================================== */

(function (AF) {
  var $ = function (id) { return document.getElementById(id); };
  var form = $("cancelar-form");
  if (!form) return;

  var usuario = AF.sessao.usuario();
  var id = new URLSearchParams(location.search).get("id") || "";
  var r = AF.alugueis.buscar(id);
  var detalhe = "detalhe-aluguel.html?id=" + encodeURIComponent(id);

  if (!r || r.locatarioId !== usuario.id || AF.alugueis.situacao(r) !== "aceito") {
    AF.avisos.depois("Este aluguel não pode mais ser cancelado por aqui.", "aviso");
    location.replace(r ? detalhe : "meus-alugueis.html");
    return;
  }

  var dono = AF.usuarios.buscar(r.anuncianteId);
  var m = AF.alugueis.multa(r);
  var p = m.politica;

  $("cancelar-foto").innerHTML = AF.cardAnuncio.fotoHtml({ foto: r.foto, categoria: "" }, "item-resumo__foto");
  $("cancelar-item").textContent = r.nomeItem;
  $("cancelar-com").textContent = "Com " + (dono ? AF.perfil.primeiroNome(dono.nome) : "—") + " · " + AF.alugueis.descreverPeriodo(r.inicio, r.fim);
  $("cancelar-politica-nome").textContent = p.nome;
  $("cancelar-politica").textContent = p.texto;
  $("cancelar-manter").href = detalhe;

  var faixas = r.politica === "flexivel"
    ? [[0, "Até 24 h antes"], [50, "Menos de 24 h"]]
    : r.politica === "rigida"
      ? [[0, "7 dias ou mais"], [50, "Entre 48 h e 7 dias"], [100, "Menos de 48 h"]]
      : [[0, "3 dias ou mais"], [50, "Entre 24 h e 3 dias"], [100, "Menos de 24 h"]];
  $("cancelar-faixas").innerHTML = faixas.map(function (f) {
    return '<div class="faixa-multa' + (f[0] === m.percentual ? " faixa-multa--atual" : "") + '"><strong>' + f[0] + "%</strong><span>" + f[1] + "</span>" +
      (f[0] === m.percentual ? '<span class="faixa-multa__agora">Você está aqui</span>' : "") + "</div>";
  }).join("");

  $("cancelar-faltam").textContent = m.dias >= 1
    ? "Faltam " + m.dias + (m.dias === 1 ? " dia" : " dias") + " para o início."
    : "Faltam menos de 24 horas para o início.";
  $("cancelar-total").textContent = AF.formatar.preco(r.total);
  $("cancelar-multa-rotulo").textContent = "Multa (" + m.percentual + "%)";
  $("cancelar-multa").textContent = AF.formatar.preco(m.valor);

  AF.validacao.limparAoDigitar(form);
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (!AF.validacao.aplicar(form, form.elements.motivo.value ? {} : { motivo: "Escolha um motivo." })) return;
    if (!AF.alugueis.cancelar(id, form.elements.motivo.value)) {
      AF.avisos.mostrar("Não foi possível cancelar. Atualize a página.", "erro");
      return;
    }
    AF.avisos.depois("Aluguel cancelado." + (m.valor ? " Multa registrada: " + AF.formatar.preco(m.valor) + "." : " Sem multa."), "info");
    location.href = detalhe;
  });
})(window.AlugaFacil);
