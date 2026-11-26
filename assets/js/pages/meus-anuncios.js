/* ==========================================================================
   T12 · Meus anúncios                                        RF08, RF09, RF10
   Lista os anúncios salvos, com Editar (vai para T13) e Excluir (com confirmação)
   ========================================================================== */

(function (AF) {
  var lista = document.getElementById("meus-anuncios-lista");
  if (!lista) return;

  var template = document.getElementById("modelo-card-meu-anuncio");
  var vazio = document.getElementById("meus-anuncios-vazio");
  var total = document.getElementById("meus-anuncios-total");
  var modal = document.getElementById("modal-excluir");
  var modalNome = document.getElementById("modal-excluir-nome");
  var confirmar = document.getElementById("modal-excluir-confirmar");

  var idParaExcluir = null;
  var botaoQueAbriu = null;

  function desenhar() {
    var anuncios = AF.anuncios.listar();
    lista.textContent = "";
    anuncios.forEach(function (anuncio) {
      var item = document.createElement("li");
      item.appendChild(AF.cardAnuncio.criar(template, anuncio));
      lista.appendChild(item);
    });

    lista.hidden = anuncios.length === 0;
    vazio.hidden = anuncios.length > 0;
    total.textContent = anuncios.length === 1 ? "1 anúncio" : anuncios.length + " anúncios";
  }

  // Um só "ouvinte" na lista atende o botão Excluir de todos os cards
  lista.addEventListener("click", function (evento) {
    var botao = evento.target.closest('[data-acao="excluir"]');
    if (!botao) return;
    var anuncio = AF.anuncios.buscar(botao.dataset.id);
    if (!anuncio) { desenhar(); return; }

    idParaExcluir = anuncio.id;
    botaoQueAbriu = botao;
    modalNome.textContent = anuncio.nome;
    modal.showModal();
  });

  confirmar.addEventListener("click", function () {
    var nome = modalNome.textContent;
    AF.anuncios.excluir(idParaExcluir);
    modal.close();
    desenhar();
    AF.avisos.mostrar("Anúncio “" + nome + "” excluído.", "sucesso");
    // o botão que abriu sumiu junto com o card: leva o foco para o título
    document.querySelector("h1").focus();
  });

  modal.addEventListener("close", function () {
    if (botaoQueAbriu && document.body.contains(botaoQueAbriu)) botaoQueAbriu.focus();
    idParaExcluir = null;
    botaoQueAbriu = null;
  });

  // Se outra aba mudar os anúncios, atualiza esta também
  window.addEventListener("storage", desenhar);

  desenhar();
})(window.AlugaFacil);
