/* ==========================================================================
   Card de anúncio · preenche um <template> do HTML com os dados do anúncio
   Usado em T12 Meus anúncios e T14 Busca.

   No template, marque os pedaços com data-campo / data-link / data-acao:
     data-campo="foto | nome | categoria | descricao | preco"
     data-link="editar | detalhe"   (recebem ?id=... no href)
     data-acao="excluir"            (recebe data-id)
   ========================================================================== */

window.AlugaFacil = window.AlugaFacil || {};

(function (AF) {
  function fotoVazia(classe) {
    var vazia = document.createElement("div");
    vazia.className = classe + " card__foto--vazia";
    vazia.textContent = "Sem foto";
    return vazia;
  }

  function criar(template, anuncio) {
    var card = template.content.firstElementChild.cloneNode(true);
    card.dataset.id = anuncio.id;

    function preencher(campo, texto) {
      card.querySelectorAll('[data-campo="' + campo + '"]').forEach(function (el) { el.textContent = texto; });
    }

    preencher("nome", anuncio.nome);
    preencher("categoria", anuncio.categoria);
    preencher("descricao", anuncio.descricao);
    preencher("preco", AF.formatar.preco(anuncio.precoDia));

    var foto = card.querySelector('[data-campo="foto"]');
    if (foto) {
      if (anuncio.foto) {
        foto.src = anuncio.foto;
        foto.alt = "Foto de " + anuncio.nome;
        // endereço quebrado: troca pelo "Sem foto"
        foto.addEventListener("error", function () { foto.replaceWith(fotoVazia(foto.className)); }, { once: true });
      } else {
        foto.replaceWith(fotoVazia(foto.className));
      }
    }

    card.querySelectorAll("[data-link]").forEach(function (link) {
      link.href = link.getAttribute("href") + "?id=" + encodeURIComponent(anuncio.id);
    });
    card.querySelectorAll("[data-acao]").forEach(function (botao) {
      botao.dataset.id = anuncio.id;
    });

    return card;
  }

  AF.cardAnuncio = { criar: criar };
})(window.AlugaFacil);
