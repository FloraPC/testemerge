/**
 * data.js
 * -----------------------------------------------------------------------
 * Definição estática da cadeia educativa do jogo (as 9 estruturas) e das
 * regras de pontuação. Nenhum outro módulo deve alterar esta sequência —
 * ela é a espinha dorsal do conteúdo educativo do MUDI-UEM.
 *
 * radiusRatio  -> raio do objeto como fração da largura útil da área de
 *                 jogo (assim o jogo escala perfeitamente em qualquer tela).
 * points       -> pontos ganhos quando DOIS objetos deste nível se fundem
 *                 e geram o próximo da cadeia.
 * shape        -> identifica qual função de desenho (em render.js) deve
 *                 ser usada para ilustrar o objeto.
 * -----------------------------------------------------------------------
 */

const LEVELS = [
  {
    id: 0,
    name: 'Folículo',
    shape: 'folliculo',
    radiusRatio: 0.052,
    color: '#FFE3EC',
    colorDark: '#FFB6CE',
    points: 10,
    description: 'O folículo ovariano é uma pequena estrutura que abriga e protege o óvulo em desenvolvimento dentro do ovário.',
    curiosity: 'Uma pessoa já nasce com todos os seus folículos: cerca de 1 a 2 milhões, número que diminui ao longo da vida.'
  },
  {
    id: 1,
    name: 'Ovócito II',
    shape: 'oocyte',
    radiusRatio: 0.066,
    color: '#FFC9DC',
    colorDark: '#FF9BBF',
    points: 25,
    description: 'O ovócito secundário (Ovócito II) é a célula liberada pelo ovário na ovulação, capaz de ser fecundada.',
    curiosity: 'O ovócito só conclui sua divisão celular se for fecundado por um espermatozoide.'
  },
  {
    id: 2,
    name: 'Ovário',
    shape: 'ovary',
    radiusRatio: 0.082,
    color: '#FFA8C6',
    colorDark: '#FB7DAE',
    points: 50,
    description: 'Os ovários são os órgãos responsáveis por produzir os ovócitos e os hormônios sexuais femininos.',
    curiosity: 'Uma pessoa com sistema reprodutor feminino típico possui dois ovários, um de cada lado do útero.'
  },
  {
    id: 3,
    name: 'Tuba uterina',
    shape: 'tube',
    radiusRatio: 0.100,
    color: '#FF8FB3',
    colorDark: '#F6689A',
    points: 100,
    description: 'As tubas uterinas conectam os ovários ao útero e são o local onde normalmente ocorre a fecundação.',
    curiosity: 'As extremidades da tuba uterina têm franjas (fímbrias) que ajudam a capturar o ovócito liberado.'
  },
  {
    id: 4,
    name: 'Útero',
    shape: 'uterus',
    radiusRatio: 0.120,
    color: '#F76D9C',
    colorDark: '#E85589',
    points: 200,
    description: 'O útero é o órgão muscular onde o embrião se implanta e se desenvolve durante a gestação.',
    curiosity: 'A parede interna do útero, o endométrio, se renova ciclicamente ao longo do ciclo menstrual.'
  },
  {
    id: 5,
    name: 'Vagina',
    shape: 'vagina',
    radiusRatio: 0.140,
    color: '#EF5586',
    colorDark: '#D8447A',
    points: 400,
    description: 'A vagina é o canal muscular que liga o colo do útero à parte externa do corpo.',
    curiosity: 'É um órgão elástico, capaz de se adaptar durante o parto e retornar ao seu estado normal depois.'
  },
  {
    id: 6,
    name: 'Feto',
    shape: 'fetus',
    radiusRatio: 0.162,
    color: '#E14577',
    colorDark: '#C93868',
    points: 800,
    description: 'Feto é o nome dado ao ser humano em desenvolvimento a partir da 9ª semana de gestação.',
    curiosity: 'A partir dessa fase, todos os órgãos principais já estão formados e continuam amadurecendo.'
  },
  {
    id: 7,
    name: 'Bebê',
    shape: 'baby',
    radiusRatio: 0.186,
    color: '#C93868',
    colorDark: '#AC2C58',
    points: 1600,
    description: 'Após cerca de 40 semanas de gestação, o bebê nasce e inicia sua vida fora do útero.',
    curiosity: 'O cérebro do bebê recém-nascido já tem quase todos os neurônios que terá na vida adulta.'
  },
  {
    id: 8,
    name: 'Pessoa',
    shape: 'person',
    radiusRatio: 0.210,
    color: '#AC2C58',
    colorDark: '#7A1734',
    points: 0, // nível máximo — não gera pontos de fusão adicional
    description: 'Ao longo da infância e da adolescência, o bebê se desenvolve e se torna uma pessoa adulta.',
    curiosity: 'Você concluiu toda a cadeia! Esse ciclo representa, de forma simplificada, o início da vida humana.'
  }
];

// Níveis a partir dos quais um novo objeto pode "cair" no início do jogo.
// Mantém o jogo jogável: só as estruturas iniciais (menores) aparecem
// como próximo objeto, exatamente como em jogos de merge tradicionais.
const SPAWN_POOL = [0, 0, 0, 1, 1, 2];

// Índice do nível considerado a "vitória" (Pessoa).
const MAX_LEVEL_INDEX = LEVELS.length - 1;

// Textos curtos do tutorial (tela "Como Jogar").
const TUTORIAL_STEPS = [
  'Escolha onde deseja soltar o objeto, movendo o dedo ou o mouse.',
  'Quando dois objetos iguais se encontrarem, eles se combinam e formam a próxima estrutura da cadeia.',
  'Use as combinações para evoluir até o nível máximo: Pessoa.',
  'Cuidado! Se os objetos ultrapassarem a linha vermelha por muito tempo, o jogo termina.'
];
