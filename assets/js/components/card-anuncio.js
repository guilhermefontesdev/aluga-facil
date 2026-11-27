/* ==========================================================================
   Card de anúncio · monta o card a partir dos dados do anúncio
   Usado em T11 Início, T14 Busca e T10 Perfil público.

   Uso:
     AlugaFacil.cardAnuncio.html(anuncio)   -> texto HTML do card
     AlugaFacil.cardAnuncio.preencher(lista, anuncios)  -> coloca os cards na lista
   ========================================================================== */

window.AlugaFacil = window.AlugaFacil || {};

(function (AF) {
  function fotoHtml(anuncio, classe) {
    var icone = AF.anuncios.ICONES[anuncio.categoria] || "caixa";
    var vazia = '<div class="' + classe + ' foto-vazia"><span class="icone icone--' + icone + '" aria-hidden="true"></span></div>';
    if (!anuncio.foto) return vazia;
    return '<img class="' + classe + '" src="' + AF.app.esc(AF.app.foto(anuncio.foto)) + '" alt="" loading="lazy" data-vazia="' + icone + '">';
  }

  function html(anuncio) {
    var e = AF.app.esc;
    var dono = AF.usuarios.buscar(anuncio.donoId);
    var rep = dono ? AF.perfil.reputacao(dono.id, "anunciante") : { total: 0 };
    var nota = rep.total
      ? '<span class="card__nota"><span class="icone icone--estrela" aria-hidden="true"></span>' + AF.perfil.nota(rep.media) + "</span>"
      : '<span class="card__nota card__nota--novo">Novo</span>';
    return '<article class="card card--anuncio">' +
      '<a class="card__link" href="' + AF.app.url("pages/anuncios/detalhe-anuncio.html?id=" + encodeURIComponent(anuncio.id)) + '">' +
        fotoHtml(anuncio, "card__foto") +
        '<div class="card__conteudo">' +
          '<div class="card__linha"><span class="card__categoria">' + e(anuncio.categoria) + "</span>" + nota + "</div>" +
          '<h3 class="card__titulo">' + e(anuncio.nome) + "</h3>" +
          '<p class="card__local"><span class="icone icone--local" aria-hidden="true"></span>' + e(anuncio.local || "Local não informado") + "</p>" +
          '<p class="card__preco">' + AF.formatar.preco(anuncio.precoDia) + ' <span class="card__preco-unidade">/dia</span></p>' +
        "</div>" +
      "</a>" +
    "</article>";
  }

  /* Foto com endereço quebrado vira o quadro com o ícone da categoria */
  function consertarFotos(raiz) {
    raiz.querySelectorAll("img[data-vazia]").forEach(function (img) {
      img.addEventListener("error", function () {
        var vazia = document.createElement("div");
        vazia.className = img.className + " foto-vazia";
        vazia.innerHTML = '<span class="icone icone--' + img.dataset.vazia + '" aria-hidden="true"></span>';
        img.replaceWith(vazia);
      }, { once: true });
    });
  }

  function preencher(lista, anuncios) {
    lista.innerHTML = anuncios.map(html).join("");
    consertarFotos(lista);
  }

  AF.cardAnuncio = { html: html, fotoHtml: fotoHtml, preencher: preencher, consertarFotos: consertarFotos };
})(window.AlugaFacil);
