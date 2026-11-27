/* T07 · Meu perfil — edição local sem framework */
(function () {
  var form = document.getElementById('perfil-form');
  if (!form) return;

  var chave = 'alugafacil.perfil';
  var campos = ['nome', 'email', 'telefone', 'localizacao', 'apresentacao'];
  var salvo = {};

  try {
    salvo = JSON.parse(localStorage.getItem(chave) || '{}');
  } catch (_) {}

  campos.forEach(function (nome) {
    var campo = document.getElementById('perfil-' + nome);
    if (campo && salvo[nome]) campo.value = salvo[nome];
  });

  form.addEventListener('submit', function (evento) {
    evento.preventDefault();
    var dados = {};
    campos.forEach(function (nome) {
      var campo = document.getElementById('perfil-' + nome);
      dados[nome] = campo ? campo.value.trim() : '';
    });
    localStorage.setItem(chave, JSON.stringify(dados));

    var aviso = document.getElementById('perfil-aviso');
    aviso.hidden = false;
    aviso.querySelector('.aviso__texto').textContent = 'Alterações guardadas com sucesso.';
    window.setTimeout(function () { aviso.hidden = true; }, 5000);
  });
})();
