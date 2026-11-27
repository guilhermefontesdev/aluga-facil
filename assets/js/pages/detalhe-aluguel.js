/* ==========================================================================
   T09 · Detalhe do aluguel · um estado para cada situação       RF14–RF21
   detalhe-aluguel.html?id=<pedido>
   O ponto de vista (locatário ou anunciante) vem de quem está logado.
     T09  pendente (anunciante): aceitar ou recusar (T09e)
     T09f pendente (locatário): aguardar ou desistir
     T09b aceito: contato liberado, cancelar (T17)
     T09c aguardando devolução (anunciante): confirmar devolução
     T09d concluído: avaliar a outra pessoa
     T09g expirado · recusado · cancelado
   ========================================================================== */

(function (AF) {
  var $ = function (id) { return document.getElementById(id); };
  if (!$("aluguel")) return;

  var usuario = AF.sessao.usuario();
  var e = AF.app.esc;
  var id = new URLSearchParams(location.search).get("id") || "";

  function naoEncontrado() {
    $("aluguel").hidden = true;
    $("aluguel-nao-encontrado").hidden = false;
  }

  function nome(u) { return u ? AF.perfil.primeiroNome(u.nome) : "Alguém"; }

  /* [tipo do aviso, ícone, texto] para cada situação e papel */
  function aviso(r, s, papel, outro) {
    var n = nome(outro);
    var textos = {
      pendente: papel === "locatario"
        ? ["info", "relogio", "Aguardando a resposta de " + n + " até " + AF.alugueis.prazoResposta(r) + ". Você será avisado por e-mail e WhatsApp."]
        : ["aviso", "relogio", "Responda até " + AF.alugueis.prazoResposta(r) + ". Depois disso, a solicitação expira."],
      aceito: papel === "locatario"
        ? ["sucesso", "check", n + " aceitou seu pedido! Combine a retirada pelo telefone."]
        : ["sucesso", "check", "Você aceitou este pedido. As datas ficaram bloqueadas e o contato de " + n + " foi liberado."],
      "em-andamento": ["info", "alugueis", papel === "locatario" ? "O item está com você até " + AF.alugueis.formatarData(r.fim, true) + "." : "O item está com " + n + " até " + AF.alugueis.formatarData(r.fim, true) + "."],
      devolucao: papel === "anunciante"
        ? ["aviso", "info", "O período terminou. Confirme quando o item voltar para você."]
        : ["aviso", "info", "O período terminou. Devolva o item para " + n + " confirmar a devolução."],
      concluido: ["sucesso", "check", "Aluguel concluído. Obrigado por usar o AlugaFácil!"],
      recusado: papel === "locatario"
        ? ["erro", "fechar", n + " recusou o pedido. Nenhum valor foi cobrado." + (r.motivo ? " Motivo: " + r.motivo : "")]
        : ["info", "fechar", "Você recusou este pedido." + (r.motivo ? " Motivo: " + r.motivo : "")],
      cancelado: ["info", "fechar", "Aluguel cancelado" + (r.motivo ? ": " + r.motivo : "") + "." + (r.multa ? " Multa registrada: " + AF.formatar.preco(r.multa) + "." : "")],
      expirado: ["info", "relogio", papel === "locatario" ? "A solicitação expirou sem resposta do anunciante. Nenhum valor foi cobrado." : "A solicitação expirou porque não foi respondida em 48 horas."]
    };
    return textos[s];
  }

  /* Etapas: pedido → aceito → com o locatário → concluído */
  function linhaTempo(s) {
    var etapas = ["Pedido enviado", "Aceito", "Em andamento", "Concluído"];
    var ate = { pendente: 0, aceito: 1, "em-andamento": 2, devolucao: 2, concluido: 3 }[s];
    var interrompido = ate === undefined;
    return etapas.map(function (nomeEtapa, i) {
      var classe = interrompido ? (i === 0 ? "feito" : "") : i < ate ? "feito" : i === ate ? "atual" : "";
      return '<li class="linha-tempo__etapa' + (classe ? " linha-tempo__etapa--" + classe : "") + '"><span class="linha-tempo__ponto"></span>' + nomeEtapa + "</li>";
    }).join("") + (interrompido ? '<li class="linha-tempo__etapa linha-tempo__etapa--parou"><span class="linha-tempo__ponto"></span>' + AF.alugueis.SITUACOES[s] + "</li>" : "");
  }

  function desenhar() {
    var r = AF.alugueis.buscar(id);
    if (!r) return naoEncontrado();
    var papel = AF.alugueis.papelDe(r, usuario.id);
    if (!papel) return naoEncontrado();

    var s = AF.alugueis.situacao(r);
    var outro = AF.usuarios.buscar(papel === "locatario" ? r.anuncianteId : r.locatarioId);
    document.title = r.nomeItem + " · Aluguel nº " + r.numero + " · AlugaFácil";

    $("aluguel-trilha").textContent = (r.status === "pendente" ? "Solicitação" : "Aluguel") + " nº " + r.numero;
    $("aluguel-numero").textContent = (r.status === "pendente" ? "Solicitação" : "Aluguel") + " nº " + r.numero + " · você é " + (papel === "locatario" ? "o locatário" : "o anunciante");
    $("aluguel-nome").textContent = r.nomeItem;
    var etiqueta = $("aluguel-etiqueta");
    etiqueta.className = "etiqueta etiqueta--" + AF.alugueis.ETIQUETAS[s];
    etiqueta.textContent = AF.alugueis.SITUACOES[s];
    $("aluguel-linha-tempo").innerHTML = linhaTempo(s);

    var a = aviso(r, s, papel, outro);
    $("aluguel-aviso").className = "aviso aviso--" + a[0];
    $("aluguel-aviso-icone").className = "icone aviso__icone icone--" + a[1];
    $("aluguel-aviso-texto").textContent = a[2];

    $("aluguel-foto").innerHTML = AF.cardAnuncio.fotoHtml({ foto: r.foto, categoria: "" }, "item-resumo__foto");
    $("aluguel-item-link").textContent = r.nomeItem;
    $("aluguel-item-link").href = "../anuncios/detalhe-anuncio.html?id=" + encodeURIComponent(r.anuncioId);
    $("aluguel-periodo").textContent = AF.alugueis.descreverPeriodo(r.inicio, r.fim);
    $("aluguel-diarias").textContent = r.dias + (r.dias === 1 ? " diária" : " diárias") + " × " + AF.formatar.preco(r.precoDia);
    $("aluguel-subtotal").textContent = AF.formatar.preco(r.dias * r.precoDia);
    $("aluguel-total").textContent = AF.formatar.preco(r.total);
    $("aluguel-multa-linha").hidden = !r.multa;
    $("aluguel-multa").textContent = AF.formatar.preco(r.multa || 0);
    var politica = AF.anuncios.POLITICAS[r.politica] || AF.anuncios.POLITICAS.moderada;
    $("aluguel-politica").textContent = "Política de cancelamento " + politica.nome.toLowerCase() + ": " + politica.texto;

    if (r.mensagem) {
      $("aluguel-mensagem-bloco").hidden = false;
      $("aluguel-mensagem-titulo").textContent = papel === "locatario" ? "Sua mensagem" : "Mensagem de " + nome(outro);
      $("aluguel-mensagem").textContent = "“" + r.mensagem + "”";
    } else {
      $("aluguel-mensagem-bloco").hidden = true;
    }

    // a outra pessoa
    $("aluguel-pessoa-rotulo").textContent = papel === "locatario" ? "Anunciante" : "Locatário";
    if (outro) {
      var rep = AF.perfil.reputacao(outro.id, papel === "locatario" ? "anunciante" : "locatario");
      $("aluguel-pessoa").href = "../perfil/perfil-publico.html?id=" + encodeURIComponent(outro.id);
      $("aluguel-pessoa").innerHTML = '<span class="avatar avatar--medio">' + AF.perfil.iniciais(outro.nome) + "</span><span>" +
        '<span class="pessoa__nome">' + e(outro.nome) + "</span><br>" +
        '<span class="nota"><span class="icone icone--estrela" aria-hidden="true"></span><strong>' + (rep.total ? AF.perfil.nota(rep.media) : "Novo") + "</strong>" +
        (rep.total ? " · " + rep.total + " avaliações como " + (papel === "locatario" ? "anunciante" : "locatário") : "") + "</span></span>";
    }
    var contatoLiberado = ["aceito", "em-andamento", "devolucao"].indexOf(s) !== -1;
    $("aluguel-contato").hidden = !contatoLiberado || !outro;
    if (contatoLiberado && outro) {
      $("aluguel-telefone").textContent = outro.telefone;
      $("aluguel-telefone").href = "tel:" + outro.telefone.replace(/\D/g, "");
      $("aluguel-endereco").textContent = papel === "locatario"
        ? [outro.rua, outro.bairro, outro.cidade].filter(Boolean).join(" · ")
        : [outro.bairro, outro.cidade].filter(Boolean).join(", ");
    }

    // ações
    var acoes = [];
    if (s === "pendente" && papel === "anunciante") {
      acoes.push('<button class="botao botao--primario botao--bloco" type="button" data-acao="aceitar">Aceitar pedido</button>');
      acoes.push('<button class="botao botao--contorno botao--bloco" type="button" data-acao="recusar">Recusar</button>');
    }
    if (s === "pendente" && papel === "locatario") {
      acoes.push('<button class="botao botao--contorno botao--bloco" type="button" data-acao="desistir">Cancelar solicitação</button>');
    }
    if (s === "aceito" && papel === "locatario") {
      acoes.push('<a class="botao botao--primario botao--bloco" href="tel:' + (outro ? outro.telefone.replace(/\D/g, "") : "") + '">Ligar para ' + e(nome(outro)) + "</a>");
      acoes.push('<a class="botao botao--texto botao--bloco botao--perigo-texto" href="cancelar-aluguel.html?id=' + encodeURIComponent(r.id) + '">Cancelar aluguel</a>');
    }
    if ((s === "devolucao" || s === "em-andamento") && papel === "anunciante") {
      acoes.push('<button class="botao botao--primario botao--bloco" type="button" data-acao="devolucao">Confirmar devolução</button>');
    }
    acoes.push('<a class="botao botao--texto botao--bloco" href="meus-alugueis.html">Voltar para meus aluguéis</a>');
    $("aluguel-acoes").innerHTML = acoes.join("");

    // avaliação (T09d)
    var avaliado = papel === "locatario" ? "anunciante" : "locatario";
    var avaliacoes = r.avaliacoes || {};
    var podeAvaliar = s === "concluido" && !avaliacoes[avaliado];
    $("aluguel-avaliar").hidden = !podeAvaliar;
    if (podeAvaliar) {
      $("avaliar-titulo").textContent = "Como foi alugar com " + nome(outro) + "?";
      $("avaliar-texto").textContent = "Sua nota vai para a reputação de " + nome(outro) + " como " + (avaliado === "anunciante" ? "anunciante" : "locatário") + ".";
      var estrelas = "";
      for (var i = 5; i >= 1; i--) {
        estrelas += '<input type="radio" name="nota" id="nota-' + i + '" value="' + i + '"><label for="nota-' + i + '" title="' + i + (i === 1 ? " estrela" : " estrelas") + '"><span class="icone icone--estrela" aria-hidden="true"></span><span class="visualmente-oculto">' + i + "</span></label>";
      }
      $("avaliar-estrelas").innerHTML = '<legend class="visualmente-oculto">Nota de 1 a 5</legend>' + estrelas;
    }
    var feitas = Object.keys(avaliacoes);
    $("aluguel-avaliacoes").hidden = feitas.length === 0;
    $("aluguel-avaliacoes-lista").innerHTML = feitas.map(function (k) {
      var quem = k === "anunciante" ? AF.usuarios.buscar(r.locatarioId) : AF.usuarios.buscar(r.anuncianteId);
      return '<li class="avaliacao"><p class="nota"><span class="icone icone--estrela" aria-hidden="true"></span><strong>' + avaliacoes[k].nota + "</strong> · " +
        e(quem ? quem.nome : "") + " avaliou o " + k + "</p>" + (avaliacoes[k].texto ? "<p>“" + e(avaliacoes[k].texto) + "”</p>" : "") + "</li>";
    }).join("");
  }

  function depoisDe(resultado, sucesso) {
    if (!resultado) AF.avisos.mostrar("Esse pedido já mudou de situação. Atualizamos a tela.", "aviso");
    else AF.avisos.mostrar(sucesso, "sucesso");
    desenhar();
    AF.app.atualizarCabecalho();
  }

  $("aluguel-acoes").addEventListener("click", function (ev) {
    var botao = ev.target.closest("[data-acao]");
    if (!botao) return;
    var acao = botao.dataset.acao;
    if (acao === "aceitar") depoisDe(AF.alugueis.aceitar(id), "Pedido aceito. As datas foram bloqueadas.");
    if (acao === "recusar") $("modal-recusar").showModal();
    if (acao === "desistir") $("modal-desistir").showModal();
    if (acao === "devolucao") depoisDe(AF.alugueis.confirmarDevolucao(id), "Devolução confirmada. Agora vocês podem se avaliar.");
  });

  $("modal-recusar").addEventListener("close", function () {
    if (this.returnValue === "recusar") depoisDe(AF.alugueis.recusar(id, $("motivo").value), "Pedido recusado.");
  });
  $("modal-desistir").addEventListener("close", function () {
    if (this.returnValue === "desistir") depoisDe(AF.alugueis.desistir(id), "Solicitação cancelada, sem multa.");
  });

  $("avaliar-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var nota = this.querySelector('input[name="nota"]:checked');
    if (!nota) { AF.avisos.mostrar("Escolha uma nota de 1 a 5 estrelas.", "aviso"); return; }
    var r = AF.alugueis.buscar(id);
    var papel = AF.alugueis.papelDe(r, usuario.id);
    depoisDe(AF.alugueis.avaliar(id, papel === "locatario" ? "anunciante" : "locatario", Number(nota.value), $("avaliar-comentario").value), "Avaliação enviada. Obrigado!");
  });

  desenhar();
})(window.AlugaFacil);
