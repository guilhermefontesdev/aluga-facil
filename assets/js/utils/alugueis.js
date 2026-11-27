/* ==========================================================================
   Aluguéis · pedidos de aluguel salvos no navegador (localStorage)  RF14–RF16
   Usado por T15 (valida as datas), T16 Confirmar, T08 Meus aluguéis e
   T09 Detalhe do aluguel.

   Uso:
     AlugaFacil.alugueis.listar()                         -> pedidos (mais novo primeiro)
     AlugaFacil.alugueis.buscar(id)                       -> um pedido ou null
     AlugaFacil.alugueis.criar(dados)                     -> pedido criado (status "pendente")
     AlugaFacil.alugueis.mudarStatus(id, status, extras)  -> pedido atualizado ou null
     AlugaFacil.alugueis.excluir(id)                      -> true se excluiu
     AlugaFacil.alugueis.periodoOcupado(anuncioId, inicio, fim)
                                                          -> true se bate com um aluguel aceito

   Formato de um pedido:
     { id, numero, anuncioId, nomeItem, precoDia, inicio, fim, dias, total,
       mensagem, status, motivo, criadoEm, atualizadoEm }
     inicio e fim são datas "AAAA-MM-DD". total = dias × precoDia.
     status: "pendente", "aceito" ou "recusado".
   ========================================================================== */

window.AlugaFacil = window.AlugaFacil || {};

