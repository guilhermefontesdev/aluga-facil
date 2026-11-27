/* ==========================================================================
   T15 · Detalhe do anúncio e escolha do período                 RF13–RF17
   Abre com detalhe-anuncio.html?id=<anúncio>
   Visitante (T15v): o botão leva ao login e volta para cá com as datas.
   Dono (T15c): vê ações de editar e pausar no lugar da reserva.
   ========================================================================== */

(function (AF) {
  var $ = function (id) { return document.getElementById(id); };
  if (!$("detalhe")) return;

  var e = AF.app.esc;
  var params = new URLSearchParams(location.search);
  var anuncio = AF.anuncios.buscar(params.get("id") || "");
  var usuario = AF.sessao.usuario();
  var souDono = anuncio && usuario && anuncio.donoId === usuario.id;

  if (!anuncio || (anuncio.status !== "ativo" && !souDono)) {
    $("detalhe").hidden = true;
    $("detalhe-indisponivel").hidden = false;
    return;
  }

  document.title = anuncio.nome + " · AlugaFácil";
  var dono = AF.usuarios.buscar(anuncio.donoId);
  var politica = AF.anuncios.POLITICAS[anuncio.politica] || AF.anuncios.POLITICAS.moderada;

  $("detalhe-trilha-categoria").textContent = anuncio.categoria;
  $("detalhe-trilha-categoria").href = "busca.html?categoria=" + encodeURIComponent(anuncio.categoria);
  $("detalhe-trilha-nome").textContent = anuncio.nome;
  $("detalhe-foto").innerHTML = AF.cardAnuncio.fotoHtml(anuncio, "detalhe__imagem");
  AF.cardAnuncio.consertarFotos($("detalhe-foto"));
  $("detalhe-categoria").textContent = anuncio.categoria;
  $("detalhe-nome").textContent = anuncio.nome;
  $("detalhe-local").textContent = anuncio.local;
  $("detalhe-descricao").textContent = anuncio.descricao;
  if (anuncio.regras) $("detalhe-regras").textContent = anuncio.regras;
  else $("detalhe-regras-bloco").hidden = true;
  $("detalhe-politica-nome").textContent = politica.nome;
  $("detalhe-politica").textContent = politica.texto;

  var precos = [[anuncio.precoDia, "por dia"], [anuncio.precoSemana, "por semana"], [anuncio.precoMes, "por mês"]];
  $("detalhe-precos").innerHTML = precos.filter(function (p) { return p[0]; }).map(function (p) {
    return '<li class="precos__item"><strong>' + AF.formatar.preco(p[0]) + "</strong><span>" + p[1] + "</span></li>";
  }).join("");

  if (dono) {
    var rep = AF.perfil.reputacao(dono.id, "anunciante");
    var concluidos = AF.alugueis.listar().filter(function (r) { return r.anuncianteId === dono.id && r.status === "concluido"; }).length;
    $("detalhe-dono").href = "../perfil/perfil-publico.html?id=" + encodeURIComponent(dono.id);
    $("detalhe-dono").innerHTML = '<span class="avatar avatar--medio">' + AF.perfil.iniciais(dono.nome) + "</span><span>" +
      '<span class="pessoa__nome">' + e(dono.nome) + "</span><br>" +
      '<span class="nota"><span class="icone icone--estrela" aria-hidden="true"></span><strong>' + (rep.total ? AF.perfil.nota(rep.media) : "Novo") + "</strong>" +
      (rep.total ? " · " + rep.total + " avaliações" : "") + "</span><br>" +
      '<span class="pessoa__rotulo">' + concluidos + " aluguéis concluídos · No AlugaFácil desde " + e(dono.desde) + "</span></span>";
  }

  var reservas = AF.alugueis.reservas(anuncio.id);
  $("detalhe-reservas").innerHTML = reservas.length
    ? reservas.map(function (r) { return '<li><span class="icone icone--calendario" aria-hidden="true"></span>' + AF.alugueis.descreverPeriodo(r.inicio, r.fim) + "</li>"; }).join("")
    : '<li class="reservas__livre"><span class="icone icone--check" aria-hidden="true"></span>Nenhuma data reservada. Todas livres.</li>';

  /* ----- dono ----- */
  if (souDono) {
    $("reserva-form").hidden = true;
    $("dono-painel").hidden = false;
    $("dono-preco").textContent = AF.formatar.preco(anuncio.precoDia);
    $("dono-editar").href = "anunciar.html?id=" + encodeURIComponent(anuncio.id);
    var status = $("dono-status");
    function pintarStatus() {
      status.className = "etiqueta etiqueta--" + anuncio.status;
      status.textContent = AF.anuncios.STATUS[anuncio.status];
      $("dono-pausar").textContent = anuncio.status === "ativo" ? "Pausar anúncio" : "Ativar anúncio";
    }
    pintarStatus();
    $("dono-pausar").addEventListener("click", function () {
      if (anuncio.status === "rascunho" && AF.anuncios.pendencias(anuncio).length) {
        location.href = "anunciar.html?id=" + encodeURIComponent(anuncio.id);
        return;
      }
      anuncio = AF.anuncios.mudarStatus(anuncio.id, anuncio.status === "ativo" ? "pausado" : "ativo");
      pintarStatus();
      AF.avisos.mostrar(anuncio.status === "ativo" ? "Anúncio ativo na busca." : "Anúncio pausado.", "info");
    });
    return;
  }

  /* ----- reserva (locatário e visitante) ----- */
  var form = $("reserva-form");
  var hoje = AF.alugueis.paraISO(AF.alugueis.hoje());
  form.elements.inicio.min = hoje;
  form.elements.fim.min = hoje;
  $("reserva-preco").textContent = AF.formatar.preco(anuncio.precoDia);
  if (params.get("inicio")) form.elements.inicio.value = params.get("inicio");
  if (params.get("fim")) form.elements.fim.value = params.get("fim");
  if (!usuario) $("reserva-botao").textContent = "Entrar para alugar";

  function atualizar() {
    var inicio = form.elements.inicio.value;
    var fim = form.elements.fim.value;
    if (inicio && (!fim || fim < inicio)) {
      form.elements.fim.min = inicio;
    }
    var dias = AF.alugueis.dias(inicio, fim);
    $("reserva-resumo").hidden = dias === 0;
    if (!dias) return;
    var cheio = dias * anuncio.precoDia;
    var total = AF.alugueis.total(anuncio.precoDia, dias, anuncio.precoSemana, anuncio.precoMes);
    $("reserva-diarias").textContent = dias + (dias === 1 ? " diária" : " diárias") + " × " + AF.formatar.preco(anuncio.precoDia);
    $("reserva-subtotal").textContent = AF.formatar.preco(cheio);
    $("reserva-desconto-linha").hidden = total >= cheio;
    $("reserva-desconto").textContent = "− " + AF.formatar.preco(cheio - total);
    $("reserva-total").textContent = AF.formatar.preco(total);
  }

  form.addEventListener("input", atualizar);
  AF.validacao.limparAoDigitar(form);
  atualizar();

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var v = { inicio: form.elements.inicio.value, fim: form.elements.fim.value, anuncioId: anuncio.id };
    if (!AF.validacao.aplicar(form, AF.validacao.validarPeriodo(v))) return;
    var destino = "pages/alugueis/confirmar-solicitacao.html?anuncio=" + encodeURIComponent(anuncio.id) + "&inicio=" + v.inicio + "&fim=" + v.fim;
    if (!usuario) {
      // T04v: entra e volta para a confirmação com as mesmas datas
      location.href = AF.app.url("pages/auth/login.html") + "?motivo=solicitacao&voltar=" + encodeURIComponent(destino);
      return;
    }
    location.href = AF.app.url(destino);
  });
})(window.AlugaFacil);
