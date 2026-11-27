/* ==========================================================================
   T07 Meu perfil                                                  RF03–RF05
   Lê e grava o usuário logado (AlugaFacil.usuarios). Ao salvar, o cabeçalho
   é redesenhado: nome, e-mail e foto do menu da conta mudam na hora.
   ========================================================================== */

(function (AF) {
  var form = document.getElementById("perfil-form");
  var usuario = AF.sessao.usuario();
  if (!form || !usuario) return;

  var V = AF.validacao;
  var app = AF.app;
  var CAMPOS = ["nome", "email", "telefone", "cep", "estado", "cidade", "bairro", "rua", "apresentacao"];
  var estado = document.getElementById("perfil-estado");
  var fotoNova = null;

  function $(id) { return document.getElementById(id); }

  function avatarHtml(u, foto) {
    var src = foto !== null && foto !== undefined ? foto : u.foto;
    return src
      ? '<img class="avatar avatar--grande avatar--foto" src="' + app.esc(app.foto(src)) + '" alt="Sua foto">'
      : '<span class="avatar avatar--grande" aria-hidden="true">' + AF.perfil.iniciais(u.nome) + "</span>";
  }

  function notaHtml(rotulo, rep) {
    return '<li><span>' + rotulo + '</span><span class="nota"><span class="icone icone--estrela" aria-hidden="true"></span><strong>' +
      (rep.total ? AF.perfil.nota(rep.media) : "Novo") + "</strong>" +
      (rep.total ? " (" + rep.total + ")" : "") + "</span></li>";
  }

  function desenharCartao(u) {
    $("perfil-avatar").innerHTML = avatarHtml(u, fotoNova);
    $("perfil-nome").textContent = u.nome;
    $("perfil-desde").textContent = "No AlugaFácil desde " + u.desde;
    $("perfil-notas").innerHTML =
      notaHtml("Como anunciante", AF.perfil.reputacao(u.id, "anunciante")) +
      notaHtml("Como locatário", AF.perfil.reputacao(u.id, "locatario"));
    $("perfil-publico").href = "perfil-publico.html?id=" + encodeURIComponent(u.id);
  }

  function preencher(u) {
    CAMPOS.forEach(function (campo) {
      if (form.elements[campo]) form.elements[campo].value = u[campo] || "";
    });
    form.elements.whatsapp.checked = !!u.whatsapp;
    $("cpf").value = u.cpf || "";
    $("nascimento").value = u.nascimento ? u.nascimento.split("-").reverse().join("/") : "";
    ["senhaAtual", "senhaNova", "senhaConfirmar"].forEach(function (c) { form.elements[c].value = ""; });
    fotoNova = null;
    desenharCartao(u);
    marcar(false);
  }

  function marcar(alterado) {
    form.classList.toggle("alterado", alterado);
    estado.textContent = alterado ? "Você tem alterações não salvas." : "Nenhuma alteração.";
  }

  function valores() {
    var v = {};
    CAMPOS.forEach(function (campo) { v[campo] = form.elements[campo].value; });
    v.whatsapp = form.elements.whatsapp.checked;
    v.senhaAtual = form.elements.senhaAtual.value;
    v.senhaNova = form.elements.senhaNova.value;
    v.senhaConfirmar = form.elements.senhaConfirmar.value;
    return v;
  }

  function validar(v) {
    var erros = V.validarPerfil(v);
    var dono = AF.usuarios.porEmail(v.email);
    if (!erros.email && dono && dono.id !== usuario.id) erros.email = "Este e-mail já está em uso por outra conta.";
    if (v.senhaAtual || v.senhaNova || v.senhaConfirmar) {
      if (v.senhaAtual !== AF.usuarios.buscar(usuario.id).senha) erros.senhaAtual = "Senha atual incorreta.";
      if (!V.senhaForte(v.senhaNova)) erros.senhaNova = "Mínimo de 8 caracteres, com letra e número.";
      if (v.senhaNova !== v.senhaConfirmar) erros.senhaConfirmar = "As senhas não são iguais.";
    }
    return erros;
  }

  /* ----- CEP: preenche cidade, bairro e rua (ViaCEP, se houver internet) ----- */
  function buscarCep() {
    var numeros = form.elements.cep.value.replace(/\D/g, "");
    if (numeros.length !== 8 || !window.fetch) return;
    fetch("https://viacep.com.br/ws/" + numeros + "/json/")
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || d.erro) { V.mostrarErro(form.elements.cep, "CEP não encontrado. Preencha o endereço à mão."); return; }
        if (d.uf) form.elements.estado.value = d.uf;
        if (d.localidade) form.elements.cidade.value = d.localidade;
        if (d.bairro) form.elements.bairro.value = d.bairro;
        if (d.logradouro && !form.elements.rua.value) form.elements.rua.value = d.logradouro + ", ";
        marcar(true);
      })
      .catch(function () { /* sem internet: a pessoa preenche à mão */ });
  }

  /* ----- foto ----- */
  function lerFoto(arquivo) {
    if (!arquivo) return;
    if (!/^image\/(png|jpe?g)$/.test(arquivo.type) || arquivo.size > 5 * 1024 * 1024) {
      AF.avisos.mostrar("Use uma imagem JPG ou PNG de até 5 MB.", "erro");
      return;
    }
    var leitor = new FileReader();
    leitor.onload = function () {
      var img = new Image();
      img.onload = function () {
        var lado = 240;
        var tela = document.createElement("canvas");
        tela.width = lado; tela.height = lado;
        var menor = Math.min(img.width, img.height);
        tela.getContext("2d").drawImage(img, (img.width - menor) / 2, (img.height - menor) / 2, menor, menor, 0, 0, lado, lado);
        fotoNova = tela.toDataURL("image/jpeg", 0.85);
        desenharCartao(AF.usuarios.buscar(usuario.id));
        marcar(true);
      };
      img.src = leitor.result;
    };
    leitor.readAsDataURL(arquivo);
  }

  /* ----- eventos ----- */
  V.mascarar(form.elements.telefone, "telefone");
  V.mascarar(form.elements.cep, "cep");
  V.limparAoDigitar(form);
  form.addEventListener("input", function () { marcar(true); });
  form.addEventListener("change", function () { marcar(true); });
  form.elements.cep.addEventListener("blur", buscarCep);
  $("perfil-foto-arquivo").addEventListener("change", function (e) { lerFoto(e.target.files[0]); e.target.value = ""; });

  $("perfil-descartar").addEventListener("click", function () {
    preencher(AF.usuarios.buscar(usuario.id));
    AF.avisos.mostrar("Alterações descartadas.", "info");
  });

  $("perfil-sair").addEventListener("click", function () {
    AF.sessao.sair();
    AF.avisos.depois("Você saiu da sua conta.", "info");
    location.href = app.url("index.html");
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = valores();
    if (!V.aplicar(form, validar(v))) {
      AF.avisos.mostrar("Confira os campos destacados.", "erro");
      return;
    }
    var dados = {};
    CAMPOS.forEach(function (campo) { dados[campo] = v[campo]; });
    dados.whatsapp = v.whatsapp;
    if (fotoNova) dados.foto = fotoNova;
    try {
      var atualizado = AF.usuarios.atualizar(usuario.id, dados);
      if (v.senhaNova) AF.usuarios.trocarSenha(atualizado.email, v.senhaNova);
      preencher(atualizado);
      app.atualizarCabecalho();       /* menu da conta mostra o novo nome/e-mail */
      AF.avisos.mostrar("Perfil salvo. Os dados novos já aparecem no menu da sua conta.", "sucesso");
    } catch (erro) {
      AF.avisos.mostrar("Não foi possível salvar: o armazenamento do navegador está cheio. Tente uma foto menor.", "erro");
    }
  });

  window.addEventListener("beforeunload", function (e) {
    if (form.classList.contains("alterado")) { e.preventDefault(); e.returnValue = ""; }
  });

  preencher(usuario);
})(window.AlugaFacil);
