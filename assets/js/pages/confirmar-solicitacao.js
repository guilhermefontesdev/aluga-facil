/* ==========================================================================
   T16 · Confirmar solicitação e T16b "Solicitação enviada"       RF14–RF16
   Vem do T15: confirmar-solicitacao.html?anuncio=...&inicio=...&fim=...
   Depois de enviar: ?id=<pedido>#enviada
   ========================================================================== */

(function (AF) {
  var $ = function (id) { return document.getElementById(id); };
  var form = $("solicitacao-form");
  if (!form) return;

  var params = new URLSearchParams(location.search);
  var usuario = AF.sessao.usuario();

  /* ----- T16b ----- */
  if (params.get("id")) {
    var pedido = AF.alugueis.buscar(params.get("id"));
    if (!pedido) { location.replace("meus-alugueis.html"); return; }
    var dono = AF.usuarios.buscar(pedido.anuncianteId);
    $("solicitacao").hidden = true;
    $("solicitacao-faixa").hidden = true;
    $("enviada").hidden = false;
    $("enviada-numero").textContent = "Solicitação nº " + pedido.numero + " · " + pedido.nomeItem;
    $("enviada-texto").textContent = (dono ? AF.perfil.primeiroNome(dono.nome) : "O anunciante") + " tem até 48 horas para responder. Avisaremos você por e-mail e WhatsApp.";
    $("enviada-ver").href = "detalhe-aluguel.html?id=" + encodeURIComponent(pedido.id);
    return;
  }

  /* ----- T16 ----- */
  var anuncio = AF.anuncios.buscar(params.get("anuncio") || "");
  var inicio = params.get("inicio");
  var fim = params.get("fim");
  if (!anuncio || anuncio.status !== "ativo") { location.replace("../anuncios/busca.html"); return; }
  var voltar = "../anuncios/detalhe-anuncio.html?id=" + encodeURIComponent(anuncio.id) + "&inicio=" + inicio + "&fim=" + fim;
  if (anuncio.donoId === usuario.id) {
    AF.avisos.depois("Você não pode alugar o seu próprio anúncio.", "aviso");
    location.replace(voltar);
    return;
  }
  if (Object.keys(AF.validacao.validarPeriodo({ inicio: inicio, fim: fim, anuncioId: anuncio.id })).length) {
    AF.avisos.depois("Essas datas não estão mais disponíveis. Escolha outro período.", "aviso");
    location.replace(voltar);
    return;
  }

  var dono = AF.usuarios.buscar(anuncio.donoId);
  var politica = AF.anuncios.POLITICAS[anuncio.politica] || AF.anuncios.POLITICAS.moderada;
  var dias = AF.alugueis.dias(inicio, fim);
  var cheio = dias * anuncio.precoDia;
  var total = AF.alugueis.total(anuncio.precoDia, dias, anuncio.precoSemana, anuncio.precoMes);

  $("solicitacao-trilha-item").textContent = anuncio.nome;
  $("solicitacao-trilha-item").href = voltar;
  $("solicitacao-foto").innerHTML = AF.cardAnuncio.fotoHtml(anuncio, "item-resumo__foto");
  $("solicitacao-item").textContent = anuncio.nome;
  $("solicitacao-dono").textContent = "Anunciado por " + (dono ? dono.nome : "—") + " · " + anuncio.local;
  $("solicitacao-periodo").textContent = AF.alugueis.descreverPeriodo(inicio, fim);
  $("solicitacao-voltar").href = voltar;
  $("solicitacao-politica-nome").textContent = politica.nome;
  $("solicitacao-politica").textContent = politica.texto;
  $("solicitacao-diarias").textContent = dias + (dias === 1 ? " diária" : " diárias") + " × " + AF.formatar.preco(anuncio.precoDia);
  $("solicitacao-subtotal").textContent = AF.formatar.preco(cheio);
  $("solicitacao-desconto-linha").hidden = total >= cheio;
  $("solicitacao-desconto").textContent = "− " + AF.formatar.preco(cheio - total);
  $("solicitacao-total").textContent = AF.formatar.preco(total);

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (!$("solicitacao-aceite").checked) {
      AF.avisos.mostrar("Marque que leu a política de cancelamento para enviar.", "aviso");
      $("solicitacao-aceite").focus();
      return;
    }
    var pedido;
    try {
      pedido = AF.alugueis.criar({ anuncioId: anuncio.id, locatarioId: usuario.id, inicio: inicio, fim: fim, mensagem: $("mensagem").value });
    } catch (erro) {
      AF.avisos.mostrar("Não foi possível salvar o pedido. O navegador está sem espaço.", "erro");
      return;
    }
    location.href = "confirmar-solicitacao.html?id=" + encodeURIComponent(pedido.id) + "#enviada";
  });
})(window.AlugaFacil);
