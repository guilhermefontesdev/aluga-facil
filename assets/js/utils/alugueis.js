/* ==========================================================================
   Aluguéis · pedidos de aluguel salvos no navegador (localStorage)  RF14–RF21
   Usado por T15 (valida as datas), T16 Confirmar, T08 Meus aluguéis,
   T09 Detalhe do aluguel e T17 Cancelar.

   Quem pede é o usuário logado (locatário); quem responde é o dono do
   anúncio (anunciante). Cada mudança gera uma notificação para o outro lado.

   Uso:
     AlugaFacil.alugueis.doUsuario(id)          -> pedidos em que a pessoa participa
     AlugaFacil.alugueis.buscar(id)             -> um pedido ou null
     AlugaFacil.alugueis.criar(dados)           -> pedido criado (status "pendente")
     AlugaFacil.alugueis.aceitar(id) / recusar(id, motivo) / desistir(id)
     AlugaFacil.alugueis.cancelar(id, motivo)   -> cancela com multa (T17)
     AlugaFacil.alugueis.confirmarDevolucao(id) -> conclui o aluguel
     AlugaFacil.alugueis.avaliar(id, papelAvaliado, nota, texto)
     AlugaFacil.alugueis.situacao(pedido)       -> status que aparece na tela
     AlugaFacil.alugueis.papelDe(pedido, usuarioId) -> "locatario" ou "anunciante"
     AlugaFacil.alugueis.multa(pedido)          -> { percentual, valor, horas }
     AlugaFacil.alugueis.periodoOcupado(anuncioId, inicio, fim)

   Status salvo: pendente, aceito, recusado, cancelado, concluido.
   Situação na tela (calculada pela data de hoje): também em-andamento,
   devolucao (acabou e falta o dono confirmar) e expirado (48 h sem resposta).
   ========================================================================== */

window.AlugaFacil = window.AlugaFacil || {};

