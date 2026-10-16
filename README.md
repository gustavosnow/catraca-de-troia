# Catraca de Troia

Protótipo acadêmico de controle de entrada e saída em uma escola pública de ensino fundamental. Painel web da gestão escolar e portal responsivo dos responsáveis, preparado para evolução móvel.

**Estado: demonstração em evolução.** A API local já valida credenciais fictícias, emite sessões revogáveis e aplica perfil e vínculo no servidor. Eventos de entrada/saída, justificativas, avisos, notificações internas e solicitações de vínculo usam SQLite, idempotência ou controle de versão conforme o fluxo e auditoria das ações escolares. Coordenação/Direção também podem consultar e revogar vínculos, com bloqueio imediato no backend, revalidação posterior e visualização restrita dos metadados de auditoria. Eventos novos entram atomicamente em uma fila local durável, preparada para sincronizar com outra instância da API. Anexos novos de justificativas podem ser armazenados no SQLite com validação básica e autorização; anexos de avisos continuam apenas nominais. A origem das passagens e a entrega por canais externos ainda são simuladas. A experiência dos responsáveis também possui PWA instalável e projetos-base Capacitor; isso não equivale a identidade institucional, aplicativo publicado ou integração com hardware/serviços externos.

A raiz `/` apresenta publicamente a ideia do sistema e encaminha para o cadastro demonstrativo ou login. Os acessos diretos continuam disponíveis em `/#/responsaveis`, `/#/responsaveis/cadastro` e `/#/escola`.

## Executar

Requisito: Node.js com npm. A demonstração atual não exige chave Gemini.

```bash
npm ci
npm run dev
```

Abra `http://localhost:3000`. O comando inicia a API na porta `3001` e o Vite na porta `3000`; o proxy do Vite mantém as chamadas da interface no mesmo endereço. O portal inicia na visão dos responsáveis, e o botão de painel escolar permite explorar o outro perfil da demonstração.

As interfaces também possuem entradas demonstrativas identificáveis: `http://localhost:3000/#/responsaveis` e `http://localhost:3000/#/escola`. Eventos de entrada/saída, histórico derivado, justificativas, avisos e notificações internas são persistidos pela API local. A leitura dos avisos é individual por responsável; notificações de passagem e do fluxo de justificativas também aparecem na caixa interna do portal.

```bash
npm run lint
npm run build
npm run preview
```

## API local, autenticação e sessões

O backend persiste sessões, justificativas, eventos, avisos, notificações internas e solicitações de vínculo em `.data/catraca-de-troia.sqlite`. Responsáveis solicitam vínculo pela matrícula; somente Coordenação/Direção pode analisar, revogar vínculos ativos e consultar a trilha de auditoria. Aprovação ou revogação atualiza a autorização efetiva no backend. Os dados e as credenciais iniciais são fictícios.

```bash
npm run api:dev
npm run test:api
```

A API inicia em `http://127.0.0.1:3001`. Use os atalhos da tela de entrada ou uma das contas abaixo; a senha comum da demonstração é `Troia@2026`.

- Responsável: `claudia.mendes@gmail.com` ou `(11) 98765-4321`.
- Responsável sem vínculo, para testar a solicitação: `sem.vinculo@gmail.com`.
- Portaria: `carlos.mendes@emef.educacao.sp.gov.br` ou `MAT-2026/0481`.
- Coordenação: `mariana.costa@emef.educacao.sp.gov.br` ou `MAT-2026/0129`.

As senhas são derivadas com scrypt e salt; a API armazena somente o hash dos tokens opacos. Sessões expiram em 12 horas ou 30 dias quando “lembrar dispositivo” está ativo, podem ser restauradas e são revogadas no logout. A API aplica cabeçalhos básicos de segurança, impede cache das respostas e limita em memória tentativas repetidas de login e solicitações de vínculo. Este é um corte funcional local: ainda faltam provedor institucional, HTTPS, proteção/armazenamento nativo dos tokens, política de senha, MFA, recuperação real, limitação distribuída/persistente e testes formais de segurança.

O React já consome essas rotas. Contas de Coordenação (`staff-2`) e Direção (`staff-3`) podem analisar justificativas e baixar seus anexos; o operador de portaria (`staff-1`) pode consultar a fila, mas análise e download permanecem bloqueados na interface e no servidor. Anexos novos aceitam PDF/JPG/PNG de até 2 MB, conferem a assinatura do formato, registram SHA-256 e ficam no SQLite. Essa validação não substitui antivírus; use somente arquivos fictícios.

