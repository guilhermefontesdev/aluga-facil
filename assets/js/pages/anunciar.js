/* ==========================================================================
   T13 · Anunciar / Editar item                                    RF07, RF09
   anunciar.html          -> cadastra um anúncio novo
   anunciar.html?id=XYZ   -> abre o anúncio XYZ para editar
   ========================================================================== */

(function (AF) {
  var form = document.getElementById("anuncio-form");
  if (!form) return;

  var campos = {
    nome: document.getElementById("nome"),
    categoria: document.getElementById("categoria"),
    descricao: document.getElementById("descricao"),
    preco: document.getElementById("preco"),
    foto: document.getElementById("foto-url")
  };
  var titulo = document.getElementById("anuncio-titulo");
  var subtitulo = document.getElementById("anuncio-subtitulo");
  var botaoSalvar = document.getElementById("anuncio-salvar");
  var contador = document.getElementById("descricao-contador");
  var arquivo = document.getElementById("foto-arquivo");
  var previa = document.getElementById("foto-previa");
  var removerFoto = document.getElementById("foto-remover");

  var FOTO_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
  var FOTO_MAX_LADO = 800;              // reduz a foto enviada para caber no localStorage

  var fotoEnviada = "";   // foto escolhida do aparelho, já reduzida (data:image/jpeg...)
  var avisoErro = null;   // último aviso de erro, para não empilhar vários

  /* ---------- Modo editar ---------- */
  var id = new URLSearchParams(location.search).get("id");
  var editando = id ? AF.anuncios.buscar(id) : null;

  if (id && !editando) {
    AF.avisos.mostrar("Não encontramos esse anúncio. Ele pode ter sido excluído. Você pode cadastrar um novo.", "aviso");
    history.replaceState(null, "", location.pathname);
  }

  if (editando) {
    document.title = "Editar item · AlugaFácil";
    titulo.textContent = "Editar item";
    subtitulo.textContent = "Altere o que precisar e salve. O anúncio atualiza na hora.";
    botaoSalvar.textContent = "Salvar alterações";

    campos.nome.value = editando.nome;
    campos.categoria.value = editando.categoria;
    campos.descricao.value = editando.descricao;
    campos.preco.value = AF.formatar.precoParaCampo(editando.precoDia);
    if (editando.foto.indexOf("data:") === 0) fotoEnviada = editando.foto;
    else campos.foto.value = editando.foto;
  }

  /* ---------- Contador da descrição ---------- */
  function atualizarContador() {
    contador.textContent = campos.descricao.value.length + "/" + campos.descricao.maxLength;
  }
  campos.descricao.addEventListener("input", atualizarContador);
  atualizarContador();

  /* ---------- Foto: prévia, envio do aparelho e endereço (URL) ---------- */
  function fotoAtual() {
    return fotoEnviada || campos.foto.value.trim();
  }

  function mostrarPrevia() {
    var endereco = fotoAtual();
    previa.textContent = "";
    removerFoto.hidden = !endereco;

    if (!endereco) {
      previa.textContent = "A foto aparece aqui";
      return;
    }
    var img = document.createElement("img");
    img.alt = "Prévia da foto do item";
    img.src = endereco;
    img.addEventListener("error", function () {
      previa.textContent = "Não conseguimos abrir essa imagem. Confira o endereço.";
    });
    previa.appendChild(img);
  }

  function reduzirFoto(file) {
    return new Promise(function (resolver, rejeitar) {
      var leitor = new FileReader();
      leitor.onerror = rejeitar;
      leitor.onload = function () {
        var img = new Image();
        img.onerror = rejeitar;
        img.onload = function () {
          var escala = Math.min(1, FOTO_MAX_LADO / Math.max(img.width, img.height));
          var tela = document.createElement("canvas");
          tela.width = Math.round(img.width * escala);
          tela.height = Math.round(img.height * escala);
          tela.getContext("2d").drawImage(img, 0, 0, tela.width, tela.height);
          resolver(tela.toDataURL("image/jpeg", 0.8));
        };
        img.src = leitor.result;
      };
      leitor.readAsDataURL(file);
    });
  }

  arquivo.addEventListener("change", function () {
    var file = arquivo.files[0];
    arquivo.value = ""; // deixa escolher a mesma foto de novo depois
    if (!file) return;

    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      AF.avisos.mostrar("Escolha uma foto JPG, PNG ou WebP.", "aviso");
      return;
    }
    if (file.size > FOTO_MAX_BYTES) {
      AF.avisos.mostrar("Escolha uma foto de até 5 MB.", "aviso");
      return;
    }
    reduzirFoto(file).then(function (dados) {
      fotoEnviada = dados;
      campos.foto.value = "";
      AF.validacao.limparErro(campos.foto);
      mostrarPrevia();
    }).catch(function () {
      AF.avisos.mostrar("Não conseguimos abrir essa foto. Tente outra.", "erro");
    });
  });

  campos.foto.addEventListener("change", function () {
    if (campos.foto.value.trim()) fotoEnviada = "";
    mostrarPrevia();
  });

  removerFoto.addEventListener("click", function () {
    fotoEnviada = "";
    campos.foto.value = "";
    AF.validacao.limparErro(campos.foto);
    mostrarPrevia();
  });

  mostrarPrevia();

  /* ---------- Preço: mostra sempre com vírgula e 2 casas ---------- */
  campos.preco.addEventListener("blur", function () {
    var valor = AF.formatar.lerPreco(campos.preco.value);
    if (!isNaN(valor) && valor > 0) campos.preco.value = AF.formatar.precoParaCampo(valor);
  });

  /* ---------- Validação ---------- */
  function valores() {
    return {
      nome: campos.nome.value,
      categoria: campos.categoria.value,
      descricao: campos.descricao.value,
      preco: campos.preco.value,
      foto: fotoEnviada ? "" : campos.foto.value // foto do aparelho já foi conferida
    };
  }

  function aplicarErros(erros, somente) {
    Object.keys(campos).forEach(function (nome) {
      if (somente && nome !== somente) return;
      if (erros[nome]) AF.validacao.mostrarErro(campos[nome], erros[nome]);
      else AF.validacao.limparErro(campos[nome]);
    });
  }

  // Depois que o campo já mostrou erro, confere de novo enquanto a pessoa corrige
  Object.keys(campos).forEach(function (nome) {
    var evento = nome === "categoria" ? "change" : "input";
    campos[nome].addEventListener(evento, function () {
      if (campos[nome].closest(".campo").classList.contains("campo--erro")) {
        aplicarErros(AF.validacao.validarAnuncio(valores()), nome);
      }
    });
    // ao sair do campo preenchido, já avisa se está errado
    campos[nome].addEventListener("blur", function () {
      if (campos[nome].value.trim() !== "") aplicarErros(AF.validacao.validarAnuncio(valores()), nome);
    });
  });

  /* ---------- Salvar ---------- */
  form.addEventListener("submit", function (evento) {
    evento.preventDefault();
    if (avisoErro) avisoErro.remove();

    var erros = AF.validacao.validarAnuncio(valores());
    aplicarErros(erros);

    var comErro = Object.keys(campos).filter(function (nome) { return erros[nome]; });
    if (comErro.length) {
      campos[comErro[0]].focus();
      avisoErro = AF.avisos.mostrar(
        comErro.length === 1 ? "Corrija o campo destacado para continuar." : "Corrija os " + comErro.length + " campos destacados para continuar.",
        "erro"
      );
      return;
    }

    var dados = {
      nome: campos.nome.value,
      categoria: campos.categoria.value,
      descricao: campos.descricao.value,
      precoDia: AF.formatar.lerPreco(campos.preco.value),
      foto: fotoAtual()
    };

    try {
      if (editando) {
        AF.anuncios.atualizar(editando.id, dados);
        AF.avisos.depois("Alterações salvas com sucesso.", "sucesso");
      } else {
        AF.anuncios.criar(dados);
        AF.avisos.depois("Anúncio publicado! Ele já aparece na busca.", "sucesso");
      }
    } catch (erro) {
      avisoErro = AF.avisos.mostrar("Não deu para salvar: o espaço do navegador acabou. Use uma foto menor ou cole o endereço (URL) dela.", "erro");
      return;
    }

    location.href = form.getAttribute("action");
  });
})(window.AlugaFacil);
