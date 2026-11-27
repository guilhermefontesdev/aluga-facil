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

    var local = String(valores.local || "").trim();
    if (!local) erros.local = "Informe o bairro e a cidade, como Rio Vermelho, Salvador.";
    else if (local.length < 3) erros.local = "Escreva o bairro e a cidade.";

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

  /* Regras do perfil (T07). Devolve { campo: "mensagem" } */
  function validarPerfil(valores) {
    var erros = {};
    var nome = String(valores.nome || "").trim();
    var telefone = String(valores.telefone || "").replace(/\D/g, "");
    var cep = String(valores.cep || "").replace(/\D/g, "");

    if (nome.length < 3) erros.nome = "Informe o nome completo.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(valores.email || "").trim())) {
      erros.email = "Use um e-mail válido, como nome@email.com.";
    }
    if (telefone && (telefone.length < 10 || telefone.length > 11)) {
      erros.telefone = "Use o DDD e o número, como (71) 99999-9999.";
    }
    if (cep.length !== 8) erros.cep = "O CEP tem 8 números, como 40170-110.";
    if (!String(valores.cidade || "").trim()) erros.cidade = "Informe a cidade.";
    if (!String(valores.bairro || "").trim()) erros.bairro = "Informe o bairro.";
    return erros;
  }

  /* Regras do comparador (T19), etapa por etapa. Devolve { campo: "mensagem" } */
  function validarComparador(etapa, valores) {
    var erros = {};
    if (etapa === 1) {
      if (String(valores.produto || "").trim().length < 3) erros.produto = "Informe o nome do produto.";
      if (AF.anuncios.CATEGORIAS.indexOf(valores.categoria) === -1) erros.categoria = "Escolha uma categoria.";
      var preco = AF.formatar.lerPreco(valores.preco);
      if (isNaN(preco) || preco <= 0) erros.preco = "Informe o preço de compra, maior que zero.";
      else if (preco > 1000000) erros.preco = "O preço pode ser no máximo R$ 1.000.000,00.";
    }
    if (etapa === 2) {
      var dias = Number(valores.diasPorUso);
      var usos = Number(valores.usosPorAno);
      var anos = valores.anos === "" ? 3 : Number(valores.anos);
      if (!Number.isInteger(dias) || dias < 1 || dias > 90) erros.diasPorUso = "Use um número de 1 a 90 dias.";
      if (!Number.isInteger(usos) || usos < 1) erros.usosPorAno = "Informe quantas vezes por ano, no mínimo 1.";
      else if (!erros.diasPorUso && dias * usos > 365) erros.usosPorAno = "Dias por vez × usos por ano não pode passar de 365.";
      if (!Number.isInteger(anos) || anos < 1 || anos > 10) erros.anos = "Use de 1 a 10 anos, ou deixe em branco.";
    }
    if (etapa === 3) {
      if (valores.referencia === "anuncio" && !valores.anuncioId) erros.anuncio = "Escolha um anúncio.";
      if (valores.referencia === "valor") {
        var diaria = AF.formatar.lerPreco(valores.diaria);
        if (isNaN(diaria) || diaria <= 0) erros.diaria = "Informe a diária, maior que zero.";
      }
    }
    return erros;
  }


  /* ----- ajudas gerais ----- */

  /* Mostra os erros { nome-do-campo: "mensagem" } no formulário e foca o primeiro.
     Devolve true se não havia erro. */
  function aplicar(form, erros) {
    var primeiro = null;
    Array.prototype.forEach.call(form.elements, function (controle) {
      if (!controle.name || !controle.closest(".campo")) return;
      if (erros[controle.name]) {
        mostrarErro(controle, erros[controle.name]);
        if (!primeiro) primeiro = controle;
      } else if (controle.closest(".campo--erro")) {
        limparErro(controle);
      }
    });
    if (primeiro) primeiro.focus();
    return !primeiro;
  }

  /* Some o erro quando a pessoa volta a digitar */
  function limparAoDigitar(form) {
    form.addEventListener("input", function (e) {
      if (e.target.closest && e.target.closest(".campo--erro")) limparErro(e.target);
    });
    form.addEventListener("change", function (e) {
      if (e.target.closest && e.target.closest(".campo--erro")) limparErro(e.target);
    });
  }

  /* Máscaras simples: CPF, telefone e CEP */
  var MASCARAS = {
    cpf: function (d) { return d.slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2"); },
    telefone: function (d) {
      d = d.slice(0, 11);
      if (d.length <= 2) return d.length ? "(" + d : "";
      if (d.length <= 6) return "(" + d.slice(0, 2) + ") " + d.slice(2);
      if (d.length <= 10) return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
      return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
    },
    cep: function (d) { d = d.slice(0, 8); return d.length > 5 ? d.slice(0, 5) + "-" + d.slice(5) : d; }
  };

  function mascarar(controle, tipo) {
    if (!controle) return;
    controle.addEventListener("input", function () {
      controle.value = MASCARAS[tipo](controle.value.replace(/\D/g, ""));
    });
  }

  function emailValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
  }

  function senhaForte(senha) {
    return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(String(senha || ""));
  }

  /* CPF com dígitos verificadores */
  function cpfValido(cpf) {
    var d = String(cpf || "").replace(/\D/g, "");
    if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
    for (var t = 9; t < 11; t++) {
      var soma = 0;
      for (var i = 0; i < t; i++) soma += Number(d[i]) * (t + 1 - i);
      var digito = ((soma * 10) % 11) % 10;
      if (digito !== Number(d[t])) return false;
    }
    return true;
  }

  /* Regras do cadastro (T01) */
  function validarCadastro(v) {
    var erros = {};
    var nome = String(v.nome || "").trim();
    if (!/\S+\s+\S+/.test(nome)) erros.nome = "Escreva nome e sobrenome, como está no seu documento.";
    if (!emailValido(v.email)) erros.email = "Use um e-mail válido, como nome@email.com.";
    else if (AF.usuarios.porEmail(v.email)) erros.email = "Já existe uma conta com este e-mail. Entre ou recupere a senha.";
    if (!cpfValido(v.cpf)) erros.cpf = "CPF inválido. Confira os 11 números.";
    if (!v.nascimento) erros.nascimento = "Informe a data de nascimento.";
    else {
      var nasc = new Date(v.nascimento + "T00:00:00");
      var limite = new Date();
      limite.setFullYear(limite.getFullYear() - 18);
      if (nasc > limite) erros.nascimento = "Você precisa ter 18 anos ou mais.";
    }
    if (String(v.telefone || "").replace(/\D/g, "").length < 10) erros.telefone = "Use DDD + número, como (71) 99999-9999.";
    if (!senhaForte(v.senha)) erros.senha = "Mínimo de 8 caracteres, com pelo menos uma letra e um número.";
    if (!v.confirmar) erros.confirmar = "Repita a senha.";
    else if (v.confirmar !== v.senha) erros.confirmar = "As senhas não são iguais.";
    if (!v.termos) erros.termos = "Aceite os termos para criar a conta.";
    return erros;
  }

  AF.validacao = {
    aplicar: aplicar,
    limparAoDigitar: limparAoDigitar,
    mascarar: mascarar,
    emailValido: emailValido,
    senhaForte: senhaForte,
    cpfValido: cpfValido,
    validarCadastro: validarCadastro,
    validarPerfil: validarPerfil,
    validarComparador: validarComparador,
    mostrarErro: mostrarErro,
    limparErro: limparErro,
    validarAnuncio: validarAnuncio,
    validarPeriodo: validarPeriodo
  };
})(window.AlugaFacil);
