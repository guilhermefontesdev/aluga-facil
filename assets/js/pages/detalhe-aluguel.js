/* ==========================================================================
   T09 · Detalhe do aluguel · aceitar ou recusar e acompanhar o status  RF14–RF16
   Abre com detalhe-aluguel.html?id=...&como=locatario  (quem pediu)
         ou detalhe-aluguel.html?id=...&como=anunciante (dono do item).
   Sem ?id, a página mostra os exemplos de cada status, como sempre.
   O dono aceita ou recusa um pedido pendente; quem pediu vê o status.
   ========================================================================== */

(function (AF) {
  var modelo = document.getElementById("modelo-aluguel");
  var params = new URLSearchParams(location.search);
  var id = params.get("id");
  if (!modelo || !id) return;

  var container = modelo.parentElement;
  container.querySelectorAll(".aluguel-estado").forEach(function (exemplo) { exemplo.remove(); });

  // o papel escolhido fica salvo, para o T08 mostrar a lista do mesmo ponto de vista
  if (params.get("como")) AF.alugueis.definirPapel(params.get("como"));

  var atual = null;

  function aluguel() {
    return AF.alugueis.buscar(id);
  }

  function campo(raiz, nome, valor) {
    var el = raiz.querySelector('[data-campo="' + nome + '"]');
    if (el) el.textContent = valor;
  }

  function tirar(raiz, parte) {
    var el = raiz.querySelector('[data-parte="' + parte + '"]');
    if (el) el.remove();
  }

  /* Texto e cor do aviso de cada status, para cada ponto de vista */
  function aviso(pedido, papel) {
    var anunciante = AF.alugueis.PESSOAS.anunciante.primeiroNome;
    var solicitante = AF.alugueis.PESSOAS.locatario.primeiroNome;

    if (pedido.status === "pendente") {
      return papel === "locatario"
        ? ["info", "info", "Aguardando a resposta de " + anunciante + " até " + AF.alugueis.prazoResposta(pedido) + ". Você será avisado por e-mail e WhatsApp."]
        : ["aviso", "info", "Responda até " + AF.alugueis.prazoResposta(pedido) + ". Depois disso, a solicitação expira."];
    }
    if (pedido.status === "aceito") {
      return papel === "locatario"
        ? ["sucesso", "check", anunciante + " aceitou seu pedido! Combine a retirada pelo telefone."]
        : ["sucesso", "check", "Você aceitou este pedido. As datas ficaram bloqueadas na agenda e o contato de " + solicitante + " foi liberado."];
    }
    var motivo = pedido.motivo ? " Motivo: " + pedido.motivo : "";
    return papel === "locatario"
      ? ["aviso", "info", anunciante + " recusou o pedido. Nenhum valor foi cobrado." + motivo]
      : ["info", "info", "Você recusou este pedido." + motivo];
  }

  function desenhar() {
    var pedido = aluguel();
    if (!pedido) {
      if (atual) atual.remove();
      document.getElementById("aluguel-nao-encontrado").hidden = false;
      return;
    }

    var papel = AF.alugueis.papel();
    var outra = AF.alugueis.PESSOAS[papel === "locatario" ? "anunciante" : "locatario"];
    var secao = modelo.content.firstElementChild.cloneNode(true);

    // alternar o ponto de vista
    secao.querySelectorAll("[data-papel-link]").forEach(function (link) {
      var esteAtual = link.dataset.papelLink === papel;
      link.href = "detalhe-aluguel.html?id=" + encodeURIComponent(pedido.id) + "&como=" + link.dataset.papelLink;
      if (esteAtual) {
        link.setAttribute("aria-current", "true");
        link.style.fontWeight = "var(--fonte-peso-semibold)";
      }
    });

    var etiqueta = secao.querySelector('[data-campo="etiqueta"]');
    etiqueta.classList.add("etiqueta--" + pedido.status);
    etiqueta.textContent = AF.alugueis.STATUS[pedido.status];

    campo(secao, "numero", "Solicitação nº " + pedido.numero);
    campo(secao, "nome", pedido.nomeItem);
    campo(secao, "periodo", AF.alugueis.descreverPeriodo(pedido.inicio, pedido.fim));
    campo(secao, "diarias", pedido.dias + (pedido.dias === 1 ? " diária" : " diárias") + " × " + AF.formatar.preco(pedido.precoDia));
    campo(secao, "subtotal", AF.formatar.preco(pedido.total));
    campo(secao, "total", AF.formatar.preco(pedido.total));

    campo(secao, "pessoa-rotulo", papel === "locatario" ? "Anunciante" : "Solicitante");
    campo(secao, "pessoa-inicial", outra.inicial);
    campo(secao, "pessoa-nome", outra.nome);

    if (pedido.mensagem) {
      campo(secao, "mensagem-rotulo", papel === "locatario" ? "Sua mensagem" : "Mensagem de " + outra.primeiroNome);
      campo(secao, "mensagem", "“" + pedido.mensagem + "”");
    } else {
      tirar(secao, "mensagem");
    }

    var textoAviso = aviso(pedido, papel);
    var caixa = secao.querySelector('[data-campo="aviso"]');
    caixa.classList.add("aviso--" + textoAviso[0]);
    secao.querySelector('[data-campo="aviso-icone"]').classList.add("icone--" + textoAviso[1]);
    campo(secao, "aviso-texto", textoAviso[2]);

    // só aparece o que cabe em cada situação
    var pendente = pedido.status === "pendente";
    if (!(pendente && papel === "anunciante")) {
      tirar(secao, "decisao");
      tirar(secao, "modal-recusar");
    }
    if (!(pendente && papel === "locatario")) {
      tirar(secao, "desistir");
      tirar(secao, "modal-desistir");
    }
    if (!(pedido.status === "aceito" && papel === "locatario")) tirar(secao, "contato");
    if (pendente && papel === "locatario") tirar(secao, "voltar");

    campo(secao, "recusar-texto", outra.primeiroNome + " será avisado por e-mail e WhatsApp. Essa resposta não pode ser alterada depois.");
    campo(secao, "desistir-texto", AF.alugueis.PESSOAS.anunciante.primeiroNome + " ainda não respondeu, então não há multa. O pedido sai da lista dele.");

    if (atual) atual.replaceWith(secao);
    else container.appendChild(secao);
    atual = secao;
    ligar(secao);
  }

  function responder(status, extras, mensagem) {
    var atualizado;
    try {
      atualizado = AF.alugueis.mudarStatus(id, status, extras);
    } catch (erro) {
      AF.avisos.mostrar("Não foi possível salvar. O navegador está sem espaço.", "erro");
      return;
    }
    if (!atualizado) {
      AF.avisos.mostrar("Este pedido já foi respondido.", "aviso");
      desenhar();
      return;
    }
    desenhar();
    AF.avisos.mostrar(mensagem, "sucesso");
  }

  function ligar(secao) {
    var aceitar = secao.querySelector('[data-acao="aceitar"]');
    if (aceitar) {
      aceitar.addEventListener("click", function () {
        responder("aceito", {}, "Pedido aceito. As datas foram bloqueadas.");
      });
    }

    var recusar = secao.querySelector('[data-form="recusar"]');
    if (recusar) {
      recusar.addEventListener("submit", function (evento) {
        evento.preventDefault();
        responder("recusado", { motivo: recusar.elements.motivo.value }, "Pedido recusado.");
      });
    }

    var desistir = secao.querySelector('[data-form="desistir"]');
    if (desistir) {
      desistir.addEventListener("submit", function (evento) {
        evento.preventDefault();
        AF.alugueis.excluir(id);
        AF.avisos.depois("Solicitação cancelada.", "info");
        location.href = "meus-alugueis.html";
      });
    }
  }

  desenhar();
})(window.AlugaFacil);
