/* ==========================================================================
   Formatação de valores para mostrar na tela
   ========================================================================== */

window.AlugaFacil = window.AlugaFacil || {};

(function (AF) {
  var moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  AF.formatar = {
    /* 25.5 -> "R$ 25,50" */
    preco: function (valor) {
      return moeda.format(Number(valor) || 0);
    },

    /* "25,50" ou "25.50" ou "R$ 25,50" -> 25.5 (ou NaN se não for número) */
    lerPreco: function (texto) {
      var limpo = String(texto || "").replace(/[^\d,.-]/g, "");
      // formato brasileiro: ponto separa milhar, vírgula separa centavos
      if (limpo.indexOf(",") !== -1) limpo = limpo.replace(/\./g, "").replace(",", ".");
      return limpo === "" ? NaN : Number(limpo);
    },

    /* 25.5 -> "25,50" (para preencher o campo ao editar) */
    precoParaCampo: function (valor) {
      return (Number(valor) || 0).toFixed(2).replace(".", ",");
    }
  };
})(window.AlugaFacil);
