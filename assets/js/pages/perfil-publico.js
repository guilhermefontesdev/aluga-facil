/* ==========================================================================
   T10 Perfil público                                                   RF05
   perfil-publico.html?id=u-carlos  (sem id: o usuário logado)
   Mostra a reputação como anunciante e como locatário e os anúncios ativos.
   ========================================================================== */

(function (AF) {
  var app = AF.app;
  var id = new URLSearchParams(location.search).get("id");
  var logado = AF.sessao.usuario();
  var pessoa = id ? AF.usuarios.buscar(id) : logado;

  function $(x) { return document.getElementById(x); }

  if (!pessoa) {
    if (!id) { app.irParaLogin(); return; }
    $("publico").hidden = true;
    $("publico-nao-encontrado").hidden = false;
    return;
  }

  var proprio = logado && logado.id === pessoa.id;
  var primeiro = AF.perfil.primeiroNome(pessoa.nome);
  document.title = pessoa.nome + " · AlugaFácil";
  if (proprio) { document.body.dataset.menu = "perfil"; app.atualizarCabecalho(); }

  $("publico-avatar").innerHTML = pessoa.foto
    ? '<img class="avatar avatar--grande avatar--foto" src="' + app.esc(app.foto(pessoa.foto)) + '" alt="">'
    : '<span class="avatar avatar--grande" aria-hidden="true">' + AF.perfil.iniciais(pessoa.nome) + "</span>";
  $("publico-nome").textContent = pessoa.nome;
  $("publico-local").innerHTML = '<span class="icone icone--local" aria-hidden="true"></span>' +
    app.esc(AF.usuarios.local(pessoa) || pessoa.cidade || "") + " · no AlugaFácil desde " + app.esc(pessoa.desde);
  $("publico-apresentacao").textContent = pessoa.apresentacao || (proprio ? "Você ainda não escreveu uma apresentação. Edite em Meu perfil." : "");
  if (proprio) {
    var editar = document.createElement("a");
    editar.className = "botao botao--contorno botao--compacto publico__editar";
    editar.href = "meu-perfil.html";
    editar.innerHTML = '<span class="icone icone--editar" aria-hidden="true"></span>Editar perfil';
    document.querySelector(".publico__dados").appendChild(editar);
  }

  var anuncios = AF.anuncios.listar().filter(function (a) { return a.donoId === pessoa.id; });
  var concluidos = AF.alugueis.doUsuario(pessoa.id).filter(function (r) { return AF.alugueis.situacao(r) === "concluido"; }).length;
  var repA = AF.perfil.reputacao(pessoa.id, "anunciante");
  var repL = AF.perfil.reputacao(pessoa.id, "locatario");

  function numero(valor, rotulo) { return "<li><strong>" + valor + "</strong><span>" + rotulo + "</span></li>"; }
  $("publico-numeros").innerHTML =
    numero(anuncios.length, anuncios.length === 1 ? "anúncio ativo" : "anúncios ativos") +
    numero(concluidos, concluidos === 1 ? "aluguel concluído" : "aluguéis concluídos") +
    numero(repA.total + repL.total, "avaliações");

  /* ----- reputação por papel ----- */
  function mostrarPapel(papel) {
    var rep = papel === "anunciante" ? repA : repL;
    var lista = AF.perfil.avaliacoes(pessoa.id, papel);
    $("publico-reputacao").innerHTML = rep.total
      ? '<p class="publico__media"><span class="icone icone--estrela" aria-hidden="true"></span><strong>' + AF.perfil.nota(rep.media) +
        "</strong><span>" + rep.total + (rep.total === 1 ? " avaliação" : " avaliações") + "</span></p>"
      : '<p class="painel__texto">' + app.esc(primeiro) + " ainda não recebeu avaliações " +
        (papel === "anunciante" ? "como anunciante." : "como locatário.") + "</p>";
    $("publico-avaliacoes").innerHTML = lista.slice(0, 5).map(function (a) {
      return '<li class="avaliacao"><p class="avaliacao__topo"><strong>' + app.esc(a.autor) + '</strong><span class="nota">' +
        '<span class="icone icone--estrela" aria-hidden="true"></span><strong>' + a.nota + "</strong></span></p>" +
        (a.texto ? "<p>" + app.esc(a.texto) + "</p>" : "") + "</li>";
    }).join("");
    Array.prototype.forEach.call(document.querySelectorAll("#publico-abas .aba"), function (aba) {
      aba.setAttribute("aria-selected", String(aba.dataset.papel === papel));
    });
  }
  $("publico-abas").addEventListener("click", function (e) {
    var aba = e.target.closest(".aba");
    if (aba) mostrarPapel(aba.dataset.papel);
  });
  mostrarPapel(repA.total || !repL.total ? "anunciante" : "locatario");

  /* ----- anúncios ----- */
  $("publico-titulo-anuncios").textContent = (proprio ? "Seus anúncios" : "Anúncios de " + primeiro) + " (" + anuncios.length + ")";
  if (anuncios.length) AF.cardAnuncio.preencher($("publico-anuncios"), anuncios);
  else $("publico-sem-anuncios").hidden = false;
})(window.AlugaFacil);
