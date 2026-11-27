/* ==========================================================================
   T16 · Confirmar solicitação e "Solicitação enviada"              RF14–RF16
   Recebe do T15:  confirmar-solicitacao.html?anuncio=...&inicio=...&fim=...
   Ao enviar, salva o pedido (status "pendente") e abre a mesma página com
   ?id=<pedido>#enviada, que mostra a tela "Solicitação enviada".
   ========================================================================== */

(function (AF) {
  var form = document.getElementById("solicitacao-form");
  if (!form) return;

  var params = new URLSearchParams(location.search);

  function texto(id, valor) {
    document.getElementById(id).textContent = valor;
  }

  /* ----- "Solicitação enviada" (depois de enviar, ou ao recarregar a página) ----- */

  var pedidoId = params.get("id");
  if (pedidoId) {
    var enviado = AF.alugueis.buscar(pedidoId);
    if (enviado) {
      texto("enviada-numero", "Solicitação nº " + enviado.numero);
      document.getElementById("enviada-ver").href = "detalhe-aluguel.html?id=" + encodeURIComponent(enviado.id) + "&como=locatario";
    } else {
      location.replace("meus-alugueis.html");
    }
    return;
  }

  /* ----- formulário de confirmação ----- */

  var anuncio = AF.anuncios.buscar(params.get("anuncio") || "");
  var inicio = params.get("inicio");
  var fim = params.get("fim");

  // Se o endereço não tem anúncio ou as datas não valem mais, volta para escolher de novo
  if (!anuncio) {
    location.replace("../anuncios/busca.html");
    return;
  }
  var voltar = "../anuncios/detalhe-anuncio.html?id=" + encodeURIComponent(anuncio.id);
  var erros = AF.validacao.validarPeriodo({ inicio: inicio, fim: fim, anuncioId: anuncio.id });
  if (Object.keys(erros).length > 0) {
    location.replace(voltar);
    return;
  }

  var quantidade = AF.alugueis.dias(inicio, fim);
  var total = AF.alugueis.total(anuncio.precoDia, quantidade);

  document.getElementById("solicitacao-voltar").href = voltar;
  texto("solicitacao-item", anuncio.nome);
  texto("solicitacao-periodo", AF.alugueis.descreverPeriodo(inicio, fim));
  texto("solicitacao-diarias", quantidade + (quantidade === 1 ? " diária" : " diárias") + " × " + AF.formatar.preco(anuncio.precoDia));
  texto("solicitacao-subtotal", AF.formatar.preco(total));
  texto("solicitacao-total", AF.formatar.preco(total));

  form.addEventListener("submit", function (evento) {
    evento.preventDefault();

    var aluguel;
    try {
      aluguel = AF.alugueis.criar({
        anuncioId: anuncio.id,
        nomeItem: anuncio.nome,
        precoDia: anuncio.precoDia,
        inicio: inicio,
        fim: fim,
        mensagem: document.getElementById("mensagem-anunciante").value
      });
    } catch (erro) {
      AF.avisos.mostrar("Não foi possível salvar o pedido. O navegador está sem espaço.", "erro");
      return;
    }

    location.href = "confirmar-solicitacao.html?id=" + encodeURIComponent(aluguel.id) + "#enviada";
  });
})(window.AlugaFacil);
