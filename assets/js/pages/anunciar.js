/* ==========================================================================
   T13 · Anunciar / Editar item                                    RF07–RF10
   Novo:   anunciar.html          Editar: anunciar.html?id=<anúncio>
   "Publicar" valida tudo; "Salvar rascunho" só pede o nome.
   A prévia do card ao lado muda enquanto a pessoa digita.
   ========================================================================== */

(function (AF) {
  var form = document.getElementById("anuncio-form");
  if (!form) return;

  var usuario = AF.sessao.usuario();
  var V = AF.validacao;
  var $ = function (id) { return document.getElementById(id); };
  var params = new URLSearchParams(location.search);
  var editando = params.get("id") ? AF.anuncios.buscar(params.get("id")) : null;

  if (params.get("id") && (!editando || editando.donoId !== usuario.id)) {
    AF.avisos.depois("Esse anúncio não existe ou não é seu.", "aviso");
    location.replace("meus-anuncios.html");
    return;
  }

  // categorias
  AF.anuncios.CATEGORIAS.forEach(function (c) {
    var op = document.createElement("option");
    op.value = c;
    op.textContent = c;
    form.elements.categoria.appendChild(op);
  });

  var foto = "";

  function mostrarFoto() {
    var previa = $("foto-previa");
    if (foto) {
      previa.innerHTML = '<img src="' + AF.app.esc(AF.app.foto(foto)) + '" alt="Foto do item">';
      previa.querySelector("img").addEventListener("error", function () {
        previa.innerHTML = '<span class="icone icone--foto" aria-hidden="true"></span><span>Não foi possível abrir esta imagem</span>';
      });
    } else {
      previa.innerHTML = '<span class="icone icone--foto" aria-hidden="true"></span><span>Nenhuma foto escolhida</span>';
    }
    $("foto-remover").hidden = !foto;
    atualizarPrevia();
  }

  form.elements.foto.addEventListener("input", function () {
    foto = form.elements.foto.value.trim();
    mostrarFoto();
  });

  $("foto-remover").addEventListener("click", function () {
    foto = "";
    form.elements.foto.value = "";
    $("foto-arquivo").value = "";
    mostrarFoto();
  });

  // Foto do computador: reduz para no máximo 900 px para caber no navegador
  $("foto-arquivo").addEventListener("change", function () {
    var arquivo = this.files[0];
    if (!arquivo) return;
    if (!/^image\/(png|jpeg|webp)$/.test(arquivo.type)) { AF.avisos.mostrar("Use uma foto JPG, PNG ou WebP.", "erro"); return; }
    if (arquivo.size > 5 * 1024 * 1024) { AF.avisos.mostrar("A foto pode ter no máximo 5 MB.", "erro"); return; }
    var leitor = new FileReader();
    leitor.onload = function () {
      var img = new Image();
      img.onload = function () {
        var escala = Math.min(1, 900 / Math.max(img.width, img.height));
        var tela = document.createElement("canvas");
        tela.width = Math.round(img.width * escala);
        tela.height = Math.round(img.height * escala);
        tela.getContext("2d").drawImage(img, 0, 0, tela.width, tela.height);
        foto = tela.toDataURL("image/jpeg", 0.8);
        form.elements.foto.value = "";
        mostrarFoto();
        AF.avisos.mostrar("Foto adicionada.", "sucesso");
      };
      img.src = leitor.result;
    };
    leitor.readAsDataURL(arquivo);
  });

  // contador da descrição
  form.elements.descricao.addEventListener("input", function () {
    $("descricao-contador").textContent = form.elements.descricao.value.length + "/1000";
  });

  function preco(nome) {
    var t = form.elements[nome].value.trim();
    return t === "" ? null : AF.formatar.lerPreco(t);
  }

  function politica() {
    var marcada = form.querySelector('input[name="politica"]:checked');
    return marcada ? marcada.value : "";
  }

  function dados(status) {
    return {
      nome: form.elements.nome.value,
      categoria: form.elements.categoria.value,
      descricao: form.elements.descricao.value,
      precoDia: preco("precoDia") || 0,
      precoSemana: preco("precoSemana"),
      precoMes: preco("precoMes"),
      local: form.elements.local.value,
      regras: form.elements.regras.value,
      politica: politica(),
      foto: foto,
      status: status
    };
  }

  function erros(completo) {
    var e = {};
    var d = dados("ativo");
    var nome = d.nome.trim();
    if (nome.length < 3) e.nome = "Informe o nome do item, com pelo menos 3 letras.";
    if (!completo) return e;
    if (AF.anuncios.CATEGORIAS.indexOf(d.categoria) === -1) e.categoria = "Escolha uma categoria.";
    if (d.descricao.trim().length < 20) e.descricao = "Escreva pelo menos 20 caracteres na descrição.";
    var dia = preco("precoDia");
    if (dia === null) e.precoDia = "Informe o preço por dia.";
    else if (isNaN(dia) || dia <= 0) e.precoDia = "Use só números, como 25 ou 25,50.";
    else if (dia > 10000) e.precoDia = "A diária pode ser no máximo R$ 10.000,00.";
    var semana = preco("precoSemana");
    if (semana !== null && (isNaN(semana) || semana <= 0)) e.precoSemana = "Use só números, como 140.";
    else if (semana !== null && dia && semana > dia * 7) e.precoSemana = "A semana deve custar no máximo 7 diárias.";
    var mes = preco("precoMes");
    if (mes !== null && (isNaN(mes) || mes <= 0)) e.precoMes = "Use só números, como 500.";
    else if (mes !== null && dia && mes > dia * 30) e.precoMes = "O mês deve custar no máximo 30 diárias.";
    if (d.local.trim().length < 3) e.local = "Informe o bairro e a cidade, como Rio Vermelho, Salvador.";
    if (foto && !/^(https?:\/\/\S+|data:image\/|assets\/img\/)/i.test(foto)) e.foto = "Cole um endereço que comece com http:// ou https://.";
    if (!d.politica) e.politica = "Escolha uma política de cancelamento.";
    return e;
  }

  function atualizarPrevia() {
    var d = dados("ativo");
    var exemplo = {
      id: "previa", donoId: usuario.id, nome: d.nome.trim() || "Nome do item",
      categoria: d.categoria || "Outros", precoDia: d.precoDia || 0,
      local: d.local.trim() || AF.usuarios.local(usuario) || "Seu bairro", foto: foto
    };
    var previa = $("anuncio-previa");
    previa.innerHTML = AF.cardAnuncio.html(exemplo);
    AF.cardAnuncio.consertarFotos(previa);

    var falta = AF.anuncios.pendencias({ foto: foto, nome: d.nome.trim(), categoria: d.categoria, descricao: d.descricao.trim(), precoDia: d.precoDia, local: d.local.trim(), politica: d.politica });
    var itens = [["a foto", "Foto real do item"], ["o nome", "Nome"], ["a categoria", "Categoria"], ["a descrição", "Descrição com 20+ letras"], ["a diária", "Preço por dia"], ["a localização", "Bairro e cidade"], ["a política de cancelamento", "Política de cancelamento"]];
    $("anuncio-checagem").innerHTML = itens.map(function (i) {
      var ok = falta.indexOf(i[0]) === -1;
      return '<li class="checagem__item' + (ok ? " checagem__item--ok" : "") + '"><span class="icone icone--' + (ok ? "check" : "info") + '" aria-hidden="true"></span>' + i[1] + "</li>";
    }).join("");
  }

  form.addEventListener("input", atualizarPrevia);
  form.addEventListener("change", atualizarPrevia);
  V.limparAoDigitar(form);

  // Editar: preenche o formulário
  if (editando) {
    document.title = "Editar anúncio · AlugaFácil";
    $("anunciar-titulo").textContent = "Editar anúncio";
    $("anunciar-trilha").textContent = "Editar";
    $("anuncio-publicar").textContent = editando.status === "rascunho" ? "Publicar anúncio" : "Salvar alterações";
    ["nome", "categoria", "descricao", "local", "regras"].forEach(function (k) { form.elements[k].value = editando[k] || ""; });
    ["precoDia", "precoSemana", "precoMes"].forEach(function (k) { if (editando[k]) form.elements[k].value = AF.formatar.precoParaCampo(editando[k]); });
    if (editando.politica) form.querySelector('input[name="politica"][value="' + editando.politica + '"]').checked = true;
    form.elements.disponivel.checked = editando.status !== "pausado";
    foto = editando.foto || "";
    if (/^https?:/.test(foto)) form.elements.foto.value = foto;
    $("descricao-contador").textContent = form.elements.descricao.value.length + "/1000";
  } else {
    var local = AF.usuarios.local(usuario);
    if (local && usuario.bairro) form.elements.local.value = local;
    else $("anunciar-perfil").hidden = false;
  }
  mostrarFoto();

  function salvar(status, mensagem) {
    var d = dados(status);
    var salvo;
    try {
      salvo = editando ? AF.anuncios.atualizar(editando.id, d) : AF.anuncios.criar(d, usuario.id);
    } catch (erro) {
      AF.avisos.mostrar("Não foi possível salvar: o navegador está sem espaço. Use uma foto menor.", "erro");
      return;
    }
    AF.avisos.depois(mensagem, "sucesso");
    location.href = status === "rascunho" ? "meus-anuncios.html" : "detalhe-anuncio.html?id=" + encodeURIComponent(salvo.id);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!V.aplicar(form, erros(true))) {
      AF.avisos.mostrar("Confira os campos destacados antes de publicar.", "aviso");
      return;
    }
    if (!foto) {
      AF.avisos.mostrar("Adicione uma foto real do item para publicar.", "aviso");
      $("passo-1").scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    var status = form.elements.disponivel.checked ? "ativo" : "pausado";
    salvar(status, editando && editando.status !== "rascunho" ? "Alterações salvas." : status === "ativo" ? "Anúncio publicado! Ele já aparece na busca." : "Anúncio salvo e pausado.");
  });

  $("anuncio-rascunho").addEventListener("click", function () {
    if (!V.aplicar(form, erros(false))) return;
    salvar("rascunho", "Rascunho salvo. Termine quando quiser em Meus anúncios.");
  });
})(window.AlugaFacil);
