/* ==========================================================================
   Dados · leitura e gravação no navegador (localStorage) + dados de exemplo
   Sem banco de dados: tudo fica salvo no navegador de quem usa o site.

   Uso:
     AlugaFacil.dados.ler("anuncios")          -> lista salva (ou [])
     AlugaFacil.dados.gravar("anuncios", lista)
     AlugaFacil.dados.novoId("a")              -> "a1k2j3..."
     AlugaFacil.dados.restaurar()              -> apaga tudo e volta aos exemplos

   Na primeira visita (ou quando VERSAO muda) o site é preenchido com
   usuários, anúncios, aluguéis, avaliações e notificações de exemplo.
   Todas as contas de exemplo usam a senha 123456.
   ========================================================================== */

window.AlugaFacil = window.AlugaFacil || {};

(function (AF) {
  var PREFIXO = "alugafacil:";
  var VERSAO = "4";
  var UM_DIA = 24 * 60 * 60 * 1000;

  function ler(nome, padrao) {
    try {
      var texto = localStorage.getItem(PREFIXO + nome);
      if (texto === null) return padrao === undefined ? [] : padrao;
      return JSON.parse(texto);
    } catch (erro) {
      return padrao === undefined ? [] : padrao;
    }
  }

  function gravar(nome, valor) {
    try {
      localStorage.setItem(PREFIXO + nome, JSON.stringify(valor));
      return true;
    } catch (erro) {
      return false;
    }
  }

  function apagar(nome) {
    try { localStorage.removeItem(PREFIXO + nome); } catch (erro) { /* nada */ }
  }

  function novoId(letra) {
    return (letra || "x") + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /* ----- datas relativas a hoje, para os exemplos sempre fazerem sentido ----- */
  function dois(n) { return (n < 10 ? "0" : "") + n; }

  function dia(deslocamento) {
    var d = new Date();
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + deslocamento);
    return d.getFullYear() + "-" + dois(d.getMonth() + 1) + "-" + dois(d.getDate());
  }

  function momento(minutosAtras) {
    return new Date(Date.now() - minutosAtras * 60 * 1000).toISOString();
  }

  /* ----- dados de exemplo ----- */

  function exemplos() {
    var usuarios = [
      {
        id: "u-maria", nome: "Maria Souza", email: "maria@email.com", senha: "123456",
        cpf: "123.456.789-09", nascimento: "15/03/1998", telefone: "(71) 99999-9999",
        cep: "40170-110", estado: "BA", cidade: "Salvador", bairro: "Ondina", rua: "Av. Oceânica, 2400",
        whatsapp: true, desde: "março de 2024",
        apresentacao: "Gosto de manter os meus itens em bom estado e ajudar a vizinhança a encontrar o que precisa por um preço justo."
      },
      {
        id: "u-carlos", nome: "Carlos Mendes", email: "carlos@email.com", senha: "123456",
        cpf: "987.654.321-00", nascimento: "02/08/1990", telefone: "(71) 99876-5432",
        cep: "41950-000", estado: "BA", cidade: "Salvador", bairro: "Rio Vermelho", rua: "Rua Fonte do Boi, 120",
        whatsapp: true, desde: "março de 2025",
        apresentacao: "Marceneiro nas horas vagas. Minhas ferramentas ficam paradas a semana toda, então prefiro que alguém aproveite."
      },
      {
        id: "u-ana", nome: "Ana Oliveira", email: "ana@email.com", senha: "123456",
        cpf: "321.654.987-11", nascimento: "21/11/1995", telefone: "(71) 98888-1234",
        cep: "40140-000", estado: "BA", cidade: "Salvador", bairro: "Barra", rua: "Rua Marquês de Caravelas, 55",
        whatsapp: false, desde: "janeiro de 2025",
        apresentacao: "Fotógrafa e organizadora de eventos. Alugo meus equipamentos com tudo testado e explicado."
      },
      {
        id: "u-pedro", nome: "Pedro Lima", email: "pedro@email.com", senha: "123456",
        cpf: "456.789.123-22", nascimento: "07/05/1987", telefone: "(71) 97777-4321",
        cep: "41810-000", estado: "BA", cidade: "Salvador", bairro: "Pituba", rua: "Rua Ceará, 300",
        whatsapp: true, desde: "julho de 2024",
        apresentacao: "Gosto de games e tecnologia. Tudo o que anuncio eu uso e conservo."
      }
    ];

    var img = "assets/img/anuncios/";
    function anuncio(id, donoId, nome, categoria, precoDia, precoSemana, precoMes, bairro, foto, politica, descricao, regras, diasAtras, status) {
      return {
        id: id, donoId: donoId, nome: nome, categoria: categoria,
        precoDia: precoDia, precoSemana: precoSemana, precoMes: precoMes,
        local: bairro + ", Salvador", foto: img + foto, politica: politica,
        descricao: descricao, regras: regras, status: status || "ativo",
        criadoEm: momento(diasAtras * 24 * 60), atualizadoEm: momento(diasAtras * 24 * 60)
      };
    }

    var anuncios = [
      anuncio("an-furadeira", "u-carlos", "Parafusadeira e furadeira Wap 12V", "Ferramentas", 20, 110, 380, "Rio Vermelho", "furadeira.jpg", "moderada",
        "Parafusadeira e furadeira sem fio Wap 12V com bateria e carregador. Leve, com controle de torque, ideal para montar móveis e instalar prateleiras, cortinas e suportes de TV.",
        "Devolver com a bateria carregada. Brocas não inclusas.", 2),
      anuncio("an-escada", "u-maria", "Escada de fibra 5 degraus", "Ferramentas", 15, 80, 250, "Ondina", "escada.jpg", "flexivel",
        "Escada tesoura de fibra de vidro com 5 degraus, isolante e firme, aguenta até 120 kg. Boa para pintura, troca de lâmpadas e serviços elétricos.",
        "Não deixar na chuva. Devolver sem respingos de tinta.", 6),
      anuncio("an-camera", "u-ana", "Câmera Sony A7 III com lente 28-70", "Eletrônicos e câmeras", 150, 800, null, "Barra", "camera.jpg", "rigida",
        "Câmera mirrorless full frame Sony A7 III com lente 28-70 mm, duas baterias, cartão de 64 GB e bolsa. Ótima para casamentos, eventos e vídeos em 4K.",
        "Entrega com conferência do equipamento. Caução combinada na retirada.", 4),
      anuncio("an-ps5", "u-pedro", "PlayStation 5 com controle DualSense", "Eletrônicos e câmeras", 60, 330, 1000, "Pituba", "ps5.jpg", "moderada",
        "PlayStation 5 com leitor de disco, controle DualSense e cabos HDMI e de força. Dá para jogar o novo GTA 6 nele, além de toda a biblioteca de PS5 e PS4. Perfeito para um fim de semana de jogatina ou uma festa com os amigos.",
        "Não instalar contas pessoais sem sair delas no final. Devolver com o controle carregado.", 1),
      anuncio("an-serra", "u-carlos", "Serra circular Makita 18V com 2 baterias", "Ferramentas", 35, 190, null, "Rio Vermelho", "serra.jpg", "moderada",
        "Serra circular sem fio Makita 18V com duas baterias, carregador e maleta. Corta madeira, MDF e compensado com precisão.",
        "Usar óculos de proteção. Disco danificado é por conta de quem alugou.", 9)
    ];

    function aluguel(id, numero, anuncioId, locatarioId, inicio, fim, status, criadoMinutosAtras, extras) {
      var a = anuncios.filter(function (x) { return x.id === anuncioId; })[0];
      var dias = Math.round((new Date(fim) - new Date(inicio)) / UM_DIA) + 1;
      var base = {
        id: id, numero: numero, anuncioId: anuncioId, nomeItem: a.nome, foto: a.foto,
        anuncianteId: a.donoId, locatarioId: locatarioId, precoDia: a.precoDia, politica: a.politica,
        inicio: inicio, fim: fim, dias: dias, total: dias * a.precoDia,
        mensagem: "", status: status, motivo: "", multa: 0, avaliacoes: {},
        criadoEm: momento(criadoMinutosAtras), atualizadoEm: momento(criadoMinutosAtras)
      };
      Object.keys(extras || {}).forEach(function (k) { base[k] = extras[k]; });
      return base;
    }

    var alugueis = [
      aluguel("r-4821", 4821, "an-furadeira", "u-maria", dia(10), dia(12), "aceito", 120,
        { mensagem: "Oi, Carlos! Vou instalar umas prateleiras. Posso retirar de manhã?" }),
      aluguel("r-4830", 4830, "an-escada", "u-ana", dia(20), dia(22), "pendente", 5,
        { mensagem: "Oi! Preciso da escada para pintar o quarto no fim de semana." }),
      aluguel("r-4790", 4790, "an-escada", "u-pedro", dia(-3), dia(-1), "aceito", 60 * 24 * 9),
      aluguel("r-4755", 4755, "an-escada", "u-ana", dia(-9), dia(-7), "concluido", 60 * 24 * 15,
        { avaliacoes: { anunciante: { nota: 5, texto: "Escada impecável e a Maria foi super atenciosa." } } }),
      aluguel("r-4702", 4702, "an-ps5", "u-maria", dia(-20), dia(-20), "pendente", 60 * 24 * 25),
      aluguel("r-4650", 4650, "an-camera", "u-maria", dia(-32), dia(-30), "concluido", 60 * 24 * 40,
        { avaliacoes: { anunciante: { nota: 5, texto: "Câmera ótima, a Ana explicou tudo." }, locatario: { nota: 5, texto: "Devolveu no prazo e bem cuidado." } } }),
      aluguel("r-4811", 4811, "an-camera", "u-carlos", dia(3), dia(5), "pendente", 30,
        { mensagem: "Vou fotografar um casamento no sábado. Preciso das duas baterias." }),
      aluguel("r-4777", 4777, "an-ps5", "u-ana", dia(-1), dia(1), "aceito", 60 * 24 * 4)
    ];

    function avaliacao(avaliadoId, papel, autor, nota, texto, diasAtras) {
      return { id: novoId("v"), avaliadoId: avaliadoId, papel: papel, autor: autor, nota: nota, texto: texto, criadoEm: momento(diasAtras * 24 * 60) };
    }

    var avaliacoes = [
      avaliacao("u-maria", "anunciante", "Ana Oliveira", 5, "Escada impecável e a Maria foi super atenciosa.", 6),
      avaliacao("u-maria", "anunciante", "Carlos Mendes", 5, "Foi simples combinar a retirada e a devolução.", 30),
      avaliacao("u-maria", "anunciante", "Bruno Lima", 4, "A escada estava limpa e funcionando. Só atrasou um pouco na entrega.", 45),
      avaliacao("u-maria", "locatario", "Ana Oliveira", 5, "Devolveu no prazo e bem cuidado.", 28),
      avaliacao("u-maria", "locatario", "Joana Prado", 4, "Tudo certo, só pediu para estender um dia.", 60),
      avaliacao("u-carlos", "anunciante", "Maria Souza", 5, "Parafusadeira nova, com bateria cheia. Recomendo!", 20),
      avaliacao("u-carlos", "anunciante", "Paula Reis", 5, "Muito atencioso, explicou como usar a serra.", 40),
      avaliacao("u-carlos", "anunciante", "Diego Alves", 4, "Item bom, retirada rápida.", 70),
      avaliacao("u-carlos", "locatario", "Ana Oliveira", 5, "Cuidou bem do equipamento.", 15),
      avaliacao("u-ana", "anunciante", "Maria Souza", 5, "Câmera ótima, a Ana explicou tudo.", 29),
      avaliacao("u-ana", "anunciante", "Lucas Rocha", 5, "Câmera em perfeito estado.", 50),
      avaliacao("u-ana", "locatario", "Maria Souza", 5, "Ótima locatária, devolveu a escada limpa.", 6),
      avaliacao("u-pedro", "anunciante", "Rafael Dias", 4, "Console impecável e controle com bateria cheia.", 35),
      avaliacao("u-pedro", "anunciante", "Carla Nunes", 5, "PS5 funcionando perfeitamente, jogamos o fim de semana todo.", 12)
    ];

    function notificacao(usuarioId, tipo, titulo, texto, link, minutosAtras, lida) {
      return { id: novoId("n"), usuarioId: usuarioId, tipo: tipo, titulo: titulo, texto: texto, link: link, criadoEm: momento(minutosAtras), lida: !!lida };
    }
    var det = "pages/alugueis/detalhe-aluguel.html?id=";

    var notificacoes = [
      notificacao("u-maria", "solicitacao", "Nova solicitação de aluguel", "Ana quer alugar sua Escada de fibra de " + dia(20).slice(8) + "/" + dia(20).slice(5, 7) + " a " + dia(22).slice(8) + "/" + dia(22).slice(5, 7) + ". Responda em até 48 horas.", det + "r-4830", 5),
      notificacao("u-maria", "aceito", "Solicitação aceita", "Carlos aceitou seu pedido da Parafusadeira Wap. O contato dele já está liberado.", det + "r-4821", 120),
      notificacao("u-maria", "devolucao", "Confirme a devolução", "O aluguel da Escada de fibra com Pedro terminou. Confirme se o item voltou.", det + "r-4790", 360),
      notificacao("u-maria", "avaliacao", "Avaliação disponível", "Como foi alugar sua Escada para Ana? Avalie para ajudar a comunidade.", det + "r-4755", 60 * 24 * 3, true),
      notificacao("u-maria", "expirado", "Solicitação expirada", "O pedido da PlayStation 5 expirou sem resposta do anunciante.", det + "r-4702", 60 * 24 * 5, true),
      notificacao("u-carlos", "aceito", "Novo aluguel confirmado", "Você aceitou o pedido de Maria para a Parafusadeira Wap.", det + "r-4821", 120),
      notificacao("u-carlos", "lembrete", "Lembrete de retirada", "A retirada da Parafusadeira Wap está marcada. Combine o horário com Maria.", det + "r-4821", 60 * 24, true),
      notificacao("u-ana", "solicitacao", "Nova solicitação de aluguel", "Carlos quer alugar sua Câmera Sony A7 III. Responda em até 48 horas.", det + "r-4811", 30),
      notificacao("u-ana", "andamento", "Aluguel em andamento", "Você está com o PlayStation 5 de Pedro até amanhã.", det + "r-4777", 60 * 24),
      notificacao("u-pedro", "andamento", "Item com Ana", "Seu PlayStation 5 está com Ana até amanhã.", det + "r-4777", 60 * 24)
    ];

    return { usuarios: usuarios, anuncios: anuncios, alugueis: alugueis, avaliacoes: avaliacoes, notificacoes: notificacoes };
  }

  function semear() {
    var dados = exemplos();
    Object.keys(dados).forEach(function (nome) { gravar(nome, dados[nome]); });
    apagar("perfil");
    apagar("papel");
    gravar("versao-dados", VERSAO);
  }

  function restaurar() {
    apagar("sessao");
    semear();
  }

  // Primeira visita (ou dados de uma versão antiga do site): preenche com os exemplos
  if (ler("versao-dados", null) !== VERSAO) semear();

  AF.dados = { ler: ler, gravar: gravar, apagar: apagar, novoId: novoId, restaurar: restaurar };
})(window.AlugaFacil);
