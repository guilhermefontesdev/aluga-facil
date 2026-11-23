/* ==========================================================================
   T14 · Busca · mostra os anúncios cadastrados no T13 (localStorage)
   Filtra por texto (nome, descrição, categoria) e por categoria.
   busca.html?q=furadeira já abre filtrado.
   ========================================================================== */

(function (AF) {
  var lista = document.getElementById("busca-lista");
  if (!lista) return;

  var form = document.getElementById("busca-form");
  var texto = document.getElementById("busca-texto");
  var categoria = document.getElementById("busca-categoria");
  var template = document.getElementById("modelo-card-busca");
  var resultado = document.getElementById("busca-resultado");
  var vazio = document.getElementById("busca-vazio");
  var vazioTexto = document.getElementById("busca-vazio-texto");

  // "Câmera" encontra "camera": tira acentos e deixa tudo minúsculo
  function simplificar(valor) {
    return String(valor).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  }

  function filtrar() {
    var termos = simplificar(texto.value).split(/\s+/).filter(Boolean);
    var cat = categoria.value;

    return AF.anuncios.listar().filter(function (anuncio) {
      if (cat && anuncio.categoria !== cat) return false;
      var onde = simplificar(anuncio.nome + " " + anuncio.descricao + " " + anuncio.categoria);
      return termos.every(function (termo) { return onde.indexOf(termo) !== -1; });
    });
  }

  function desenhar() {
    var encontrados = filtrar();
    var temTotal = AF.anuncios.listar().length > 0;

    lista.textContent = "";
    encontrados.forEach(function (anuncio) {
      var item = document.createElement("li");
      item.appendChild(AF.cardAnuncio.criar(template, anuncio));
      lista.appendChild(item);
    });

    lista.hidden = encontrados.length === 0;
    vazio.hidden = encontrados.length > 0;
    vazioTexto.textContent = temTotal
      ? "Nenhum item encontrado. Tente outra palavra ou outra categoria."
      : "Ainda não há itens anunciados. Que tal anunciar o primeiro?";
    resultado.textContent = encontrados.length === 1 ? "1 item encontrado" : encontrados.length + " itens encontrados";
  }

  // Abre com o que veio no endereço (?q=...&categoria=...)
  var params = new URLSearchParams(location.search);
  texto.value = params.get("q") || "";
  if (params.get("categoria")) categoria.value = params.get("categoria");

  // Filtra enquanto digita e guarda a busca no endereço (dá para voltar/compartilhar)
  function aoMudar() {
    var novos = new URLSearchParams();
    if (texto.value.trim()) novos.set("q", texto.value.trim());
    if (categoria.value) novos.set("categoria", categoria.value);
    var busca = novos.toString();
    history.replaceState(null, "", location.pathname + (busca ? "?" + busca : ""));
    desenhar();
  }

  texto.addEventListener("input", aoMudar);
  categoria.addEventListener("change", aoMudar);
  form.addEventListener("submit", function (evento) { evento.preventDefault(); aoMudar(); });
  window.addEventListener("storage", desenhar);

  desenhar();
})(window.AlugaFacil);
