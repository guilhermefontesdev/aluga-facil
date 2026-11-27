/* ==========================================================================
   T19 · Comparador · alugar ou comprar?                        RF22 a RF26
   Etapa 1: produto, categoria e preço de compra (RF22)
   Etapa 2: dias por uso, usos por ano e anos (RF23)
   Etapa 3: diária de referência (média da categoria, anúncio ou valor)
   Resultado: custo de alugar (RF24), comparação (RF25) e indicação (RF26).
   As contas ficam em assets/js/utils/comparador.js.
   ========================================================================== */

(function (AF) {
  var form = document.getElementById("comparador-form");
  if (!form) return;

  var etapas = form.querySelectorAll(".comparador__etapa");
  var indicador = document.querySelectorAll("#etapas .etapas__item");
  var resultado = document.getElementById("resultado");

  var campos = {
    produto: document.getElementById("produto"),
    categoria: document.getElementById("categoria"),
    preco: document.getElementById("preco-compra"),
    diasPorUso: document.getElementById("dias-por-uso"),
    usosPorAno: document.getElementById("usos-por-ano"),
    anos: document.getElementById("anos"),
    anuncio: document.getElementById("ref-anuncio"),
    diaria: document.getElementById("ref-valor")
  };
  var CAMPOS_DA_ETAPA = {
    1: ["produto", "categoria", "preco"],
    2: ["diasPorUso", "usosPorAno", "anos"],
    3: ["anuncio", "diaria"]
  };

  var ultimo = null; // { dados, conta } da última simulação, para salvar

  function referencia() {
    return form.querySelector('input[name="referencia"]:checked').value;
  }

  function valores() {
    return {
      produto: campos.produto.value,
      categoria: campos.categoria.value,
      preco: campos.preco.value,
      diasPorUso: campos.diasPorUso.value,
      usosPorAno: campos.usosPorAno.value,
      anos: campos.anos.value.trim(),
      referencia: referencia(),
      anuncioId: campos.anuncio.value,
      diaria: campos.diaria.value
    };
  }

  /* ----- navegação entre as etapas ----- */

  function irPara(numero) {
    etapas.forEach(function (etapa) { etapa.hidden = Number(etapa.dataset.etapa) !== numero; });
    indicador.forEach(function (item) {
      var n = Number(item.dataset.etapa);
      item.classList.toggle("etapas__item--feito", n < numero);
      if (n === numero) item.setAttribute("aria-current", "step");
      else item.removeAttribute("aria-current");
    });
    resultado.hidden = true;
    form.hidden = false;
    if (numero === 3) prepararReferencia();
    var primeiro = form.querySelector('.comparador__etapa[data-etapa="' + numero + '"] input, .comparador__etapa[data-etapa="' + numero + '"] select');
    if (primeiro) primeiro.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  // valida a etapa; mostra o erro embaixo de cada campo e devolve true se está tudo certo
  function validarEtapa(numero) {
    var erros = AF.validacao.validarComparador(numero, valores());
    CAMPOS_DA_ETAPA[numero].forEach(function (nome) {
      if (erros[nome]) AF.validacao.mostrarErro(campos[nome], erros[nome]);
      else AF.validacao.limparErro(campos[nome]);
    });
    var comErro = CAMPOS_DA_ETAPA[numero].filter(function (nome) { return erros[nome]; });
    if (comErro.length) campos[comErro[0]].focus();
    return comErro.length === 0;
  }

  // o erro some assim que a pessoa corrige o campo
  Object.keys(campos).forEach(function (nome) {
    var campo = campos[nome];
    campo.addEventListener(campo.tagName === "SELECT" ? "change" : "input", function () {
      if (campo.closest(".campo").classList.contains("campo--erro")) AF.validacao.limparErro(campo);
    });
  });

  form.querySelectorAll("[data-avancar]").forEach(function (botao) {
    botao.addEventListener("click", function () {
      var proxima = Number(botao.dataset.avancar);
      if (validarEtapa(proxima - 1)) irPara(proxima);
    });
  });
  form.querySelectorAll("[data-voltar]").forEach(function (botao) {
    botao.addEventListener("click", function () { irPara(Number(botao.dataset.voltar)); });
  });

  // preço com vírgula e 2 casas ao sair do campo
  [campos.preco, campos.diaria].forEach(function (campo) {
    campo.addEventListener("blur", function () {
      var valor = AF.formatar.lerPreco(campo.value);
      if (!isNaN(valor) && valor > 0) campo.value = AF.formatar.precoParaCampo(valor);
    });
  });

  /* ----- etapa 3: diária de referência ----- */

  function prepararReferencia() {
    var media = AF.comparador.mediaCategoria(campos.categoria.value);
    document.getElementById("ref-media").textContent = campos.categoria.value + ": " + AF.formatar.preco(media.diaria) + " por dia" +
      (media.anuncios ? " (" + media.anuncios + (media.anuncios === 1 ? " anúncio ativo)" : " anúncios ativos)") : " (média de referência)");

    // anúncios da mesma categoria primeiro
    var anuncios = AF.anuncios.listar().sort(function (a, b) {
      return (b.categoria === campos.categoria.value) - (a.categoria === campos.categoria.value);
    });
    var escolhido = campos.anuncio.value;
    campos.anuncio.length = 1;
    anuncios.forEach(function (anuncio) {
      var opcao = document.createElement("option");
      opcao.value = anuncio.id;
      opcao.textContent = anuncio.nome + " · " + AF.formatar.preco(anuncio.precoDia) + "/dia";
      campos.anuncio.appendChild(opcao);
    });
    campos.anuncio.value = escolhido;
    if (anuncios.length === 0) campos.anuncio.options[0].textContent = "Ainda não há anúncios";
  }

  function mostrarExtras() {
    document.getElementById("ref-anuncio-campo").hidden = referencia() !== "anuncio";
    document.getElementById("ref-valor-campo").hidden = referencia() !== "valor";
  }
  form.querySelectorAll('input[name="referencia"]').forEach(function (radio) {
    radio.addEventListener("change", mostrarExtras);
  });

  function diariaEscolhida(v) {
    if (v.referencia === "anuncio") {
      var anuncio = AF.anuncios.buscar(v.anuncioId);
      return { valor: anuncio.precoDia, texto: "diária do anúncio " + anuncio.nome };
    }
    if (v.referencia === "valor") {
      return { valor: AF.formatar.lerPreco(v.diaria), texto: "diária informada por você" };
    }
    return { valor: AF.comparador.mediaCategoria(v.categoria).diaria, texto: "média da categoria " + v.categoria };
  }

  /* ----- resultado ----- */

  function texto(id, valor) {
    document.getElementById(id).textContent = valor;
  }

  function plural(n, um, varios) {
    return n + " " + (n === 1 ? um : varios);
  }

  form.addEventListener("submit", function (evento) {
    evento.preventDefault();
    if (!validarEtapa(3)) return;

    var v = valores();
    var diaria = diariaEscolhida(v);
    var dados = {
      produto: v.produto.trim(),
      categoria: v.categoria,
      precoCompra: AF.formatar.lerPreco(v.preco),
      diasPorUso: Number(v.diasPorUso),
      usosPorAno: Number(v.usosPorAno),
      anos: v.anos === "" ? AF.comparador.ANOS_PADRAO : Number(v.anos),
      diaria: diaria.valor,
      referencia: diaria.texto
    };
    var conta = AF.comparador.calcular(dados);
    ultimo = { dados: dados, conta: conta };

    var veredito = document.getElementById("resultado-veredito");
    veredito.className = "aviso comparador__veredito aviso--" + (conta.compensa === "comprar" ? "info" : "sucesso");
    var periodo = plural(conta.anos, "ano", "anos");
    if (conta.compensa === "alugar") {
      texto("resultado-titulo-veredito", "Compensa alugar");
      texto("resultado-frase", "Alugando, você economiza " + AF.formatar.preco(conta.diferenca) + " em " + periodo + ".");
    } else if (conta.compensa === "comprar") {
      texto("resultado-titulo-veredito", "Compensa comprar");
      texto("resultado-frase", "Com esse uso, alugar custaria " + AF.formatar.preco(conta.diferenca) + " a mais do que comprar em " + periodo + ".");
    } else {
      texto("resultado-titulo-veredito", "Tanto faz");
      texto("resultado-frase", "Em " + periodo + ", alugar e comprar custam o mesmo.");
    }

    texto("resultado-compra", AF.formatar.preco(dados.precoCompra));
    texto("resultado-aluguel-rotulo", "Custo de alugar em " + periodo);
    texto("resultado-aluguel", AF.formatar.preco(conta.custoAluguel));
    texto("resultado-diferenca", AF.formatar.preco(conta.diferenca));
    texto("resultado-equilibrio-titulo", "Ponto de equilíbrio: " + plural(conta.pontoEquilibrio, "uso", "usos"));
    texto("resultado-equilibrio", "A partir de " + plural(conta.pontoEquilibrio, "uso", "usos") + ", comprar passa a compensar. Cada uso de " +
      plural(dados.diasPorUso, "dia", "dias") + " custa " + AF.formatar.preco(conta.custoPorUso) + " no aluguel.");
    texto("resultado-base", "Com base em: " + plural(dados.diasPorUso, "dia", "dias") + " por uso · " + plural(dados.usosPorAno, "uso", "usos") +
      " por ano · " + periodo + " · diária de " + AF.formatar.preco(dados.diaria) + " (" + dados.referencia + "). O valor de revenda do produto não entra na conta.");

    var ver = document.getElementById("resultado-ver");
    ver.href = "busca.html?categoria=" + encodeURIComponent(dados.categoria);
    ver.textContent = "Ver anúncios de " + dados.categoria;

    indicador.forEach(function (item) {
      item.classList.add("etapas__item--feito");
      item.removeAttribute("aria-current");
    });
    form.hidden = true;
    resultado.hidden = false;
    document.getElementById("resultado-salvar").disabled = false;
    window.scrollTo(0, 0);
  });

  document.getElementById("resultado-salvar").addEventListener("click", function (evento) {
    if (!ultimo) return;
    try {
      AF.comparador.salvar(ultimo.dados, ultimo.conta);
      document.dispatchEvent(new CustomEvent("alugafacil:simulacao"));
      AF.avisos.mostrar("Simulação salva na sua conta.", "sucesso");
      evento.currentTarget.disabled = true;
    } catch (erro) {
      AF.avisos.mostrar("Não foi possível salvar a simulação. O navegador está sem espaço.", "erro");
    }
  });

  document.getElementById("resultado-refazer").addEventListener("click", function () {
    form.reset();
    mostrarExtras();
    irPara(1);
  });

  // o comparador também abre a partir de um anúncio: comparador.html?produto=...&categoria=...&diaria=...
  var params = new URLSearchParams(location.search);
  if (params.get("produto")) campos.produto.value = params.get("produto");
  if (params.get("categoria")) campos.categoria.value = params.get("categoria");

  mostrarExtras();
})(window.AlugaFacil);

/* Simulações salvas (coluna da direita no computador) */
(function (AF) {
  var lista = document.getElementById("simulacoes");
  if (!lista) return;
  function desenhar() {
    var salvas = AF.comparador.listar().slice(0, 5);
    lista.innerHTML = salvas.length ? salvas.map(function (s) {
      return '<li class="simulacao"><strong>' + AF.app.esc(s.produto) + '</strong><span>' +
        (s.compensa === "alugar" ? "Compensa alugar" : s.compensa === "comprar" ? "Compensa comprar" : "Tanto faz") +
        " · diferença de " + AF.formatar.preco(s.diferenca) + "</span></li>";
    }).join("") : '<li class="simulacoes__vazio">Nenhuma simulação salva ainda.</li>';
  }
  document.addEventListener("alugafacil:simulacao", desenhar);
  desenhar();
})(window.AlugaFacil);
