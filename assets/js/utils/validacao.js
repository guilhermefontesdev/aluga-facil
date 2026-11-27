/* ==========================================================================
   Validação de formulários · mostra o erro embaixo do campo
   Usa o componente .campo do design system (campos.css):
     div.campo (+ .campo--erro) > label + input/select/textarea + p.campo__ajuda
   ========================================================================== */

window.AlugaFacil = window.AlugaFacil || {};

(function (AF) {
  /* Acha (ou cria) o parágrafo de ajuda/erro do campo */
  function ajudaDe(controle) {
    var campo = controle.closest(".campo");
    if (!campo) return null;
    var ajuda = campo.querySelector(".campo__ajuda");
    if (!ajuda) {
      ajuda = document.createElement("p");
      ajuda.className = "campo__ajuda";
      campo.appendChild(ajuda);
    }
    if (!ajuda.id) ajuda.id = controle.id + "-ajuda";
    // guarda o texto de ajuda original para devolver quando o erro sumir
    if (ajuda.dataset.original === undefined) ajuda.dataset.original = ajuda.textContent;
    return ajuda;
  }

  function mostrarErro(controle, mensagem) {
    var campo = controle.closest(".campo");
    var ajuda = ajudaDe(controle);
    if (!campo || !ajuda) return;
    campo.classList.add("campo--erro");
    controle.setAttribute("aria-invalid", "true");
    controle.setAttribute("aria-describedby", ajuda.id);
    ajuda.textContent = mensagem;
    ajuda.hidden = false;
  }

  function limparErro(controle) {
    var campo = controle.closest(".campo");
    var ajuda = ajudaDe(controle);
    if (!campo || !ajuda) return;
    campo.classList.remove("campo--erro");
    controle.removeAttribute("aria-invalid");
    ajuda.textContent = ajuda.dataset.original;
    ajuda.hidden = ajuda.dataset.original === "";
    if (ajuda.hidden) controle.removeAttribute("aria-describedby");
  }

  /* Regras do anúncio (T13). Recebe os valores e devolve { campo: "mensagem" } */
  function validarAnuncio(valores) {
    var erros = {};
    var nome = valores.nome.trim();
    var descricao = valores.descricao.trim();
    var preco = AF.formatar.lerPreco(valores.preco);
    var foto = valores.foto.trim();

    if (!nome) erros.nome = "Informe o nome do item.";
    else if (nome.length < 3) erros.nome = "O nome precisa ter pelo menos 3 letras.";
    else if (nome.length > 80) erros.nome = "Use no máximo 80 caracteres no nome.";

    if (AF.anuncios.CATEGORIAS.indexOf(valores.categoria) === -1) erros.categoria = "Escolha uma categoria.";

    if (!descricao) erros.descricao = "Descreva o item: estado, o que acompanha, cuidados de uso.";
    else if (descricao.length < 20) erros.descricao = "Escreva pelo menos 20 caracteres na descrição.";
    else if (descricao.length > 1000) erros.descricao = "Use no máximo 1.000 caracteres na descrição.";

    if (String(valores.preco).trim() === "") erros.preco = "Informe o preço por dia.";
    else if (isNaN(preco)) erros.preco = "Use só números, como 25 ou 25,50.";
    else if (preco <= 0) erros.preco = "O preço por dia precisa ser maior que zero.";
    else if (preco > 10000) erros.preco = "O preço por dia pode ser no máximo R$ 10.000,00.";

    if (foto && !/^(https?:\/\/\S+|data:image\/[a-z+]+;base64,)/i.test(foto)) {
      erros.foto = "Cole um endereço que comece com http:// ou https://, ou envie uma foto.";
    }

    return erros;
  }

  /* Regras do período do aluguel (T15). As datas vêm como "AAAA-MM-DD".
     Devolve { inicio: "mensagem", fim: "mensagem" } só com o que estiver errado */
  function validarPeriodo(valores) {
    var erros = {};
    var hoje = AF.alugueis.hoje();
    var inicio = AF.alugueis.dataDe(valores.inicio);
    var fim = AF.alugueis.dataDe(valores.fim);

    if (!inicio) erros.inicio = "Escolha a data de início.";
    else if (inicio < hoje) erros.inicio = "A data de início não pode ser no passado.";

    if (!fim) erros.fim = "Escolha a data de fim.";
    else if (fim < hoje) erros.fim = "A data de fim não pode ser no passado.";
    else if (inicio && fim < inicio) erros.fim = "A data de fim não pode ser antes do início.";

    if (!erros.inicio && !erros.fim && valores.anuncioId &&
        AF.alugueis.periodoOcupado(valores.anuncioId, valores.inicio, valores.fim)) {
      erros.fim = "Esse item já está reservado em parte desse período. Escolha outras datas.";
    }

    return erros;
  }

  AF.validacao = {
    mostrarErro: mostrarErro,
    limparErro: limparErro,
    validarAnuncio: validarAnuncio,
    validarPeriodo: validarPeriodo
  };
})(window.AlugaFacil);
