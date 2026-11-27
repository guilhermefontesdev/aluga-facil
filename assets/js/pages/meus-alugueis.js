/* ==========================================================================
   T08 · Meus aluguéis · mostra os pedidos feitos no T16 (localStorage)
   Sem pedidos: mostra a tela de lista vazia (T08b).
   O papel (solicitante ou dono do item) é o escolhido no T09 e vale aqui também.
   ========================================================================== */

(function (AF) {
  var lista = document.getElementById("alugueis-lista");
  if (!lista) return;

  var template = document.getElementById("modelo-aluguel-item");
  var vazio = document.getElementById("alugueis-vazio");
  var pedidos = AF.alugueis.listar();

  // Sem pedidos: fica só a tela de lista vazia
  if (pedidos.length === 0) {
    ["alugueis-abas", "alugueis-filtro", "alugueis-lista", "alugueis-paginacao"].forEach(function (id) {
      document.getElementById(id).remove();
    });
    return;
  }

  // Com pedidos: tira a tela vazia e a paginação de exemplo
  vazio.remove();
  document.getElementById("alugueis-paginacao").remove();

  var papel = AF.alugueis.papel();
  var pessoa = AF.alugueis.PESSOAS[papel === "locatario" ? "anunciante" : "locatario"];

  pedidos.forEach(function (pedido) {
    var item = template.content.firstElementChild.cloneNode(true);
    item.dataset.papel = papel;
    item.dataset.status = pedido.status;

    var etiqueta = item.querySelector('[data-campo="etiqueta"]');
    etiqueta.classList.add("etiqueta--" + pedido.status);
    etiqueta.textContent = AF.alugueis.STATUS[pedido.status];

    var nome = item.querySelector('[data-campo="nome"]');
    nome.textContent = pedido.nomeItem;
    nome.href = "detalhe-aluguel.html?id=" + encodeURIComponent(pedido.id) + "&como=" + papel;

    item.querySelector('[data-campo="com-quem"]').textContent =
      "Com " + pessoa.primeiroNome + " · " + AF.alugueis.periodoCurto(pedido.inicio, pedido.fim);
    item.querySelector('[data-campo="valor"]').textContent =
      AF.formatar.preco(pedido.total) + " · " + (papel === "locatario" ? "Você aluga" : "Você anuncia");

    lista.appendChild(item);
  });
})(window.AlugaFacil);
