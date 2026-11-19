# Catraca de Troia

Protótipo acadêmico de controle de entrada e saída para uma escola pública de ensino fundamental. Reúne o **painel web da gestão escolar** e o **portal responsivo dos responsáveis**, que compartilham a mesma API e as mesmas regras.

> [!IMPORTANT]
> **Estado: protótipo acadêmico funcional local.** Os dados vêm da carga da escola (`npm run db:demo`, MC-039 e MC-040), e as passagens são registradas pelo protótipo facial ou por passagem assistida. O reconhecimento facial é um protótipo de laboratório sem homologação, e nenhuma catraca física é acionada. Os canais externos de notificação não estão integrados. Os estudantes da carga são registros de teste: **não use a demonstração com dados de crianças reais.**

## Sumário

- [Visão geral](#visão-geral)
- [Início rápido](#início-rápido)
- [Comandos](#comandos)
- [Estrutura do repositório](#estrutura-do-repositório)
- [API local, autenticação e sessões](#api-local-autenticação-e-sessões)
- [Fila local e sincronização de eventos](#fila-local-e-sincronização-de-eventos)
- [Backup local do SQLite](#backup-local-do-sqlite)
- [Protótipo de reconhecimento facial](#protótipo-de-reconhecimento-facial)
- [PWA e projetos móveis](#pwa-e-projetos-móveis)
- [Documentação](#documentação)
- [Contribuição](#contribuição)
- [Limites](#limites)

## Visão geral

### Perfis

| Perfil | O que faz na demonstração |
|---|---|
| **Responsável** | Solicita vínculo pela matrícula, acompanha entradas e saídas dos estudantes com vínculo aprovado, lê avisos, envia justificativas textuais e recebe notificações internas. |
| **Portaria** | Registra passagem assistida (entrada ou saída), consulta estudantes, registros e a fila de justificativas e comanda as catracas do protótipo facial. Não acessa administração nem biometria. |
| **Coordenação/Direção** | Analisa justificativas e vínculos, revoga vínculos ativos, publica avisos, administra contas, consulta a auditoria e reenfileira conflitos de sincronização. |

### O que existe e o que falta

| Situação | Itens |
|---|---|
| **Funcional local** | API Express/SQLite com os dados cadastrados da escola; autenticação, cadastro de responsável e RBAC conferido rota a rota por teste; vínculos autorizados no backend; eventos de entrada/saída com sequência obrigatória no dia; avisos; justificativas textuais; notificações internas; auditoria; fila local com sincronização; backup do SQLite; PWA; projetos-base Android/iOS via Capacitor. |
| **Simulado ou de laboratório** | Reconhecimento facial em Python/OpenCV (`edge/`, MC-036 a MC-039), restrito ao rosto de adultos voluntários da equipe, com consentimento, nunca de crianças; entrega externa de notificações. |
| **Pendente** | Catraca física; homologação do reconhecimento facial; canais externos (push, e-mail, WhatsApp); provedor institucional de identidade, HTTPS e MFA; APK assinado para distribuição e publicação em lojas. |

O aplicativo Android (APK) continua sendo um objetivo. Para a apresentação, o portal abre no navegador por link ou QR Code, sem instalação.

### Escopo do piloto

Conferido em 04/11/2026 (EAP v1.3): uma escola e duas catracas, com justificativas exclusivamente textuais, sem atestados nem outros anexos. As telas do piloto não têm ficha de saúde, carteirinha digital, RFID nem gestão de acesso de visitantes e funcionários. As rotas de arquivos foram desativadas, e novas referências a anexos são rejeitadas. Esta revisão não apaga dados legados de bancos existentes.

Linha de base: uma escola, duas catracas, processamento facial local, 24 semanas e orçamento global acadêmico de R$ 291.000. Os critérios quantitativos são metas de homologação, não resultados deste protótipo.

## Início rápido

Requisito: Node.js com npm. A demonstração atual não exige chave Gemini.

```bash
npm ci
SEED_PASSWORD='senha-combinada' npm run db:demo   # só na primeira vez: ativa os dados
npm run dev
```

> [!IMPORTANT]
> **Ative os dados antes de usar.** O banco (`.data/`) não vai para o Git: ele guarda hashes de senhas e
> sessões e mudaria a cada uso. Sem o `db:demo`, o sistema abre vazio, nenhum login funciona e a API avisa
> isso no terminal. O comando roda uma vez por computador e cria a escola, as contas, as duas câmeras da
> catraca 01 e as duas últimas semanas letivas de movimento. A senha de todas as contas é a que você passar
> em `SEED_PASSWORD`; combine-a com a equipe fora do repositório. As datas do movimento partem do dia em que
> o comando roda. Para recomeçar: `npm run db:seed -- --reset` (faz backup em `.data/backups/`) e depois
> `npm run db:seed:atividade`, ambos com `SEED_PASSWORD`. O `db:demo` recusa um banco que já tenha dados.

O comando `npm run dev` inicia a API na porta `3001` e o Vite na porta `3000`. O proxy do Vite mantém as chamadas da interface no mesmo endereço. Abra:

| Endereço | Conteúdo |
|---|---|
| `http://localhost:3000/` | Apresentação pública. Encaminha para o cadastro de responsável ou para o login, mesmo com sessão anterior. Também abre em `/#/apresentacao`. |
| `http://localhost:3000/#/responsaveis` | Portal dos responsáveis (cadastro em `/#/responsaveis/cadastro`). |
| `http://localhost:3000/#/escola` | Painel escolar. |

Se a porta `3001` estiver ocupada, use `API_PORT=3101 npm run dev`. O proxy do Vite acompanha a porta escolhida. Reinicie o comando depois de alterar `API_PORT`.

### Contas

Criadas pelo `db:demo` (dados em `server/maintenance/schoolData.ts`), com a senha informada em `SEED_PASSWORD`.

| Perfil | Login | Acesso |
|---|---|---|
| Coordenação | `gustavo.coelho@catracadetroia.edu.br` ou `MAT-2026/0101` | Painel completo, inclusive vínculos, contas, auditoria e cadastro facial |
| Portaria | `hanrry.junior@catracadetroia.edu.br` ou `MAT-2026/0102` | Registros, estudantes, passagem assistida e câmeras |
| Responsável | `saylon.batista@catracadetroia.edu.br` | Portal com Lívia, Davi e Helena Batista |
| Responsáveis | `fernanda.ribeiro@`, `marcos.almeida@`, `patricia.nunes@`, `roberto.teixeira@`, `juliana.moraes@catracadetroia.edu.br` | Portal com os próprios filhos |
| Cadastro pendente | `ana.almeida@catracadetroia.edu.br` | Nada, até a Coordenação aprovar o vínculo com Miguel Almeida |

Os 10 estudantes têm matrículas `2026-0001` a `2026-0010`. Novos responsáveis se cadastram pelo portal: a conta e o pedido de vínculo são criados juntos, e nenhum dado aparece antes da aprovação. Contas da equipe e redefinição de senha ficam com a escola.

### Apresentar pelo celular

No painel escolar, use **Ferramentas → Portal por QR Code**. Mesmo com o painel aberto em `localhost`, a central consulta a API local, dá prioridade à interface Wi-Fi e gera o QR Code para `/#/responsaveis`. Também é possível informar outro endereço HTTPS ou da rede. A central nunca codifica loopback, credenciais nem parâmetros de sessão. Veja o [roteiro sem APK](docs/APRESENTACAO_SEM_APK.md).

## Comandos

| Comando | Para quê |
|---|---|
| `npm run dev` | API (com comando das câmeras habilitado) e Vite em modo de desenvolvimento. |
| `npm run dev:device` | API exposta na rede local e Vite, para testes em celular. |
| `npm run presentation:start` | Build de produção, API na rede e `vite preview` para a apresentação. |
| `npm run lint` | Checagem de tipos com `tsc --noEmit`. |
| `npm run build` | Build de produção do painel e do portal. |
| `npm run build:parent` | Build somente do portal dos responsáveis (PWA e Capacitor). |
| `npm run preview` | Serve o build de produção. |
| `npm run test:api` | Testes da API. |
| `npm run test:visual` | Aceite visual em 360, 440, 768 e 1440 px com Firefox headless. Capturas e resultado em `.artifacts/visual-acceptance/`, fora do Git. |
| `npm run test:pwa` | Verifica o build da PWA. Execute depois do build. |
| `npm run api:dev` / `api:start` | Somente a API, com ou sem recarga automática. |
| `npm run db:demo` | Ativa os dados num banco vazio: carga da escola e duas semanas de movimento (exige `SEED_PASSWORD`). |
| `npm run db:seed` | Carga da escola. Com `-- --reset`, faz backup, recria o banco e preserva as câmeras. |
| `npm run db:seed:atividade` | Duas semanas letivas de movimento, geradas pelos serviços da API. |
| `npm run db:backup` | Backup consistente do SQLite. |
| `npm run device:register` | Cadastra uma catraca do protótipo facial e emite o token. |
| `npm run cap:sync` | Build do portal e sincronização dos projetos Capacitor. |
| `npm run android:debug` | Gera o APK de depuração (variante `:device` para celular na mesma rede). |

Antes de cada commit, rode pelo menos `npm run lint` e `npm run build`.

## Estrutura do repositório

```text
src/
  components/ParentApp/   portal dos responsáveis
  components/school/      painel escolar (visão geral, registros, ferramentas, reconhecimento facial)
  components/             telas compartilhadas (login, apresentação, avisos, justificativas, administração)
  services/               clientes da API (accessEventsApi, edgeAgentsApi, ...)
server/
  modules/                módulos da API (eventos, catracas, contas, vínculos, avisos, justificativas, auditoria, ...)
  maintenance/            backup, carga da escola e do movimento, cadastro de catracas
  test/                   testes da API (fixtures de teste em test/fixtures/)
shared/contracts/         tipos compartilhados entre front e API
edge/                     agente de reconhecimento facial (Python/OpenCV)
android/, ios/            projetos Capacitor
scripts/                  aceite visual, verificação da PWA e build do APK
docs/                     escopo, rastreabilidade, mudanças e roteiros
```

`src/services/accessEventsApi.ts` integra o fluxo persistente, e `accessHistory.ts` deriva a linha do tempo e o histórico a partir desses registros. Não há dados fictícios no código do sistema: eles existem só nas fixtures dos testes. A tela **Sobre o projeto** traz apenas um resumo da demonstração e o link para a pasta oficial no Drive. Orçamento, prazo, metas e riscos não são copiados para o código.

## API local, autenticação e sessões

A API inicia em `http://127.0.0.1:3001` e persiste sessões, justificativas, eventos, avisos, notificações internas e solicitações de vínculo em `.data/catraca-de-troia.sqlite`.

- **Vínculos:** os responsáveis solicitam vínculo pela matrícula. Somente Coordenação/Direção analisa, revoga vínculos ativos e consulta a trilha de auditoria. A aprovação ou a revogação atualiza a autorização efetiva no backend, e o responsável consulta somente os estudantes com vínculo aprovado.
- **Justificativas:** Coordenação/Direção analisa as justificativas textuais, e a Portaria apenas consulta a fila. Não há upload nem download de arquivos no piloto.
- **Eventos:** cada evento registra estudante, entrada/saída, instante, catraca, origem e ator escolar. Há duas origens: **Protótipo facial** (câmera autenticada por token do dispositivo) e **Passagem assistida** (equipe, com catraca cadastrada e motivo obrigatório). Cada estudante segue a sequência do dia: a primeira passagem é entrada e depois alterna, na câmera e na passagem assistida. A rota manual não aceita passagem facial nem define status de entrega.
- **Perfis:** `server/test/rbac.test.ts` confere todas as rotas de leitura para seis perfis e as escritas restritas.
- **Notificações:** a leitura dos avisos é individual por responsável. As notificações de passagem e do fluxo de justificativas aparecem na caixa interna do portal.
- **Segurança:** as senhas são derivadas com scrypt e salt, e a API guarda somente o hash dos tokens opacos. As sessões expiram em 12 horas, ou em 30 dias com "lembrar dispositivo", podem ser restauradas e são revogadas no logout. A API aplica cabeçalhos básicos de segurança, impede cache das respostas e limita em memória as tentativas repetidas de login e de solicitação de vínculo.

> [!NOTE]
> Este é um corte funcional local. Ainda faltam provedor institucional, HTTPS, proteção e armazenamento nativo dos tokens, política de senha, MFA, redefinição de senha pela Coordenação no painel, limitação distribuída ou persistente e testes formais de segurança.

## Fila local e sincronização de eventos

Cada evento novo e seu item de saída são gravados na mesma transação SQLite. O trabalhador opcional envia os itens pendentes em segundo plano, com retentativa exponencial limitada a cinco minutos. Ele recupera itens com lease expirado e marca divergências como conflito em vez de sobrescrever dados. O receptor remoto deduplica por `sourceNodeId + sourceEventId`: repetir o mesmo conteúdo é seguro, e reutilizar o identificador com conteúdo diferente retorna `SYNC_CONFLICT`.

Configuração no servidor escolar:

```bash
SYNC_NODE_ID=escola-piloto-01
SYNC_REMOTE_URL=https://api.exemplo.institucional
SYNC_SHARED_SECRET=trocar-por-segredo-gerenciado
npm run api:start
```

Uma instância receptora precisa de `SYNC_SHARED_SECRET`, mesmo sem `SYNC_REMOTE_URL`. O painel escolar mostra pendências, processamento, sincronizados, conflitos e a última sincronização. Somente Coordenação/Direção recebe a ação de reenfileirar conflitos. As mesmas operações estão em `GET /api/v1/access-events/sync/status` e `POST /api/v1/access-events/sync/retry-conflicts`.

A fila e os testes demonstram a semântica de continuidade, e o backup e a restauração locais foram testados em arquivo separado. Ainda não há implantação em dois servidores, HTTPS, cofre de segredos, monitoramento, cópia externa nem ensaio operacional de desconexão e restauração na escola.

## Backup local do SQLite

Com a API parada ou ativa, o mecanismo nativo de backup do SQLite cria uma cópia consistente e executa `integrity_check` antes de concluir:

```bash
npm run db:backup
```

Por padrão, a origem é `.data/catraca-de-troia.sqlite` e o destino é `.data/backups/`. `DATABASE_PATH` e `BACKUP_DIRECTORY` aceitam caminhos alternativos. A rotina de restauração usada nos testes copia para um arquivo novo e recusa sobrescrita. A troca da base ativa continua sendo uma decisão operacional manual. Os backups podem conter os mesmos dados sensíveis do banco e não devem ser versionados nem compartilhados. A rotina de limpeza de arquivos legados permanece interna, e novos anexos não são aceitos.

## Protótipo de reconhecimento facial

Protótipo de laboratório (MC-036 a MC-039): a câmera, que pode ser uma webcam ou um celular, identifica o rosto com Python/OpenCV no computador da escola, e a API local decide se libera ou nega a passagem. **Não há homologação, nenhuma catraca física é acionada e não há prova de vida.**

- Cadastre só o rosto de **adultos voluntários da equipe, com consentimento**, representando estudantes no teste. **Nunca o rosto de uma criança.**
- Nenhuma foto é salva. Ficam somente vetores em `edge/data/`, fora do Git. As negações não guardam imagem, vetor nem identidade.
- Com `npm run dev`, as catracas e o cadastro facial são comandados em **Ferramentas** no painel escolar. Nos modos de apresentação (`api:device`, `presentation:start`), esse comando fica desligado.
- As passagens liberadas aparecem no painel e no portal do responsável. No painel, os registros têm a origem **Protótipo facial**, distinta das passagens assistidas.
- A câmera não grava duas entradas (ou duas saídas) seguidas do mesmo estudante: fora da sequência, a janela mostra **JA REGISTRADO** e nada é gravado.
- O `db:demo` cadastra as câmeras de entrada e saída sem fonte de vídeo; defina-a em **Ferramentas**.

Preparação do ambiente Python, uso do celular como câmera e comandos: [`edge/README.md`](edge/README.md). Integração com as telas: [`docs/INTEGRACAO_FRONT_CAMERAS.md`](docs/INTEGRACAO_FRONT_CAMERAS.md).

## PWA e projetos móveis

### PWA

A entrada instalável abre em `/#/responsaveis`, tem manifesto e guarda em cache apenas o shell estático. O service worker não armazena chamadas `/api`, envios nem dados pessoais. Se a conexão cair com o portal aberto, a interface indica o estado offline e mantém somente em memória os últimos dados carregados na sessão. Ela exibe a última atualização, bloqueia escritas e refaz as consultas ao reconectar. Em navegadores compatíveis, use o convite **Instalar**. No Safari iOS, use **Compartilhar → Adicionar à Tela de Início**.

Para conferir a versão instalável local, mantenha a API ativa, rode `npm run build:parent` e `npm run preview` e abra `http://localhost:4173/#/responsaveis`. O servidor de desenvolvimento prioriza o HMR. O manifesto e o service worker validados são os do build de produção.

### Capacitor (Android/iOS)

Os projetos nativos ficam em `android/` e `ios/`. O build móvel oculta os controles web de demonstração e a troca para o painel escolar, ocupa a tela do aparelho, respeita as áreas seguras e desativa o service worker. Para consumir uma API fora do navegador local, configure `VITE_API_BASE_URL` com uma URL HTTPS alcançável pelo aparelho antes de `npm run cap:sync`. No celular, `localhost` não é este computador.

```bash
npm run cap:sync
npm run cap:sync:android:demo
npm run android:debug
npm run android:debug:device
```

- **Emulador:** `cap:sync:android:demo` usa `http://10.0.2.2:3001`, origem `http://localhost` e tráfego HTTP apenas no manifesto `debug`. A API aceita somente as origens Capacitor listadas em `CORS_ORIGINS`.
- **APK de depuração:** `android:debug` usa o JDK e o Android SDK locais em `.tools/` e grava `.artifacts/catraca-de-troia-responsaveis-debug.apk` (cerca de 7,3 MB, `minSdk 24`, `targetSdk 36`, assinatura automática de depuração, **não assinado para distribuição**). Com um emulador ativo:

  ```bash
  .tools/android-sdk/platform-tools/adb install -r .artifacts/catraca-de-troia-responsaveis-debug.apk
  ```

- **Celular físico na mesma rede Wi-Fi:** `npm run android:debug:device` incorpora o IP local, e `npm run dev:device` expõe a API na rede. O artefato fica em `.artifacts/catraca-de-troia-responsaveis-device-debug.apk`. Copie-o para `public/` (ignorado pelo Git), e o Vite o entregará como download do Android, ou transfira-o por USB. Gere o APK novamente se o IP mudar. Use esse modo HTTP somente em uma rede de laboratório confiável. Fora dela, use uma URL HTTPS.

O identificador `com.gustavosnow.catracatroia` é provisório e deve ser confirmado com o domínio institucional antes de assinatura ou publicação. Ainda faltam teste em emulador e aparelho, assinatura de distribuição, push nativo e publicação. O iOS continua exigindo macOS e Xcode.

## Documentação

- [Pasta oficial no Drive](https://drive.google.com/drive/folders/163EOyyzGW-VMIH2zs_PGTHZEVyHRfeJ9): TAP, Atividade 01, Dicionário da EAP e Plano de Riscos (fontes vigentes, acesso de leitor pelo link)
- [Escopo, critérios de aceite e fontes oficiais](docs/PROJETO_CATRACA_DE_TROIA.md)
- [Rastreabilidade da EAP, estado atual e próximos passos](docs/ALINHAMENTO_E_RASTREABILIDADE.md)
- [Controle de mudanças](docs/CONTROLE_DE_MUDANCAS.md)
- [Apresentação do app sem APK](docs/APRESENTACAO_SEM_APK.md)
- [Integração do front com as câmeras](docs/INTEGRACAO_FRONT_CAMERAS.md)
- [Roteiro de aceite acadêmico dos portais](docs/ROTEIRO_ACEITE_ACADEMICO.md)
- [Evidências do ciclo de aceite de 16/10/2026](docs/EVIDENCIAS_ACEITE_ACADEMICO_2026-10-16.md)
- [Instruções de desenvolvimento](AGENTS.md)

Origem: [protótipo no Google AI Studio](https://ai.studio/apps/b85c5f96-392f-43b3-8272-31d8c99a8592). O primeiro commit de importação preserva essa versão, e o seguinte registra o alinhamento documental.

## Contribuição

Commits no formato [Conventional Commits](https://www.conventionalcommits.org/), `main` sempre executável e validada, e documentação de rastreabilidade atualizada a cada mudança de escopo. Detalhes em [CONTRIBUTING.md](CONTRIBUTING.md).

## Limites

Não use a demonstração com dados de crianças reais. A sessão local não substitui integração institucional, governança biométrica, HTTPS, armazenamento seguro no aparelho nem testes de segurança. Consulte a [matriz de rastreabilidade](docs/ALINHAMENTO_E_RASTREABILIDADE.md) para distinguir as funcionalidades demonstrativas das entregas pendentes.