Os eventos persistidos registram estudante, entrada/saída, instante, catraca, método, ator escolar e estados demonstrativos de notificação. Responsáveis consultam somente estudantes com vínculo aprovado; apenas perfis escolares registram passagens. O botão de simulação e a simulação automática — desativada por padrão — alimentam esse fluxo sem representar hardware ou reconhecimento facial real. Liberações manuais de estudantes também persistem o motivo; visitantes e emergências sem estudante continuam apenas visuais.

## Fila local e sincronização de eventos

Cada evento novo e seu item de saída são gravados na mesma transação SQLite. O trabalhador opcional envia itens pendentes em segundo plano, usa retentativa exponencial limitada a cinco minutos, recupera itens cujo lease expirou e marca divergências como conflito em vez de sobrescrever dados. O receptor remoto deduplica por `sourceNodeId + sourceEventId`; repetir o mesmo conteúdo é seguro, enquanto reutilizar o identificador com conteúdo diferente retorna `SYNC_CONFLICT`.

Configure no servidor escolar:

```bash
SYNC_NODE_ID=escola-piloto-01
SYNC_REMOTE_URL=https://api.exemplo.institucional
SYNC_SHARED_SECRET=trocar-por-segredo-gerenciado
npm run api:start
```

Uma instância receptora precisa de `SYNC_SHARED_SECRET`, mesmo quando não possui `SYNC_REMOTE_URL`. O painel escolar apresenta pendências, processamento, sincronizados, conflitos e última sincronização; somente Coordenação/Direção recebe a ação para reenfileirar conflitos. As mesmas operações estão disponíveis em `GET /api/v1/access-events/sync/status` e `POST /api/v1/access-events/sync/retry-conflicts`. A fila e os testes demonstram a semântica de continuidade, e há backup/restauração local testado em arquivo separado; ainda não há implantação em dois servidores, HTTPS, cofre de segredos, monitoramento, cópia externa ou ensaio operacional de desconexão/restauração na escola.

## Backup local do SQLite

Com a API parada ou ativa, o mecanismo nativo de backup do SQLite cria uma cópia consistente e executa `integrity_check` antes de concluir:

```bash
npm run db:backup
```

Por padrão, a origem é `.data/catraca-de-troia.sqlite` e o destino é `.data/backups/`. `DATABASE_PATH` e `BACKUP_DIRECTORY` permitem caminhos alternativos. A rotina de restauração usada nos testes copia para um arquivo novo e recusa sobrescrita; a troca da base ativa continua sendo uma decisão operacional manual. Backups podem conter os mesmos dados sensíveis do banco e não devem ser versionados ou compartilhados. Uploads não vinculados são removidos após 24 horas pelo processo da API, com registro de auditoria.

## PWA e projetos móveis

A entrada instalável abre em `/#/responsaveis`, possui manifesto e cache apenas do shell estático. Chamadas `/api`, envios e dados pessoais não são armazenados pelo service worker. Durante uma queda de conexão com o portal já aberto, a interface identifica o estado offline e mantém somente em memória os últimos dados carregados naquela sessão; exibe a última atualização, bloqueia escritas e refaz as consultas ao reconectar. Em navegadores compatíveis, use o convite **Instalar**; no Safari iOS, use **Compartilhar → Adicionar à Tela de Início**.

```bash
npm run build:parent
npm run preview
npm run cap:sync
npm run cap:sync:android:demo
npm run android:debug
npm run android:debug:device
```

Para conferir a versão instalável local, mantenha a API ativa e abra `http://localhost:4173/#/responsaveis` após `npm run preview`. O servidor de desenvolvimento prioriza HMR; o manifesto e o service worker validados são os arquivos do build de produção.

Os projetos nativos ficam em `android/` e `ios/`. O build móvel oculta os controles web de demonstração e a troca para o painel escolar, ocupa a tela do aparelho, respeita as áreas seguras e desativa o service worker dentro do Capacitor. Para consumir uma API fora do navegador local, configure `VITE_API_BASE_URL` com uma URL HTTPS alcançável pelo aparelho antes de `npm run cap:sync`; `localhost` no celular não é este computador.

`cap:sync:android:demo` prepara exclusivamente um teste no emulador Android: usa `http://10.0.2.2:3001`, origem `http://localhost` e tráfego HTTP apenas no manifesto `debug`. A API aceita somente as origens Capacitor explicitadas em `CORS_ORIGINS`. Para aparelho físico, use uma URL HTTPS; expor `API_HOST=0.0.0.0` em rede local é uma alternativa somente de laboratório, exige firewall/rede confiável e uma URL alcançável configurada no build.

