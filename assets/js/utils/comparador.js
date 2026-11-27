/* ==========================================================================
   Comparador · alugar ou comprar?                              RF22 a RF26
   Usado por T19. Só faz contas e guarda as simulações; a tela fica em
   assets/js/pages/comparador.js.

   Uso:
     AlugaFacil.comparador.mediaCategoria(categoria) -> { diaria, anuncios }
     AlugaFacil.comparador.calcular(dados)           -> resultado (ver abaixo)
     AlugaFacil.comparador.salvar(dados, resultado)  -> guarda a simulação
     AlugaFacil.comparador.listar()                  -> simulações (mais nova primeiro)

   dados: { produto, categoria, precoCompra, diasPorUso, usosPorAno, anos, diaria }
   resultado: { custoAluguel, diferenca, compensa: "alugar" | "comprar" | "empate",
                custoPorUso, pontoEquilibrio, diasNoPeriodo }
   O valor residual do produto (revenda) não entra na conta: está fora do
   escopo combinado no termo de aceite (RF26, RN4).
   ========================================================================== */

window.AlugaFacil = window.AlugaFacil || {};

(function (AF) {
  var CHAVE = "alugafacil:simulacoes";
  var ANOS_PADRAO = 3;

  /* Diária média usada quando ainda não há anúncio da categoria na plataforma */
  var MEDIA_PADRAO = {
    "Ferramentas": 20,
    "Eletrodomésticos": 30,
    "Eletrônicos e câmeras": 60,
    "Esportes e lazer": 35,
    "Festas e eventos": 45,
    "Jardinagem": 25,
    "Outros": 25
  };

  function centavos(valor) {
    return Math.round(valor * 100) / 100;
  }

  /* RF24 · diária de referência pela média dos anúncios da categoria */
  function mediaCategoria(categoria) {
    var daCategoria = AF.anuncios.listar().filter(function (a) { return a.categoria === categoria; });
    if (daCategoria.length === 0) return { diaria: MEDIA_PADRAO[categoria] || 25, anuncios: 0 };
    var soma = daCategoria.reduce(function (total, a) { return total + a.precoDia; }, 0);
    return { diaria: centavos(soma / daCategoria.length), anuncios: daCategoria.length };
  }

  /* RF24 a RF26 · custo de alugar no período, diferença e indicação */
  function calcular(dados) {
    var anos = dados.anos || ANOS_PADRAO;
    var diasNoPeriodo = dados.diasPorUso * dados.usosPorAno * anos;
    var custoPorUso = centavos(dados.diasPorUso * dados.diaria);
    var custoAluguel = centavos(diasNoPeriodo * dados.diaria);
    var diferenca = centavos(Math.abs(dados.precoCompra - custoAluguel));
    var compensa = custoAluguel < dados.precoCompra ? "alugar" : custoAluguel > dados.precoCompra ? "comprar" : "empate";

    return {
      anos: anos,
      diasNoPeriodo: diasNoPeriodo,
      custoPorUso: custoPorUso,
      custoAluguel: custoAluguel,
      diferenca: diferenca,
      compensa: compensa,
      // a partir de quantos usos a compra sai mais barata que o aluguel
      pontoEquilibrio: custoPorUso > 0 ? Math.floor(dados.precoCompra / custoPorUso) + 1 : 0
    };
  }

  function listar() {
    try {
      var lista = JSON.parse(localStorage.getItem(CHAVE) || "[]");
      return Array.isArray(lista) ? lista : [];
    } catch (erro) {
      return [];
    }
  }

  function salvar(dados, resultado) {
    var lista = listar();
    var simulacao = Object.assign({ id: Date.now().toString(36), criadaEm: new Date().toISOString() }, dados, resultado);
    lista.unshift(simulacao);
    localStorage.setItem(CHAVE, JSON.stringify(lista.slice(0, 20)));
    return simulacao;
  }

  AF.comparador = {
    ANOS_PADRAO: ANOS_PADRAO,
    mediaCategoria: mediaCategoria,
    calcular: calcular,
    salvar: salvar,
    listar: listar
  };
})(window.AlugaFacil);
