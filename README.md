# Female Merge — Sistema Reprodutor Feminino

Jogo educativo em formato PWA (Progressive Web App), inspirado na mecânica de
jogos de mesclagem, com temática do sistema reprodutor feminino. Desenvolvido
para uso no MUDI-UEM (quiosques, tablets ou totens de exposição).

Cadeia educativa do jogo:

```
Folículo → Ovócito II → Ovário → Tuba uterina → Útero → Vagina → Feto → Bebê → Pessoa
```

## Como rodar localmente

O jogo usa Service Worker, que exige um servidor HTTP (não funciona abrindo o
`index.html` direto com duplo clique, via `file://`). Qualquer servidor
estático simples resolve. Exemplos:

```bash
# Python (já vem em quase todo sistema)
cd female-merge-pwa
python3 -m http.server 8080
# depois abra http://localhost:8080/index.html

# ou, com Node instalado:
npx serve .
```

`localhost` é tratado pelo navegador como "seguro" mesmo sem HTTPS, então
funciona normalmente em desenvolvimento.

## Como publicar (produção)

1. Suba a pasta inteira (mantendo a estrutura de arquivos) em qualquer
   hospedagem estática com **HTTPS** — GitHub Pages, Netlify, Vercel, um
   servidor da própria UEM, etc. HTTPS é obrigatório em produção para o
   Service Worker funcionar (exceto em `localhost`).
2. Abra o site pelo menos uma vez com internet — isso baixa e armazena em
   cache todos os arquivos essenciais do jogo.
3. A partir daí, o jogo funciona **totalmente offline** (ótimo para
   quiosques de exposição com internet instável). Para atualizar o jogo no
   futuro, basta subir os arquivos novos e incrementar `CACHE_VERSION` em
   `service-worker.js` — os visitantes recebem a versão nova automaticamente
   na próxima vez que abrirem o app.
4. Em tablets/celulares, o navegador deve oferecer "Adicionar à tela
   inicial" / "Instalar app" — isso instala o jogo como um aplicativo
   normal, com ícone próprio e sem barra de endereço.

## Estrutura do projeto

```
index.html              tela única com todas as "telas" do jogo (splash,
                         nome, recordes, acessibilidade, sobre, jogo) e os
                         overlays (tutorial, pausa, fim de jogo, vitória,
                         enciclopédia)
css/styles.css           todo o visual: cores, tipografia, responsividade,
                         modos de acessibilidade (alto contraste, fontes,
                         redução de animação)
js/data.js               a cadeia educativa (nomes, cores, textos, pontos) —
                         é AQUI que se edita conteúdo educativo
js/storage.js            camada única de acesso ao localStorage (nome,
                         recordes, configurações)
js/audio.js              sons sintetizados via Web Audio API (sem arquivos
                         de áudio externos)
js/accessibility.js      aplica as preferências de acessibilidade
js/render.js             desenho dos 9 ícones (formas vetoriais originais)
js/game.js               motor do jogo: física, mecânica de soltar/fundir,
                         pontuação, linha de perigo, vitória
js/app.js                camada de interface: navegação entre telas, HUD
manifest.json            manifesto do PWA (nome, ícones, cores)
service-worker.js        cache offline
icons/                   ícones do app (gerados com gen_icons.py)
gen_icons.py             script Python (Pillow) que gerou os ícones — só é
                         necessário se quiser regenerar/alterar o ícone
```

## Customização

- **Cores**: variáveis no topo de `css/styles.css` (`:root { --color-... }`).
- **Textos educativos, pontuação, tamanhos relativos dos objetos**: tudo em
  `js/data.js`, no array `LEVELS`. Não altere a ordem/sequência da cadeia
  sem atualizar `js/render.js` (cada nível aponta para uma função de
  desenho específica pelo campo `shape`).
- **Logotipo oficial do MUDI-UEM, créditos, QR code**: a tela "Sobre o jogo"
  (`#screen-about` em `index.html`) já tem um espaço reservado com esse
  aviso — edite o HTML dessa seção quando os materiais oficiais estiverem
  disponíveis. O ícone do app (`icons/`) também é um placeholder original
  (uma ilustração de célula estilizada) até que haja um logotipo oficial.
- **Dificuldade**: `SPAWN_POOL` em `js/data.js` controla quais níveis podem
  cair no início (por padrão só os 3 primeiros, com viés para o mais
  simples). `dangerLimitMs` em `js/game.js` controla quantos milissegundos
  a pilha pode ficar acima da linha de perigo antes do fim de jogo (padrão:
  2000ms, conforme especificado).

## Modo de depuração (uso interno)

Abrindo o jogo com `?debug=1` na URL (ex.: `index.html?debug=1`), fica
disponível em `window.FMDebug` uma referência ao estado interno do jogo
(`game`, `Storage`, `A11y`) — útil apenas para suporte técnico/QA
inspecionar o estado durante testes. Não aparece em lugar nenhum da
interface e não afeta jogadores comuns.

## O que foi testado

Fluxo completo (splash → nome → tutorial → jogo → fusões → pontuação →
combo → vitória → fim de jogo → recordes → jogar novamente), navegação de
pausa/configurações, todas as opções de acessibilidade, teclado (setas +
espaço), enciclopédia educativa, a condição de derrota pela linha de
perigo, e o funcionamento 100% offline após o primeiro carregamento
(testado desligando a rede e recarregando a página).

## Decisões técnicas relevantes

- **Sem dependências externas** (nenhuma biblioteca de física, nenhuma
  fonte via CDN): o motor de física é uma implementação própria e simples
  (círculos + resolução de colisão por correção de posição), e a
  tipografia usa fontes do sistema. Isso garante que o funcionamento
  offline seja 100% confiável, sem depender de terceiros no ar.
- **Sons sintetizados** via Web Audio API (osciladores), não arquivos de
  áudio — mesma razão: robustez offline e peso mínimo do pacote.
- **Ícones dos 9 estágios**: ilustrações vetoriais originais e
  estilizadas, desenhadas em `<canvas>`, sem qualquer imagem médica
  realista.