(function (AF) {
  var D = AF.dados;
  var PRIMEIRO_NUMERO = 4821;
  var HORAS_PARA_RESPONDER = 48;
  var UMA_HORA = 60 * 60 * 1000;
  var UM_DIA = 24 * UMA_HORA;
  var LINK = "pages/alugueis/detalhe-aluguel.html?id=";

  var SITUACOES = {
    pendente: "Pendente",
    aceito: "Aceito",
    recusado: "Recusado",
    "em-andamento": "Em andamento",
    devolucao: "Aguardando devolução",
    concluido: "Concluído",
    cancelado: "Cancelado",
    expirado: "Expirado"
  };

  /* Classe da etiqueta (components/etiquetas.css) de cada situação */
  var ETIQUETAS = {
    pendente: "pendente", aceito: "aceito", recusado: "recusado", "em-andamento": "em-andamento",
    devolucao: "em-andamento", concluido: "concluido", cancelado: "cancelado", expirado: "expirado"
  };

  function ler() { return D.ler("alugueis"); }

  function gravar(lista) {
    if (!D.gravar("alugueis", lista)) throw new Error("armazenamento-cheio");
  }

  /* ----- datas ("AAAA-MM-DD") ----- */

  function dois(n) { return (n < 10 ? "0" : "") + n; }

  function dataDe(texto) {
    var partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(texto || ""));
    if (!partes) return null;
    var data = new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]));
    var confere = data.getFullYear() === Number(partes[1]) && data.getMonth() === Number(partes[2]) - 1 && data.getDate() === Number(partes[3]);
    return confere ? data : null;
  }

  function paraISO(data) {
    return data.getFullYear() + "-" + dois(data.getMonth() + 1) + "-" + dois(data.getDate());
  }

  function hoje() {
    var agora = new Date();
    return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  }

  /* 12 a 14 = 3 diárias. 0 se alguma data for inválida ou o fim vier antes do início */
  function dias(inicio, fim) {
    var i = dataDe(inicio);
    var f = dataDe(fim);
    if (!i || !f || f < i) return 0;
    return Math.round((f - i) / UM_DIA) + 1;
  }

  /* Usa o preço da semana ou do mês quando sai mais barato que as diárias */
  function total(precoDia, quantidade, precoSemana, precoMes) {
    var porDia = Number(precoDia) * quantidade;
    var melhor = porDia;
    if (precoSemana && quantidade >= 7) {
      melhor = Math.min(melhor, Math.floor(quantidade / 7) * precoSemana + (quantidade % 7) * precoDia);
    }
    if (precoMes && quantidade >= 30) {
      melhor = Math.min(melhor, Math.floor(quantidade / 30) * precoMes + (quantidade % 30) * precoDia);
    }
    return Math.round(melhor * 100) / 100;
  }

  function formatarData(texto, comAno) {
    var data = dataDe(texto);
    if (!data) return "";
    var curta = dois(data.getDate()) + "/" + dois(data.getMonth() + 1);
    return comAno ? curta + "/" + data.getFullYear() : curta;
  }

  function descreverPeriodo(inicio, fim) {
    var quantidade = dias(inicio, fim);
    var texto = inicio === fim ? formatarData(inicio, true) : formatarData(inicio, false) + " a " + formatarData(fim, true);
    return texto + " · " + quantidade + (quantidade === 1 ? " dia" : " dias");
  }

  function periodoCurto(inicio, fim) {
    var i = dataDe(inicio);
    var f = dataDe(fim);
    if (!i || !f) return "";
    if (inicio === fim) return formatarData(inicio, false);
    if (i.getMonth() === f.getMonth() && i.getFullYear() === f.getFullYear()) return dois(i.getDate()) + " a " + formatarData(fim, false);
    return formatarData(inicio, false) + " a " + formatarData(fim, false);
  }

  function limiteResposta(pedido) {
    return new Date(new Date(pedido.criadoEm).getTime() + HORAS_PARA_RESPONDER * UMA_HORA);
  }

  function prazoResposta(pedido) {
    var limite = limiteResposta(pedido);
    var minutos = limite.getMinutes();
    return dois(limite.getDate()) + "/" + dois(limite.getMonth() + 1) + " às " + limite.getHours() + "h" + (minutos ? dois(minutos) : "");
  }

  /* ----- situação calculada ----- */

  function situacao(pedido) {
    var h = hoje();
    var inicio = dataDe(pedido.inicio);
    var fim = dataDe(pedido.fim);
    if (pedido.status === "pendente") {
      if (Date.now() > limiteResposta(pedido).getTime() || (inicio && inicio < h)) return "expirado";
      return "pendente";
    }
    if (pedido.status === "aceito") {
      if (fim && h > fim) return "devolucao";
      if (inicio && h >= inicio) return "em-andamento";
      return "aceito";
    }
    return pedido.status;
  }

  function papelDe(pedido, usuarioId) {
    if (pedido.locatarioId === usuarioId) return "locatario";
    if (pedido.anuncianteId === usuarioId) return "anunciante";
    return null;
  }

  /* ----- consultas ----- */

  function listar() {
    return ler().sort(function (a, b) { return b.criadoEm.localeCompare(a.criadoEm); });
  }

  function doUsuario(id) {
    return listar().filter(function (r) { return r.locatarioId === id || r.anuncianteId === id; });
  }

  function buscar(id) {
    return ler().filter(function (r) { return r.id === id; })[0] || null;
  }

  /* As datas de um aluguel aceito ficam bloqueadas para o mesmo anúncio (RF17) */
  function periodoOcupado(anuncioId, inicio, fim) {
    return ler().some(function (r) {
      return r.status === "aceito" && r.anuncioId === anuncioId && !(fim < r.inicio || inicio > r.fim);
    });
  }

  function reservas(anuncioId) {
    return ler().filter(function (r) { return r.anuncioId === anuncioId && r.status === "aceito" && situacao(r) !== "devolucao"; })
      .sort(function (a, b) { return a.inicio.localeCompare(b.inicio); });
  }

  /* ----- mudanças ----- */

  function nomeDe(id) {
    var u = AF.usuarios.buscar(id);
    return u ? AF.perfil.primeiroNome(u.nome) : "Alguém";
  }

  function avisar(usuarioId, tipo, titulo, texto, pedido) {
    AF.notificacoes.criar(usuarioId, tipo, titulo, texto, LINK + pedido.id);
  }

  function alterar(id, mudar) {
    var lista = ler();
    var pedido = lista.filter(function (r) { return r.id === id; })[0];
    if (!pedido) return null;
    if (mudar(pedido) === false) return null;
    pedido.atualizadoEm = new Date().toISOString();
    gravar(lista);
    return pedido;
  }

  function criar(dados) {
    var lista = ler();
    var anuncio = AF.anuncios.buscar(dados.anuncioId);
    if (!anuncio) throw new Error("anuncio-inexistente");
    var quantidade = dias(dados.inicio, dados.fim);
    var agora = new Date().toISOString();
    var numero = lista.reduce(function (maior, r) { return Math.max(maior, r.numero || 0); }, PRIMEIRO_NUMERO - 1) + 1;

    var pedido = {
      id: D.novoId("r"),
      numero: numero,
      anuncioId: anuncio.id,
      nomeItem: anuncio.nome,
      foto: anuncio.foto,
      anuncianteId: anuncio.donoId,
      locatarioId: dados.locatarioId,
      precoDia: anuncio.precoDia,
      politica: anuncio.politica || "moderada",
      inicio: dados.inicio,
      fim: dados.fim,
      dias: quantidade,
      total: total(anuncio.precoDia, quantidade, anuncio.precoSemana, anuncio.precoMes),
      mensagem: String(dados.mensagem || "").trim(),
      status: "pendente",
      motivo: "",
      multa: 0,
      avaliacoes: {},
      criadoEm: agora,
      atualizadoEm: agora
    };
    lista.push(pedido);
    gravar(lista);
    avisar(pedido.anuncianteId, "solicitacao", "Nova solicitação de aluguel",
      nomeDe(pedido.locatarioId) + " quer alugar seu item " + pedido.nomeItem + " de " + periodoCurto(pedido.inicio, pedido.fim) + ". Responda em até 48 horas.", pedido);
    return pedido;
  }

  function aceitar(id) {
    var pedido = alterar(id, function (p) {
      if (situacao(p) !== "pendente") return false;
      p.status = "aceito";
    });
    if (pedido) {
      avisar(pedido.locatarioId, "aceito", "Solicitação aceita",
        nomeDe(pedido.anuncianteId) + " aceitou seu pedido do item " + pedido.nomeItem + ". O contato já está liberado.", pedido);
    }
    return pedido;
  }

  function recusar(id, motivo) {
    var pedido = alterar(id, function (p) {
      if (situacao(p) !== "pendente") return false;
      p.status = "recusado";
      p.motivo = String(motivo || "").trim();
    });
    if (pedido) {
      avisar(pedido.locatarioId, "recusado", "Solicitação recusada",
        nomeDe(pedido.anuncianteId) + " recusou o pedido do item " + pedido.nomeItem + ". Nenhum valor foi cobrado.", pedido);
    }
    return pedido;
  }

  /* Quem pediu desiste antes da resposta: sem multa */
  function desistir(id) {
    var pedido = alterar(id, function (p) {
      if (situacao(p) !== "pendente") return false;
      p.status = "cancelado";
      p.motivo = "Desistiu antes da resposta";
    });
    if (pedido) {
      avisar(pedido.anuncianteId, "cancelado", "Solicitação cancelada",
        nomeDe(pedido.locatarioId) + " desistiu do pedido do item " + pedido.nomeItem + ".", pedido);
    }
    return pedido;
  }

  /* Multa do cancelamento conforme a política do anúncio (T17) */
  function multa(pedido) {
    var politica = AF.anuncios.POLITICAS[pedido.politica] || AF.anuncios.POLITICAS.moderada;
    var inicio = dataDe(pedido.inicio);
    var horas = inicio ? Math.max(0, (inicio.getTime() - Date.now()) / UMA_HORA) : 0;
    var percentual = horas >= politica.semMultaHoras ? 0 : horas >= politica.metadeHoras ? 50 : 100;
    if (pedido.politica === "flexivel" && horas < politica.semMultaHoras) percentual = 50;
    return { percentual: percentual, valor: Math.round(pedido.total * percentual) / 100, horas: horas, dias: Math.floor(horas / 24), politica: politica };
  }

  function cancelar(id, motivo) {
    var pedido = alterar(id, function (p) {
      if (situacao(p) !== "aceito") return false;
      p.multa = multa(p).valor;
      p.status = "cancelado";
      p.motivo = String(motivo || "").trim();
    });
    if (pedido) {
      avisar(pedido.anuncianteId, "cancelado", "Aluguel cancelado",
        nomeDe(pedido.locatarioId) + " cancelou o aluguel do item " + pedido.nomeItem + (pedido.motivo ? ". Motivo: " + pedido.motivo : "") + ".", pedido);
    }
    return pedido;
  }

  function confirmarDevolucao(id) {
    var pedido = alterar(id, function (p) {
      var s = situacao(p);
      if (s !== "devolucao" && s !== "em-andamento") return false;
      p.status = "concluido";
    });
    if (pedido) {
      avisar(pedido.locatarioId, "avaliacao", "Avaliação disponível",
        "O aluguel do item " + pedido.nomeItem + " foi concluído. Como foi alugar com " + nomeDe(pedido.anuncianteId) + "?", pedido);
      avisar(pedido.anuncianteId, "avaliacao", "Avaliação disponível",
        "Como foi alugar seu item " + pedido.nomeItem + " para " + nomeDe(pedido.locatarioId) + "?", pedido);
    }
    return pedido;
  }

  /* papelAvaliado: "anunciante" (o locatário avalia o dono) ou "locatario" */
  function avaliar(id, papelAvaliado, nota, texto) {
    var pedido = alterar(id, function (p) {
      if (p.status !== "concluido") return false;
      p.avaliacoes = p.avaliacoes || {};
      if (p.avaliacoes[papelAvaliado]) return false;
      p.avaliacoes[papelAvaliado] = { nota: Number(nota), texto: String(texto || "").trim() };
    });
    if (pedido) {
      var avaliadoId = papelAvaliado === "anunciante" ? pedido.anuncianteId : pedido.locatarioId;
      var autorId = papelAvaliado === "anunciante" ? pedido.locatarioId : pedido.anuncianteId;
      var autor = AF.usuarios.buscar(autorId);
      AF.perfil.avaliar({ avaliadoId: avaliadoId, papel: papelAvaliado, autor: autor ? autor.nome : "Usuário", nota: nota, texto: texto });
      avisar(avaliadoId, "avaliacao", "Você recebeu uma avaliação",
        nomeDe(autorId) + " deu nota " + nota + " para você no aluguel do item " + pedido.nomeItem + ".", pedido);
    }
    return pedido;
  }

  AF.alugueis = {
    SITUACOES: SITUACOES,
    ETIQUETAS: ETIQUETAS,
    listar: listar,
    doUsuario: doUsuario,
    buscar: buscar,
    criar: criar,
    aceitar: aceitar,
    recusar: recusar,
    desistir: desistir,
    cancelar: cancelar,
    confirmarDevolucao: confirmarDevolucao,
    avaliar: avaliar,
    multa: multa,
    situacao: situacao,
    papelDe: papelDe,
    periodoOcupado: periodoOcupado,
    reservas: reservas,
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