`android:debug` usa o JDK e Android SDK locais em `.tools/`, sincroniza o conteúdo e grava o resultado em `.artifacts/catraca-de-troia-responsaveis-debug.apk`. Essas pastas permanecem ignoradas pelo Git. O APK demonstrativo atual tem aproximadamente 7,3 MB, `minSdk 24`, `targetSdk 36` e assinatura automática de depuração; não é assinado para distribuição. Com um emulador ativo, ele pode ser instalado por:

```bash
.tools/android-sdk/platform-tools/adb install -r .artifacts/catraca-de-troia-responsaveis-debug.apk
```

Para testar em celular físico na mesma rede Wi-Fi, gere uma variante com o IP local incorporado e inicie a API na rede:

```bash
npm run android:debug:device
npm run dev:device
```

O artefato fica em `.artifacts/catraca-de-troia-responsaveis-device-debug.apk`. Durante `dev:device`, copie-o para `public/` — ignorado pelo Git — ou transfira-o por USB. O IP pode mudar ao reconectar o computador à rede; nesse caso, gere novamente o APK. Não use esse modo HTTP fora de uma rede de laboratório confiável.

Quando o APK com esse nome está em `public/`, o servidor Vite o entrega com `application/vnd.android.package-archive` e `Content-Disposition: attachment`, evitando que navegadores móveis o interpretem como ZIP/pasta.

O identificador `com.gustavosnow.catracatroia` é provisório e deve ser confirmado com o domínio institucional antes de assinatura ou publicação. Foi gerado um APK Android de depuração, mas ainda faltam teste em emulador/aparelho, assinatura de distribuição, push nativo e qualquer publicação. iOS continua exigindo macOS e Xcode.

## Documentação

- [Escopo, critérios de aceite e fontes oficiais](docs/PROJETO_CATRACA_DE_TROIA.md)
- [Rastreabilidade da EAP, estado atual e próximos passos](docs/ALINHAMENTO_E_RASTREABILIDADE.md)
- [Controle de mudanças](docs/CONTROLE_DE_MUDANCAS.md)
- [Apresentação do app sem APK](docs/APRESENTACAO_SEM_APK.md)
- [Roteiro de aceite acadêmico dos portais](docs/ROTEIRO_ACEITE_ACADEMICO.md)
- [Instruções de desenvolvimento](AGENTS.md)
- [Política de contribuição e commits](CONTRIBUTING.md)

Linha de base: uma escola, duas catracas, processamento facial local, 24 semanas e orçamento global acadêmico de R$ 291.000. Critérios quantitativos são metas de homologação, não resultados deste frontend.

## Estrutura e evolução

`src/components/ParentApp/` contém a experiência dos responsáveis. Os demais componentes compõem o painel escolar e as interfaces compartilhadas. `src/services/accessEventsApi.ts` integra o fluxo persistente, e `demoAccessService.ts` deriva linha do tempo e histórico desses registros. `src/data/mockData.ts` ainda reúne dados visuais fictícios; `projectBaseline.ts` centraliza metas e links das fontes.

O corte atual entrega uma PWA instalável e estruturas Capacitor para Android/iOS, reaproveitando o mesmo React/TypeScript. Autenticação/sessão local separada por perfil, administração auditada das contas fictícias, justificativas e seus anexos locais, eventos, histórico derivado, avisos, notificações internas, vínculos, fila de saída dos eventos e fila `PUSH_DEMO` já usam serviços comuns. Identidade institucional, canal externo real, antivírus/retenção institucional, anexos de avisos, infraestrutura remota e validação ponta a ponta da sincronização ainda precisam de implementação real. Veja [o diagnóstico para o app dos responsáveis](docs/PROXIMOS_PASSOS_APP_RESPONSAVEIS.md).

Origem: [protótipo no Google AI Studio](https://ai.studio/apps/b85c5f96-392f-43b3-8272-31d8c99a8592). O primeiro commit de importação preserva essa versão; o seguinte registra o alinhamento documental.

## Limites

Não utilizar a demonstração com dados reais de estudantes. A sessão local não substitui integração institucional, governança biométrica, HTTPS, armazenamento seguro em aparelho ou testes de segurança. Consulte a matriz de rastreabilidade para distinguir funcionalidades demonstrativas de entregas pendentes.
