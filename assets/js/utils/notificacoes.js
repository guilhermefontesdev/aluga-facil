/* ==========================================================================
   Notificações · avisos de cada usuário (T18 e o sino do cabeçalho)
   Uso:
     AlugaFacil.notificacoes.doUsuario(id)        -> notificações (mais nova primeiro)
     AlugaFacil.notificacoes.naoLidas(id)         -> quantas faltam ler
     AlugaFacil.notificacoes.criar(id, tipo, titulo, texto, link)
     AlugaFacil.notificacoes.marcarLida(notifId)
     AlugaFacil.notificacoes.marcarTodas(id)
     AlugaFacil.notificacoes.tempo(iso)           -> "Há 5 min", "Ontem"...
   link é relativo à raiz do site (ex.: "pages/alugueis/detalhe-aluguel.html?id=...").
   ========================================================================== */

window.AlugaFacil = window.AlugaFacil || {};

(function (AF) {
  var D = AF.dados;

  /* Ícone e cor de cada tipo */
  var TIPOS = {
    solicitacao: { icone: "alugueis", cor: "info" },
    aceito: { icone: "check", cor: "sucesso" },
    recusado: { icone: "fechar", cor: "erro" },
    cancelado: { icone: "fechar", cor: "erro" },
    expirado: { icone: "relogio", cor: "neutro" },
    lembrete: { icone: "relogio", cor: "aviso" },
    andamento: { icone: "alugueis", cor: "secundaria" },
    devolucao: { icone: "check", cor: "aviso" },
    avaliacao: { icone: "estrela", cor: "aviso" },
    conta: { icone: "perfil", cor: "info" },
    anuncio: { icone: "anunciar", cor: "secundaria" }
  };

  function todas() { return D.ler("notificacoes"); }

  function doUsuario(id) {
    return todas()
      .filter(function (n) { return n.usuarioId === id; })
      .sort(function (a, b) { return b.criadoEm.localeCompare(a.criadoEm); });
  }

  function naoLidas(id) {
    return doUsuario(id).filter(function (n) { return !n.lida; }).length;
  }

  function criar(usuarioId, tipo, titulo, texto, link) {
    var lista = todas();
    var nova = { id: D.novoId("n"), usuarioId: usuarioId, tipo: tipo, titulo: titulo, texto: texto, link: link || "", criadoEm: new Date().toISOString(), lida: false };
    lista.push(nova);
    D.gravar("notificacoes", lista);
    return nova;
  }

  function marcarLida(notifId) {
    var lista = todas();
    lista.forEach(function (n) { if (n.id === notifId) n.lida = true; });
    D.gravar("notificacoes", lista);
  }

  function marcarTodas(usuarioId) {
    var lista = todas();
    lista.forEach(function (n) { if (n.usuarioId === usuarioId) n.lida = true; });
    D.gravar("notificacoes", lista);
  }

  function tempo(iso) {
    var minutos = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (minutos < 1) return "Agora";
    if (minutos < 60) return "Há " + minutos + " min";
    var horas = Math.round(minutos / 60);
    if (horas < 24) return "Há " + horas + " h";
    var dias = Math.round(horas / 24);
    if (dias === 1) return "Ontem";
    if (dias < 30) return "Há " + dias + " dias";
    return new Date(iso).toLocaleDateString("pt-BR");
  }

  AF.notificacoes = { TIPOS: TIPOS, doUsuario: doUsuario, naoLidas: naoLidas, criar: criar, marcarLida: marcarLida, marcarTodas: marcarTodas, tempo: tempo };
})(window.AlugaFacil);
