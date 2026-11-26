/* ==========================================================================
   Anúncios · dados salvos no navegador (localStorage)            RF07–RF10
   Usado por T12 Meus anúncios, T13 Anunciar / Editar e T14 Busca.

   Uso:
     AlugaFacil.anuncios.listar()            -> lista de anúncios (mais novo primeiro)
     AlugaFacil.anuncios.buscar(id)          -> um anúncio ou null
     AlugaFacil.anuncios.criar(dados)        -> anúncio criado
     AlugaFacil.anuncios.atualizar(id, dados)-> anúncio atualizado ou null
     AlugaFacil.anuncios.excluir(id)         -> true se excluiu

   Formato de um anúncio:
     { id, nome, categoria, descricao, precoDia, foto, criadoEm, atualizadoEm }
     precoDia é número (25.5 = R$ 25,50). foto é um endereço de imagem ou "".
   ========================================================================== */

window.AlugaFacil = window.AlugaFacil || {};

(function (AF) {
  var CHAVE = "alugafacil:anuncios";

  var CATEGORIAS = [
    "Ferramentas",
    "Eletrodomésticos",
    "Eletrônicos e câmeras",
    "Esportes e lazer",
    "Festas e eventos",
    "Jardinagem",
    "Outros"
  ];

  /* Lê a lista salva. Se não houver nada (ou o dado estiver estragado), devolve [] */
  function ler() {
    try {
      var texto = localStorage.getItem(CHAVE);
      var lista = texto ? JSON.parse(texto) : [];
      return Array.isArray(lista) ? lista : [];
    } catch (erro) {
      return [];
    }
  }

  /* Salva a lista. Retorna false se o navegador não deixou (ex.: espaço cheio) */
  function gravar(lista) {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(lista));
      return true;
    } catch (erro) {
      return false;
    }
  }

  function novoId() {
    return "a" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /* Deixa só os campos conhecidos, já limpos */
  function normalizar(dados) {
    return {
      nome: String(dados.nome || "").trim(),
      categoria: String(dados.categoria || "").trim(),
      descricao: String(dados.descricao || "").trim(),
      precoDia: Number(dados.precoDia) || 0,
      foto: String(dados.foto || "").trim()
    };
  }

  function listar() {
    return ler().sort(function (a, b) { return b.criadoEm.localeCompare(a.criadoEm); });
  }

  function buscar(id) {
    return ler().filter(function (a) { return a.id === id; })[0] || null;
  }

  function criar(dados) {
    var agora = new Date().toISOString();
    var anuncio = normalizar(dados);
    anuncio.id = novoId();
    anuncio.criadoEm = agora;
    anuncio.atualizadoEm = agora;

    var lista = ler();
    lista.push(anuncio);
    if (!gravar(lista)) throw new Error("armazenamento-cheio");
    return anuncio;
  }

  function atualizar(id, dados) {
    var lista = ler();
    var indice = lista.findIndex(function (a) { return a.id === id; });
    if (indice === -1) return null;

    var atualizado = normalizar(dados);
    atualizado.id = id;
    atualizado.criadoEm = lista[indice].criadoEm;
    atualizado.atualizadoEm = new Date().toISOString();
    lista[indice] = atualizado;
    if (!gravar(lista)) throw new Error("armazenamento-cheio");
    return atualizado;
  }

  function excluir(id) {
    var lista = ler();
    var restante = lista.filter(function (a) { return a.id !== id; });
    if (restante.length === lista.length) return false;
    gravar(restante);
    return true;
  }

  AF.anuncios = {
    CATEGORIAS: CATEGORIAS,
    listar: listar,
    buscar: buscar,
    criar: criar,
    atualizar: atualizar,
    excluir: excluir
  };
})(window.AlugaFacil);
