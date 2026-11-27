/* ==========================================================================
   Anúncios · dados salvos no navegador (localStorage)            RF07–RF12
   Usado por T11 Início, T12 Meus anúncios, T13 Anunciar, T14 Busca,
   T15 Detalhe, T10 Perfil público e T19 Comparador.

   Uso:
     AlugaFacil.anuncios.listar()             -> anúncios ATIVOS (mais novo primeiro)
     AlugaFacil.anuncios.doDono(usuarioId)    -> todos os anúncios da pessoa (inclui rascunhos)
     AlugaFacil.anuncios.buscar(id)           -> um anúncio ou null
     AlugaFacil.anuncios.criar(dados, donoId) -> anúncio criado
     AlugaFacil.anuncios.atualizar(id, dados) -> anúncio atualizado ou null
     AlugaFacil.anuncios.mudarStatus(id, st)  -> "ativo", "pausado" ou "rascunho"
     AlugaFacil.anuncios.excluir(id)          -> true se excluiu

   Formato:
     { id, donoId, nome, categoria, descricao, precoDia, precoSemana, precoMes,
       local, regras, politica, foto, status, criadoEm, atualizadoEm }
     politica: "flexivel" | "moderada" | "rigida"
   ========================================================================== */

window.AlugaFacil = window.AlugaFacil || {};

(function (AF) {
  var D = AF.dados;

  var CATEGORIAS = [
    "Ferramentas",
    "Eletrodomésticos",
    "Eletrônicos e câmeras",
    "Esportes e lazer",
    "Festas e eventos",
    "Jardinagem",
    "Outros"
  ];

  /* Ícone de cada categoria (classes de components/icones.css) */
  var ICONES = {
    "Ferramentas": "ferramenta",
    "Eletrodomésticos": "eletrodomestico",
    "Eletrônicos e câmeras": "camera",
    "Esportes e lazer": "esporte",
    "Festas e eventos": "festa",
    "Jardinagem": "planta",
    "Outros": "caixa"
  };

  /* Política de cancelamento (T13 passo 7, T16, T17) */
  var POLITICAS = {
    flexivel: { nome: "Flexível", texto: "Sem multa até 24 h antes. Depois disso, 50%.", semMultaHoras: 24, metadeHoras: 0 },
    moderada: { nome: "Moderada", texto: "Sem multa até 3 dias antes. 50% entre 24 h e 3 dias. 100% com menos de 24 h.", semMultaHoras: 72, metadeHoras: 24 },
    rigida: { nome: "Rígida", texto: "Sem multa até 7 dias antes. 50% entre 48 h e 7 dias. 100% com menos de 48 h.", semMultaHoras: 168, metadeHoras: 48 }
  };

  var STATUS = { ativo: "Ativo", pausado: "Pausado", rascunho: "Rascunho" };

  function ler() { return D.ler("anuncios"); }

  function numeroOuNull(valor) {
    var n = Number(valor);
    return valor === null || valor === undefined || valor === "" || isNaN(n) || n <= 0 ? null : n;
  }

  function normalizar(dados) {
    return {
      nome: String(dados.nome || "").trim(),
      categoria: String(dados.categoria || "").trim(),
      descricao: String(dados.descricao || "").trim(),
      precoDia: Number(dados.precoDia) || 0,
      precoSemana: numeroOuNull(dados.precoSemana),
      precoMes: numeroOuNull(dados.precoMes),
      local: String(dados.local || "").trim(),
      regras: String(dados.regras || "").trim(),
      politica: POLITICAS[dados.politica] ? dados.politica : "",
      foto: String(dados.foto || "").trim(),
      status: STATUS[dados.status] ? dados.status : "ativo"
    };
  }

  function maisNovoPrimeiro(a, b) { return b.criadoEm.localeCompare(a.criadoEm); }

  function listar() {
    return ler().filter(function (a) { return a.status === "ativo"; }).sort(maisNovoPrimeiro);
  }

  function doDono(usuarioId) {
    return ler().filter(function (a) { return a.donoId === usuarioId; }).sort(maisNovoPrimeiro);
  }

  function buscar(id) {
    return ler().filter(function (a) { return a.id === id; })[0] || null;
  }

  function criar(dados, donoId) {
    var agora = new Date().toISOString();
    var anuncio = normalizar(dados);
    anuncio.id = D.novoId("a");
    anuncio.donoId = donoId;
    anuncio.criadoEm = agora;
    anuncio.atualizadoEm = agora;
    var lista = ler();
    lista.push(anuncio);
    if (!D.gravar("anuncios", lista)) throw new Error("armazenamento-cheio");
    return anuncio;
  }

  function atualizar(id, dados) {
    var lista = ler();
    var indice = lista.findIndex(function (a) { return a.id === id; });
    if (indice === -1) return null;
    var atualizado = normalizar(dados);
    atualizado.id = id;
    atualizado.donoId = lista[indice].donoId;
    atualizado.criadoEm = lista[indice].criadoEm;
    atualizado.atualizadoEm = new Date().toISOString();
    lista[indice] = atualizado;
    if (!D.gravar("anuncios", lista)) throw new Error("armazenamento-cheio");
    return atualizado;
  }

  function mudarStatus(id, status) {
    var lista = ler();
    var anuncio = lista.filter(function (a) { return a.id === id; })[0];
    if (!anuncio || !STATUS[status]) return null;
    anuncio.status = status;
    anuncio.atualizadoEm = new Date().toISOString();
    D.gravar("anuncios", lista);
    return anuncio;
  }

  function excluir(id) {
    var lista = ler();
    var restante = lista.filter(function (a) { return a.id !== id; });
    if (restante.length === lista.length) return false;
    D.gravar("anuncios", restante);
    return true;
  }

  /* O que falta para um rascunho poder ser publicado (T12 "Falta escolher...") */
  function pendencias(anuncio) {
    var falta = [];
    if (!anuncio.nome) falta.push("o nome");
    if (!anuncio.categoria) falta.push("a categoria");
    if (!anuncio.descricao || anuncio.descricao.length < 20) falta.push("a descrição");
    if (!anuncio.precoDia) falta.push("a diária");
    if (!anuncio.local) falta.push("a localização");
    if (!anuncio.politica) falta.push("a política de cancelamento");
    return falta;
  }

  AF.anuncios = {
    CATEGORIAS: CATEGORIAS,
    ICONES: ICONES,
    POLITICAS: POLITICAS,
    STATUS: STATUS,
    listar: listar,
    doDono: doDono,
    buscar: buscar,
    criar: criar,
    atualizar: atualizar,
    mudarStatus: mudarStatus,
    excluir: excluir,
    pendencias: pendencias
  };
})(window.AlugaFacil);
