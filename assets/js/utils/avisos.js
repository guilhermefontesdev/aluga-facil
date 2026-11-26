/* ==========================================================================
   Avisos flutuantes com JavaScript (componente .aviso--flutuante)
     AlugaFacil.avisos.mostrar("Anúncio salvo.", "sucesso")
     AlugaFacil.avisos.depois("Anúncio publicado.", "sucesso")
       -> guarda o aviso e mostra na PRÓXIMA página (ex.: depois de salvar
          e ir para Meus anúncios)
   Tipos: "info", "sucesso", "aviso", "erro". O de erro só some ao fechar.
   ========================================================================== */

window.AlugaFacil = window.AlugaFacil || {};

(function (AF) {
  var CHAVE_PROXIMA = "alugafacil:aviso-proxima-pagina";
  var TEMPO_MS = 5200; // um pouco mais que a animação de 5 s do CSS

  function area() {
    var lista = document.querySelector(".avisos-flutuantes:not(.avisos-flutuantes--exemplo)");
    if (!lista) {
      lista = document.createElement("div");
      lista.className = "avisos-flutuantes";
      document.body.appendChild(lista);
    }
    return lista;
  }

  function mostrar(texto, tipo) {
    tipo = tipo || "info";

    var aviso = document.createElement("div");
    aviso.className = "aviso aviso--" + tipo + " aviso--flutuante";
    aviso.setAttribute("role", tipo === "erro" ? "alert" : "status");

    var icone = document.createElement("span");
    icone.className = "icone aviso__icone icone--" + (tipo === "sucesso" ? "check" : "info");
    icone.setAttribute("aria-hidden", "true");

    var paragrafo = document.createElement("p");
    paragrafo.className = "aviso__texto";
    paragrafo.textContent = texto;

    var fechar = document.createElement("button");
    fechar.type = "button";
    fechar.className = "aviso__fechar";
    fechar.setAttribute("aria-label", "Fechar aviso");
    fechar.innerHTML = '<span class="icone icone--fechar" aria-hidden="true"></span>';
    fechar.addEventListener("click", function () { aviso.remove(); });

    aviso.append(icone, paragrafo, fechar);
    area().appendChild(aviso);

    // tira do HTML depois que o CSS esconder (o de erro fica até fechar)
    if (tipo !== "erro") {
      setTimeout(function () {
        if (!aviso.matches(":hover")) aviso.remove();
        else aviso.addEventListener("mouseleave", function () { aviso.remove(); }, { once: true });
      }, TEMPO_MS);
    }
    return aviso;
  }

  function depois(texto, tipo) {
    try {
      sessionStorage.setItem(CHAVE_PROXIMA, JSON.stringify({ texto: texto, tipo: tipo }));
    } catch (erro) { /* sem sessionStorage: o aviso só não aparece */ }
  }

  // Se a página anterior deixou um aviso guardado, mostra agora
  try {
    var guardado = JSON.parse(sessionStorage.getItem(CHAVE_PROXIMA));
    if (guardado) {
      sessionStorage.removeItem(CHAVE_PROXIMA);
      mostrar(guardado.texto, guardado.tipo);
    }
  } catch (erro) { /* nada guardado */ }

  AF.avisos = { mostrar: mostrar, depois: depois };
})(window.AlugaFacil);
