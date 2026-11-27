/* ==========================================================================
   T15 · Detalhe do anúncio · escolher as datas e pedir o aluguel   RF14, RF15
   Abre com detalhe-anuncio.html?id=... (o link que a Busca e o card montam).
   - mostra o anúncio salvo no T13 (localStorage)
   - calcula o total: dias × preço por dia
   - valida as datas e segue para o T16 Confirmar solicitação
   ========================================================================== */

(function (AF) {
  var form = document.getElementById("solicitar-form");
  if (!form) return;

  var conteudo = document.getElementById("detalhe-conteudo");
  var indisponivel = document.getElementById("detalhe-indisponivel");

  var id = new URLSearchParams(location.search).get("id");
  var anuncio = id ? AF.anuncios.buscar(id) : null;

  // Sem ?id ou com um anúncio que não existe mais: mostra o T15b
  if (!anuncio) {
    conteudo.remove();
    indisponivel.hidden = false;
    return;
  }

  var inicio = document.getElementById("data-inicio");
  var fim = document.getElementById("data-fim");
  var diarias = document.getElementById("resumo-diarias");
  var subtotal = document.getElementById("resumo-subtotal");
  var totalGeral = document.getElementById("resumo-total");
  var jaTentou = false;

  /* ----- dados do anúncio ----- */

  function mostrarFoto() {
    var foto = document.getElementById("detalhe-foto");
    var vazia = document.getElementById("detalhe-foto-vazia");
    vazia.textContent = "Sem foto";
    if (!anuncio.foto) return;

    foto.src = anuncio.foto;
    foto.alt = "Foto de " + anuncio.nome;
    foto.hidden = false;
    vazia.hidden = true;
    // endereço quebrado: volta para o "Sem foto"
    foto.addEventListener("error", function () {
      foto.hidden = true;
      vazia.hidden = false;
    }, { once: true });
  }

  document.title = anuncio.nome + " · AlugaFácil";
  document.getElementById("detalhe-nome").textContent = anuncio.nome;
  document.getElementById("detalhe-categoria").textContent = anuncio.categoria;
  document.getElementById("detalhe-descricao").textContent = anuncio.descricao;
  document.getElementById("detalhe-preco-dia").textContent = AF.formatar.preco(anuncio.precoDia);
  document.getElementById("detalhe-preco-semana").textContent = AF.formatar.preco(anuncio.precoDia * 7);
  document.getElementById("detalhe-preco-mes").textContent = AF.formatar.preco(anuncio.precoDia * 30);
  mostrarFoto();

  /* ----- datas e total ----- */

  // não deixa escolher dia que já passou
  var hojeISO = AF.alugueis.paraISO(AF.alugueis.hoje());
  inicio.min = hojeISO;
  fim.min = hojeISO;

  function atualizarResumo() {
    var quantidade = AF.alugueis.dias(inicio.value, fim.value);

    if (quantidade === 0) {
      diarias.textContent = "Escolha as datas";
      subtotal.textContent = "—";
      totalGeral.textContent = AF.formatar.preco(0);
      return;
    }

    var total = AF.alugueis.total(anuncio.precoDia, quantidade);
    diarias.textContent = quantidade + (quantidade === 1 ? " diária" : " diárias") + " × " + AF.formatar.preco(anuncio.precoDia);
    subtotal.textContent = AF.formatar.preco(total);
    totalGeral.textContent = AF.formatar.preco(total);
  }

  /* ----- validação ----- */

  function validar() {
    var erros = AF.validacao.validarPeriodo({
      inicio: inicio.value,
      fim: fim.value,
      anuncioId: anuncio.id
    });

    [["inicio", inicio], ["fim", fim]].forEach(function (par) {
      if (erros[par[0]]) AF.validacao.mostrarErro(par[1], erros[par[0]]);
      else AF.validacao.limparErro(par[1]);
    });

    return Object.keys(erros).length === 0;
  }

  function aoMudar() {
    // o fim não pode ser antes do início: o calendário já bloqueia esses dias
    fim.min = inicio.value && inicio.value > hojeISO ? inicio.value : hojeISO;
    atualizarResumo();
    if (jaTentou) validar();
  }

  inicio.addEventListener("change", aoMudar);
  fim.addEventListener("change", aoMudar);

  form.addEventListener("submit", function (evento) {
    evento.preventDefault();
    jaTentou = true;
    if (!validar()) return;

    var dados = new URLSearchParams({ anuncio: anuncio.id, inicio: inicio.value, fim: fim.value });
    location.href = "../alugueis/confirmar-solicitacao.html?" + dados.toString();
  });

  atualizarResumo();
})(window.AlugaFacil);
