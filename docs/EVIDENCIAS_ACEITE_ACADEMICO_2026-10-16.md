# Evidências do ciclo de aceite acadêmico — 16/10/2026

Este registro consolida verificações executadas no protótipo com dados fictícios. Não é o relatório final do projeto, não comprova homologação institucional e não inclui hardware, biometria real, canal externo ou novo APK.

## Ambiente

- Node.js 22.23.1 e npm 10.9.8;
- Firefox 158.0 em modo headless, controlado localmente por WebDriver BiDi;
- larguras visuais: 360 px, 440 px, 768 px e 1440 px;
- base SQLite acadêmica local e contas fictícias do repositório.

## Comandos e resultados

| Comando | Resultado observado |
|---|---|
| `npm run lint` | aprovado, sem erro de tipos |
| `npm run test:api` | 26 testes aprovados, nenhuma falha |
| `npm run build` | aprovado; maior chunk da aplicação com 331,85 kB, sem alerta de chunk acima de 500 kB |
| `npm run test:visual` | 26 cenários aprovados; capturas locais em `.artifacts/visual-acceptance/` |
| `npm run test:pwa` | aprovado; shell standalone e rotas `/api` fora do cache de navegação |
| `npm run db:backup` | backup SQLite criado após `integrity_check`, com 339.968 bytes |
| restauração em arquivo novo | aprovada em `/tmp/catraca-de-troia-backup-verification-20261016.sqlite` |

Backup local verificado: `.data/backups/catraca-de-troia-2026-10-16T21-39-16-407Z.sqlite`.

SHA-256: `77726e2947d3e5c4bf19c8f4137d06db6083fc181c34704d60ffd1138b471457`.

O backup e a restauração permanecem fora do Git porque contêm o estado da base, ainda que fictício.

## Cobertura visual e responsiva

O executor `scripts/run-visual-acceptance.mjs` abre um servidor Vite isolado e um perfil temporário do Firefox. Para cada largura, verifica Início, Histórico, Avisos, Carteirinha, Notificações e Justificativa. As asserções falham em caso de:

- rolagem horizontal da página ou de diálogo;
- colisão entre marca e ações do cabeçalho;
- ausência do nome `EMEF Profª. Cecília Meireles`;
- corte interno nos seletores de dependentes;
- aba sem `aria-current="page"`;
- falha ao fechar diálogos por `Escape` ou restaurar o foco ao acionador.

O navegador de aceite usa `prefers-reduced-motion: reduce`. Também foram exercitados, na mesma montagem da interface, o estado offline em 360 px e 1440 px, o bloqueio da escrita de justificativa e o retorno ao indicador de dados consultados quando a conectividade é restabelecida.

## Evidências de fila, conflitos e recuperação

Os testes automatizados comprovaram no corte local:

- persistência atômica do evento e do item `PENDING` da fila;
- indisponibilidade, backoff e sincronização posterior;
- idempotência para repetição do mesmo `sourceNodeId + sourceEventId`;
- isolamento de payload divergente como `SYNC_CONFLICT`, sem sobrescrita;
- retomada de item `PROCESSING` após expiração do lease;
- criação, integridade, restauração e recusa de sobrescrita de backup;
- autorização por papel e vínculo, revogação de sessão e auditoria.

Isso valida o comportamento implementado e os cenários simulados; não demonstra destino remoto implantado, queda física de rede, servidor escolar real ou recuperação operacional em produção.

## Situação do roteiro AC-01 a AC-24

| Faixa | Situação neste ciclo | Evidência |
|---|---|---|
| AC-01–AC-13 | cobertura automatizada aprovada | testes de autenticação, contas, vínculos, eventos, justificativas, anexos, avisos, notificações e sincronização |
| AC-14–AC-17 | comportamento visual de indisponibilidade, estado vazio e retomada aprovado; interrupção operacional real permanece manual | cenários visuais offline/online e testes das APIs |
| AC-18–AC-22 | corte do portal dos responsáveis aprovado nas quatro larguras; percurso integral de teclado dos dois portais permanece manual | asserções de layout, semântica, Escape, foco e movimento reduzido |
| AC-23 | artefato PWA aprovado estaticamente; instalação manual em navegador continua pendente | manifesto, service worker e exclusão de `/api` do cache |
| AC-24 | identificação de simulação preservada | textos do protótipo e contratos locais; nenhum hardware ou canal externo acionado |

## Pendências que exigem execução manual

- percorrer integralmente painel escolar e portal com `Tab` e `Shift+Tab` em navegador gráfico;
- interromper e restaurar a API em uma sessão observada, registrando tempos e mensagens;
- instalar a PWA em navegador compatível e conferir abertura standalone;
- repetir o aceite em aparelhos/navegadores definidos pela instituição, caso esse ambiente venha a ser aprovado.

Essas pendências não autorizam marcar o aceite acadêmico integral ou as metas da EAP como concluídos.
