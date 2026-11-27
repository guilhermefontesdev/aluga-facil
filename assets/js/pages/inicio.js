/* ==========================================================================
   T11 · Página inicial
   Logado: "Olá, Maria", pendências e itens perto (sem os seus).
   Visitante (T11v): chamada geral e "Como funciona".
   ========================================================================== */

(function (AF) {
  var usuario = AF.sessao.usuario();
  var e = AF.app.esc;

  if (usuario) {
    document.getElementById("inicio-titulo").textContent = "Olá, " + AF.perfil.primeiroNome(usuario.nome);
    document.getElementById("inicio-subtitulo").textContent = "O que você precisa hoje?";
  }

  // categorias no filtro e nos quadros
  var select = document.getElementById("inicio-categoria");
  AF.anuncios.CATEGORIAS.forEach(function (c) {
    var op = document.createElement("option");
    op.value = c;
    op.textContent = c;
    select.appendChild(op);
  });

  var ativos = AF.anuncios.listar();
  document.getElementById("inicio-categorias").innerHTML = AF.anuncios.CATEGORIAS.map(function (c) {
    var total = ativos.filter(function (a) { return a.categoria === c; }).length;
    return '<li><a class="categoria" href="' + AF.app.url("pages/anuncios/busca.html?categoria=" + encodeURIComponent(c)) + '">' +
      '<span class="categoria__icone"><span class="icone icone--' + AF.anuncios.ICONES[c] + '" aria-hidden="true"></span></span>' +
      '<span class="categoria__nome">' + e(c) + "</span>" +
      '<span class="categoria__total">' + total + (total === 1 ? " item" : " itens") + "</span></a></li>";
  }).join("");

  // itens perto: sem os da própria pessoa; mesma cidade primeiro
  var cidade = usuario ? usuario.cidade : "";
  var perto = ativos
    .filter(function (a) { return !usuario || a.donoId !== usuario.id; })
    .sort(function (a, b) {
      var mesmaA = cidade && a.local.indexOf(cidade) !== -1 ? 0 : 1;
      var mesmaB = cidade && b.local.indexOf(cidade) !== -1 ? 0 : 1;
      return mesmaA - mesmaB;
    })
    .slice(0, 8);

  var lista = document.getElementById("inicio-anuncios");
  if (perto.length === 0) {
    lista.hidden = true;
    document.getElementById("inicio-vazio").hidden = false;
  } else {
    AF.cardAnuncio.preencher(lista, perto);
  }

  if (usuario) document.querySelector(".como-funciona").hidden = true;

  // pendências do usuário logado
  if (!usuario) return;
  var pendencias = [];
  AF.alugueis.doUsuario(usuario.id).forEach(function (r) {
    var s = AF.alugueis.situacao(r);
    var papel = AF.alugueis.papelDe(r, usuario.id);
    var link = AF.app.url("pages/alugueis/detalhe-aluguel.html?id=" + r.id);
    if (s === "pendente" && papel === "anunciante") pendencias.push({ icone: "alugueis", texto: "Responda o pedido de " + r.nomeItem + " até " + AF.alugueis.prazoResposta(r), link: link, acao: "Responder" });
    if (s === "devolucao" && papel === "anunciante") pendencias.push({ icone: "check", texto: "Confirme a devolução de " + r.nomeItem, link: link, acao: "Confirmar" });
    if (s === "concluido" && !(r.avaliacoes || {})[papel === "anunciante" ? "locatario" : "anunciante"]) pendencias.push({ icone: "estrela", texto: "Avalie o aluguel de " + r.nomeItem, link: link, acao: "Avaliar" });
    if (s === "aceito" && papel === "locatario") pendencias.push({ icone: "calendario", texto: "Retirada de " + r.nomeItem + " em " + AF.alugueis.formatarData(r.inicio, false), link: link, acao: "Ver detalhes" });
  });
  if (pendencias.length) {
    var caixa = document.getElementById("inicio-pendencias");
    caixa.hidden = false;
    caixa.innerHTML = '<p class="pendencias__titulo">Para você agora</p><ul class="pendencias__lista">' + pendencias.slice(0, 4).map(function (p) {
      return '<li><a class="pendencia" href="' + p.link + '"><span class="pendencia__icone"><span class="icone icone--' + p.icone + '" aria-hidden="true"></span></span>' +
        '<span class="pendencia__texto">' + e(p.texto) + '</span><span class="pendencia__acao">' + p.acao + "</span></a></li>";
    }).join("") + "</ul>";
  }
})(window.AlugaFacil);
