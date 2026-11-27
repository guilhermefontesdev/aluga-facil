/* ==========================================================================
   T14 · Busca com filtros                                       RF11, RF12
   Filtros: texto, categoria, bairro, faixa de preço e período livre.
   Tudo fica no endereço (?q=...&categoria=...), então dá para voltar,
   compartilhar e chegar aqui pela página inicial.
   ========================================================================== */

(function (AF) {
  var form = document.getElementById("busca-form");
  if (!form) return;

  var $ = function (id) { return document.getElementById(id); };
  var campos = { q: $("busca-q"), bairro: $("busca-bairro"), min: $("busca-min"), max: $("busca-max"), inicio: $("busca-inicio"), fim: $("busca-fim"), ordem: $("busca-ordem") };
  var params = new URLSearchParams(location.search);
  var todos = AF.anuncios.listar();

  function semAcento(t) {
    return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  }

  // categorias (checkbox) e bairros (a partir dos anúncios)
  $("busca-categorias").innerHTML = AF.anuncios.CATEGORIAS.map(function (c, i) {
    var total = todos.filter(function (a) { return a.categoria === c; }).length;
    return '<label class="filtro__opcao"><input type="checkbox" name="categoria" value="' + AF.app.esc(c) + '" id="cat-' + i + '">' +
      "<span>" + AF.app.esc(c) + '</span><span class="filtro__qtd">' + total + "</span></label>";
  }).join("");

  var bairros = [];
  todos.forEach(function (a) {
    var b = a.local.split(",")[0].trim();
    if (b && bairros.indexOf(b) === -1) bairros.push(b);
  });
  bairros.sort().forEach(function (b) {
    var op = document.createElement("option");
    op.value = b;
    op.textContent = b;
    campos.bairro.appendChild(op);
  });

  // preenche com o que veio no endereço
  Object.keys(campos).forEach(function (k) { if (params.get(k)) campos[k].value = params.get(k); });
  var categoriasMarcadas = params.getAll("categoria");
  document.querySelectorAll('input[name="categoria"]').forEach(function (c) { c.checked = categoriasMarcadas.indexOf(c.value) !== -1; });
  campos.inicio.min = AF.alugueis.paraISO(AF.alugueis.hoje());
  campos.fim.min = campos.inicio.min;

  function filtros() {
    return {
      q: campos.q.value.trim(),
      categorias: Array.prototype.map.call(document.querySelectorAll('input[name="categoria"]:checked'), function (c) { return c.value; }),
      bairro: campos.bairro.value,
      min: campos.min.value === "" ? null : Number(campos.min.value),
      max: campos.max.value === "" ? null : Number(campos.max.value),
      inicio: campos.inicio.value,
      fim: campos.fim.value || campos.inicio.value,
      ordem: campos.ordem.value
    };
  }

  function notaDono(a) {
    return AF.perfil.reputacao(a.donoId, "anunciante").media;
  }

  function aplicar() {
    var f = filtros();
    var termo = semAcento(f.q);
    var resultado = todos.filter(function (a) {
      if (termo && semAcento(a.nome + " " + a.descricao + " " + a.categoria).indexOf(termo) === -1) return false;
      if (f.categorias.length && f.categorias.indexOf(a.categoria) === -1) return false;
      if (f.bairro && a.local.split(",")[0].trim() !== f.bairro) return false;
      if (f.min !== null && a.precoDia < f.min) return false;
      if (f.max !== null && a.precoDia > f.max) return false;
      if (f.inicio && AF.alugueis.periodoOcupado(a.id, f.inicio, f.fim)) return false;
      return true;
    });

    if (f.ordem === "menor") resultado.sort(function (a, b) { return a.precoDia - b.precoDia; });
    if (f.ordem === "maior") resultado.sort(function (a, b) { return b.precoDia - a.precoDia; });
    if (f.ordem === "nota") resultado.sort(function (a, b) { return notaDono(b) - notaDono(a); });
    if (f.ordem === "relevancia" && termo) {
      resultado.sort(function (a, b) {
        return (semAcento(a.nome).indexOf(termo) === -1 ? 1 : 0) - (semAcento(b.nome).indexOf(termo) === -1 ? 1 : 0);
      });
    }

    var n = resultado.length;
    $("busca-total").textContent = n + (n === 1 ? " resultado" : " resultados") + (f.q ? " para “" + f.q + "”" : "");
    $("busca-lista").hidden = n === 0;
    $("busca-vazio").hidden = n !== 0;
    AF.cardAnuncio.preencher($("busca-lista"), resultado);

    // chips dos filtros ativos (clique remove)
    var chips = [];
    f.categorias.forEach(function (c) { chips.push({ rotulo: c, tirar: function () { document.querySelector('input[name="categoria"][value="' + c + '"]').checked = false; } }); });
    if (f.bairro) chips.push({ rotulo: f.bairro, tirar: function () { campos.bairro.value = ""; } });
    if (f.min !== null || f.max !== null) chips.push({ rotulo: "R$ " + (f.min || 0) + " a " + (f.max !== null ? "R$ " + f.max : "qualquer valor"), tirar: function () { campos.min.value = ""; campos.max.value = ""; } });
    if (f.inicio) chips.push({ rotulo: "Livre " + AF.alugueis.periodoCurto(f.inicio, f.fim), tirar: function () { campos.inicio.value = ""; campos.fim.value = ""; } });
    var lista = $("busca-ativos");
    lista.innerHTML = "";
    chips.forEach(function (c) {
      var li = document.createElement("li");
      li.innerHTML = '<button class="chip chip--ativo" type="button">' + AF.app.esc(c.rotulo) + ' <span class="icone icone--fechar" aria-hidden="true"></span></button>';
      li.firstChild.setAttribute("aria-label", "Remover filtro " + c.rotulo);
      li.firstChild.addEventListener("click", function () { c.tirar(); aplicar(); });
      lista.appendChild(li);
    });
    $("busca-qtd-filtros").textContent = chips.length ? "(" + chips.length + ")" : "";

    // guarda no endereço
    var novo = new URLSearchParams();
    if (f.q) novo.set("q", f.q);
    f.categorias.forEach(function (c) { novo.append("categoria", c); });
    ["bairro", "min", "max", "inicio", "fim"].forEach(function (k) { if (campos[k].value) novo.set(k, campos[k].value); });
    if (f.ordem !== "relevancia") novo.set("ordem", f.ordem);
    history.replaceState(null, "", location.pathname + (novo.toString() ? "?" + novo : ""));
  }

  function limpar() {
    ["q", "bairro", "min", "max", "inicio", "fim"].forEach(function (k) { campos[k].value = ""; });
    document.querySelectorAll('input[name="categoria"]').forEach(function (c) { c.checked = false; });
    aplicar();
  }

  form.addEventListener("submit", function (e) { e.preventDefault(); aplicar(); });
  $("busca-filtros").addEventListener("change", aplicar);
  $("busca-filtros").addEventListener("input", function (e) { if (e.target.type === "number") aplicar(); });
  campos.ordem.addEventListener("change", aplicar);
  $("busca-limpar").addEventListener("click", limpar);
  $("busca-limpar-vazio").addEventListener("click", limpar);

  // celular: filtros abrem em painel (T14b)
  var abrir = $("busca-abrir-filtros");
  abrir.addEventListener("click", function () {
    var aberto = document.body.classList.toggle("filtros-abertos");
    abrir.setAttribute("aria-expanded", String(aberto));
  });
  $("busca-aplicar").addEventListener("click", function () {
    document.body.classList.remove("filtros-abertos");
    abrir.setAttribute("aria-expanded", "false");
  });

  aplicar();
})(window.AlugaFacil);