(function (AF) {
  var CHAVE = "alugafacil:alugueis";
  var CHAVE_PAPEL = "alugafacil:papel";
  var PRIMEIRO_NUMERO = 4821;
  var HORAS_PARA_RESPONDER = 48;
  var UM_DIA_MS = 24 * 60 * 60 * 1000;

  var STATUS = {
    pendente: "Pendente",
    aceito: "Aceito",
    recusado: "Recusado"
  };

  /* Sem login no protótipo: quem pede é sempre a Maria e o dono do item, o Carlos.
     O papel mostrado na tela ("locatario" ou "anunciante") é escolhido pelo usuário. */
  var PESSOAS = {
    locatario: { nome: "Maria Souza", primeiroNome: "Maria", inicial: "M" },
    anunciante: { nome: "Carlos", primeiroNome: "Carlos", inicial: "C" }
  };

  /* ----- armazenamento ----- */

  function ler() {
    try {
      var texto = localStorage.getItem(CHAVE);
      var lista = texto ? JSON.parse(texto) : [];
      return Array.isArray(lista) ? lista : [];
    } catch (erro) {
      return [];
    }
  }

  function gravar(lista) {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(lista));
      return true;
    } catch (erro) {
      return false;
    }
  }

  function novoId() {
    return "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function proximoNumero(lista) {
    return lista.reduce(function (maior, r) { return Math.max(maior, r.numero || 0); }, PRIMEIRO_NUMERO - 1) + 1;
  }

  /* ----- datas ("AAAA-MM-DD") ----- */

  function doisDigitos(n) {
    return (n < 10 ? "0" : "") + n;
  }

  /* "2026-10-12" -> Date no horário local (meia-noite). Devolve null se não for uma data válida */
  function dataDe(texto) {
    var partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(texto || ""));
    if (!partes) return null;
    var data = new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]));
    var confere = data.getFullYear() === Number(partes[1]) &&
      data.getMonth() === Number(partes[2]) - 1 &&
      data.getDate() === Number(partes[3]);
    return confere ? data : null;
  }

  function paraISO(data) {
    return data.getFullYear() + "-" + doisDigitos(data.getMonth() + 1) + "-" + doisDigitos(data.getDate());
  }

  function hoje() {
    var agora = new Date();
    return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  }

  /* Diárias do período, contando o dia do início e o do fim (12 a 14 = 3 diárias).
     Devolve 0 se alguma data for inválida ou se o fim vier antes do início */
  function dias(inicio, fim) {
    var i = dataDe(inicio);
    var f = dataDe(fim);
    if (!i || !f || f < i) return 0;
    return Math.round((f - i) / UM_DIA_MS) + 1;
  }

  function total(precoDia, quantidadeDeDias) {
    return Math.round(Number(precoDia) * quantidadeDeDias * 100) / 100;
  }

  /* "2026-10-12" -> "12/10/2026" (ou "12/10" sem o ano) */
  function formatarData(texto, comAno) {
    var data = dataDe(texto);
    if (!data) return "";
    var curta = doisDigitos(data.getDate()) + "/" + doisDigitos(data.getMonth() + 1);
    return comAno ? curta + "/" + data.getFullYear() : curta;
  }

  /* "12/10 a 14/10/2026 · 3 dias" */
  function descreverPeriodo(inicio, fim) {
    var quantidade = dias(inicio, fim);
    var texto = inicio === fim
      ? formatarData(inicio, true)
      : formatarData(inicio, false) + " a " + formatarData(fim, true);
    return texto + " · " + quantidade + (quantidade === 1 ? " dia" : " dias");
  }

  /* Versão curta para a lista: "12 a 14/10", "28/09 a 02/10" ou "01/09" */
  function periodoCurto(inicio, fim) {
    var i = dataDe(inicio);
    var f = dataDe(fim);
    if (!i || !f) return "";
    if (inicio === fim) return formatarData(inicio, false);
    if (i.getMonth() === f.getMonth() && i.getFullYear() === f.getFullYear()) {
      return doisDigitos(i.getDate()) + " a " + formatarData(fim, false);
    }
    return formatarData(inicio, false) + " a " + formatarData(fim, false);
  }

  /* Até quando o dono pode responder: "01/10 às 22h" */
  function prazoResposta(aluguel) {
    var limite = new Date(new Date(aluguel.criadoEm).getTime() + HORAS_PARA_RESPONDER * 60 * 60 * 1000);
    var minutos = limite.getMinutes();
    return doisDigitos(limite.getDate()) + "/" + doisDigitos(limite.getMonth() + 1) +
      " às " + limite.getHours() + "h" + (minutos ? doisDigitos(minutos) : "");
  }

  /* ----- pedidos ----- */

  function listar() {
    return ler().sort(function (a, b) { return b.criadoEm.localeCompare(a.criadoEm); });
  }

  function buscar(id) {
    return ler().filter(function (r) { return r.id === id; })[0] || null;
  }

  function criar(dados) {
    var lista = ler();
    var quantidade = dias(dados.inicio, dados.fim);
    var agora = new Date().toISOString();

    var aluguel = {
      id: novoId(),
      numero: proximoNumero(lista),
      anuncioId: String(dados.anuncioId || ""),
      nomeItem: String(dados.nomeItem || "").trim(),
      precoDia: Number(dados.precoDia) || 0,
      inicio: dados.inicio,
      fim: dados.fim,
      dias: quantidade,
      total: total(dados.precoDia, quantidade),
      mensagem: String(dados.mensagem || "").trim(),
      status: "pendente",
      motivo: "",
      criadoEm: agora,
      atualizadoEm: agora
    };

    lista.push(aluguel);
    if (!gravar(lista)) throw new Error("armazenamento-cheio");
    return aluguel;
  }

  /* O dono só responde uma vez: depois de aceito ou recusado, o status não muda mais */
  function mudarStatus(id, status, extras) {
    if (!STATUS[status]) return null;

    var lista = ler();
    var indice = lista.findIndex(function (r) { return r.id === id; });
    if (indice === -1 || lista[indice].status !== "pendente") return null;

    lista[indice].status = status;
    lista[indice].motivo = String((extras && extras.motivo) || "").trim();
    lista[indice].atualizadoEm = new Date().toISOString();
    if (!gravar(lista)) throw new Error("armazenamento-cheio");
    return lista[indice];
  }

  function excluir(id) {
    var lista = ler();
    var restante = lista.filter(function (r) { return r.id !== id; });
    if (restante.length === lista.length) return false;
    gravar(restante);
    return true;
  }

  /* As datas de um aluguel aceito ficam bloqueadas para o mesmo anúncio (RF17) */
  function periodoOcupado(anuncioId, inicio, fim) {
    return ler().some(function (r) {
      return r.status === "aceito" && r.anuncioId === anuncioId && !(fim < r.inicio || inicio > r.fim);
    });
  }

  /* ----- papel mostrado na tela ----- */

  function papel() {
    try {
      return localStorage.getItem(CHAVE_PAPEL) === "anunciante" ? "anunciante" : "locatario";
    } catch (erro) {
      return "locatario";
    }
  }

  function definirPapel(valor) {
    try {
      localStorage.setItem(CHAVE_PAPEL, valor === "anunciante" ? "anunciante" : "locatario");
    } catch (erro) { /* sem armazenamento: volta para o padrão */ }
  }

  AF.alugueis = {
    STATUS: STATUS,
    PESSOAS: PESSOAS,
    listar: listar,
    buscar: buscar,
    criar: criar,
    mudarStatus: mudarStatus,
    excluir: excluir,
    periodoOcupado: periodoOcupado,
    papel: papel,
    definirPapel: definirPapel,
    hoje: hoje,
    paraISO: paraISO,
    dataDe: dataDe,
    dias: dias,
    total: total,
    formatarData: formatarData,
    descreverPeriodo: descreverPeriodo,
    periodoCurto: periodoCurto,
    prazoResposta: prazoResposta
  };
})(window.AlugaFacil);
