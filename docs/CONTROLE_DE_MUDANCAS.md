# Controle de mudanças — atualizado em 14/10/2026

## MC-001 — Alinhamento da base técnica

Solicitação: alinhar o projeto à documentação revisada. Fontes: TAP, Atividade 01, EAP v1.2 e plano de riscos, consultados em 13/10/2026.

Ajustes: escopo de uma escola e duas catracas, metas oficiais, orçamento acadêmico, continuidade local prevista, acesso restrito por vínculo, distinção entre simulação e implementação. README, AGENTS, consolidação, telas informativas e dados demonstrativos atualizados. Versão original preservada em commit anterior.

Não representa implantação, homologação ou mudança nos documentos originais do Drive.

## MC-002 — Evolução do portal dos responsáveis para app

Direção solicitada pelo usuário: desenvolver experiência de app em paralelo ao painel escolar. Estratégia proposta: reaproveitar React/TypeScript, serviços compartilhados e avaliar PWA/Capacitor para Android/iOS.

Estado: direção de desenvolvimento registrada; embalagem, publicação em lojas, infraestrutura push, custos e critérios específicos ainda precisam de detalhamento. O portal responsivo da EAP continua como entrega de referência. Atualizações formais dos documentos acadêmicos serão necessárias se houver ampliação das obrigações do piloto.

## MC-003 — Fluxo demonstrativo compartilhado

Solicitação: iniciar os próximos passos técnicos, priorizando a unificação de eventos, histórico e justificativas entre as interfaces.

Ajustes: painel e portal passaram a compartilhar, na memória da aplicação, eventos com direção explícita de entrada/saída, notificações e justificativas. O histórico e a linha do tempo do responsável são derivados do mesmo fluxo exibido no painel; a escola ganhou uma fila demonstrativa para analisar justificativas e devolver o status ao portal. As interfaces receberam entradas por hash (`#/responsaveis` e `#/escola`) e a linha do tempo deixou de apresentar aulas e recreio fictícios como se fossem eventos integrados.

Limites: não foram implementados backend, persistência, upload real, autenticação/autorização no servidor, auditoria, sincronização entre dispositivos ou integração com hardware. Os dados são perdidos ao recarregar a página e continuam explicitamente demonstrativos.

## MC-004 — Primeiro corte local de backend e persistência

Solicitação: iniciar a evolução para backend compartilhado sem antecipar integrações de hardware, biometria ou autenticação real.

Ajustes: criada API Express isolada para justificativas, com SQLite local, contratos estáveis, vínculos fictícios validados no servidor, revisão restrita aos papéis de Coordenação e Direção, idempotência na criação, controle otimista de versão e trilha de auditoria. Testes cobrem segregação por vínculo, conta sem vínculo, persistência após reabertura do banco, repetição idempotente e permissão de revisão.

Limites: o frontend ainda não consome a API. O header `X-Demo-User-Id`, habilitado somente por `DEMO_AUTH=true`, é um mecanismo explícito de desenvolvimento e não representa autenticação ou sessão real. Anexos, eventos de catraca, sincronização offline, notificações externas, backup e criptografia do banco permanecem pendentes.

## MC-005 — Responsividade da navegação e apresentação da marca

Solicitação: manter a alternância entre painel escolar e portal dos responsáveis acessível sem rolagem e melhorar a apresentação da logo oficial.

Ajustes: os cabeçalhos foram reorganizados em grades responsivas; as quatro seções do painel ocupam uma faixa própria em telas menores, e os botões de troca de perspectiva permanecem visíveis na primeira faixa. A logo oficial em PNG continua inalterada e passou a respeitar sua proporção horizontal dentro de uma moldura adequada ao fundo do cabeçalho.

Limites: os ativos da identidade visual não foram redesenhados ou substituídos. A validação automatizada cobre compilação e build; a conferência visual deve considerar os navegadores e aparelhos definidos futuramente no plano de testes.

## MC-006 — Integração das justificativas com a API

Solicitação: avançar os serviços compartilhados antes de transformar o portal dos responsáveis em app.

Ajustes: o React passou a listar, criar e analisar justificativas pela API Express/SQLite. O frontend traduz os contratos sem duplicar regras de autorização, exibe indisponibilidade de sincronização, usa chave de idempotência na criação e envia a versão esperada na análise. O operador de portaria não recebe comandos habilitados de aprovação; Coordenação e Direção continuam validadas no servidor. A demonstração inicial foi semeada no banco local padrão.

Limites: `X-Demo-User-Id` continua sendo autenticação estritamente demonstrativa. Eventos, avisos e notificações permanecem em memória. Somente o nome do anexo é persistido; não há upload, antivírus, retenção ou armazenamento do documento.

## MC-007 — PWA e base Capacitor para responsáveis

Solicitação: evoluir o portal dos responsáveis até o ponto de app, em paralelo ao painel escolar.

Ajustes: criado manifesto PWA com entrada em `/#/responsaveis`, cache apenas do shell estático, convite de instalação e orientação para iOS. Foram adicionados projetos Capacitor 8 para Android e iOS, build dedicado que oculta o painel escolar, sincronização automatizada e configuração externa da URL da API. O service worker não é registrado dentro do contêiner nativo. Os ícones quadrados apenas centralizam a logo PNG oficial, preservada sem redesenho ou substituição.

Limites: `com.gustavosnow.catracatroia` é provisório. Não foram produzidos APK/IPA, assinatura, publicação em loja, push nativo ou homologação em dispositivo. O computador atual não possui Android SDK e, por ser Linux, não compila iOS; esses passos dependem dos ambientes oficiais e de decisões institucionais.

## MC-008 — Higiene de dependências

Durante a preparação móvel, a auditoria apontou alertas altos em Firebase/Firestore. Firebase e Google GenAI não eram importados pelo código e foram removidos como resíduos da exportação do AI Studio. A auditoria das dependências de produção passou sem vulnerabilidades conhecidas no registro consultado em 14/10/2026.

Limite: a auditoria completa ainda reporta três alertas moderados transitivos na ferramenta de desenvolvimento `@capacitor/cli`; a correção automática propõe mudança de versão e não foi aplicada sem validação de compatibilidade.

## MC-009 — Eventos e histórico na API comum

Solicitação: continuar a evolução até compartilhar entradas, saídas e histórico entre painel escolar e app dos responsáveis.

Ajustes: criada API de eventos de acesso com SQLite, contratos compartilhados, idempotência e auditoria. Somente atores escolares podem registrar eventos; responsáveis consultam exclusivamente estudantes com vínculo aprovado. O painel e o app passaram a consultar a mesma fonte com atualização periódica, e presença, linha do tempo e histórico são derivados desses registros. A simulação automática passou a iniciar desligada para evitar gravações sem ação explícita. Liberações manuais vinculadas a estudantes persistem o motivo e o operador demonstrativo.

Limites: as passagens continuam sendo simulações e não provêm de catracas ou reconhecimento facial. `X-Demo-User-Id` não é autenticação. Estados WhatsApp/push são valores fictícios; não há fila offline, sincronização entre servidor escolar e nuvem, criptografia/backup comprovados ou tratamento persistente de visitantes sem estudante.

## MC-010 — Autenticação e sessões compartilhadas

Solicitação: avançar o próximo item da sequência técnica, compartilhando autenticação e sessão entre painel escolar e app dos responsáveis.

Ajustes: removido `X-Demo-User-Id`. A API agora valida identificador e senha fictícios, deriva senhas com scrypt e salt, emite token opaco cujo hash é persistido no SQLite, aplica expiração de 12 horas ou 30 dias, restaura a sessão e revoga o token no logout. Criação e revogação entram na auditoria. O React usa `Authorization: Bearer`, bloqueia conteúdo sem sessão ou com perfil incompatível e deixa de permitir que responsáveis simulem eventos com identidade escolar. Os testes cobrem login inválido, identidade/vínculos, token não persistido em claro, expiração e revogação.

Limites: as contas e credenciais continuam fictícias e destinadas somente ao desenvolvimento. Cadastro e recuperação de senha não persistem alterações. Ainda faltam provedor institucional, HTTPS, política de senha/MFA, limitação de tentativas, gestão administrativa de contas, armazenamento seguro nativo, rotação de credenciais e testes formais de segurança. O uso de armazenamento web para “lembrar dispositivo” deve ser substituído ou validado na arquitetura definitiva.

## MC-011 — Fila local e sincronização offline de eventos

Solicitação: implementar o próximo marco de continuidade dos eventos, com idempotência, recuperação de conectividade e tratamento de conflitos, e analisar as lacunas até o aplicativo dos responsáveis.

Ajustes: cada novo evento e seu item de saída passaram a ser gravados na mesma transação SQLite. Foi criado trabalhador opcional com aquisição por lease, retentativa exponencial limitada, retomada de processamento interrompido e transporte HTTP configurável. O receptor autentica a integração por segredo configurado, deduplica pela identidade estável do nó/evento e rejeita conteúdo divergente como conflito sem sobrescrita. A API expõe contagem dos estados da fila a perfis escolares e permite que Coordenação/Direção reenfileire conflitos. Testes automatizados cobrem atomicidade, indisponibilidade/retorno, repetição, conflito e lease expirado. O diagnóstico do app foi registrado em `PROXIMOS_PASSOS_APP_RESPONSAVEIS.md`.

Limites: a implementação foi validada localmente, sem implantação de um destino remoto, rede escolar, HTTPS, cofre de segredos, monitoramento, backup/restauração ou teste com catracas. O segredo compartilhado é um corte de integração e deve evoluir conforme a arquitetura institucional. A fila preserva eventos do servidor escolar; ela não oferece por si só operação offline no celular dos responsáveis. Conflitos ficam isolados para análise e reenfileiramento autorizado, sem resolução automática destrutiva.

## MC-012 — Observabilidade da fila no painel escolar

Solicitação: continuar a evolução funcional gratuita do trabalho acadêmico, sem publicação oficial ou infraestrutura produtiva.

Ajustes: o painel escolar passou a consultar periodicamente o estado persistido da fila de eventos. A interface diferencia destino configurado de operação somente local, apresenta totais pendentes, em processamento, sincronizados e em conflito, além do instante da última sincronização. Conflitos exibem alerta sem sobrescrita e podem ser reenfileirados pela interface apenas por Coordenação ou Direção; a autorização continua aplicada no backend. Os contratos passaram a informar explicitamente se o trabalhador remoto está configurado.

Limites: a observabilidade reflete a base SQLite demonstrativa e não equivale a monitoramento de infraestrutura real. Sem `SYNC_REMOTE_URL` e `SYNC_SHARED_SECRET`, itens pendentes permanecem preservados localmente, comportamento esperado no ambiente acadêmico.

## MC-013 — Avisos e notificações internas persistentes

Solicitação: seguir com o próximo incremento gratuito rumo ao aplicativo dos responsáveis, mantendo a solução acadêmica sem infraestrutura produtiva ou publicação oficial.

Ajustes: avisos escolares passaram a usar a API Express/SQLite, com criação, edição, exclusão lógica e disparo restritos à Coordenação/Direção, controle otimista de versão, auditoria e leitura individual por responsável. Foi criada uma caixa de notificações internas persistente e segregada por vínculo aprovado. Eventos de entrada/saída, criação e análise de justificativas e avisos publicados alimentam essa caixa; o disparo de um aviso aceita chave de idempotência. Painel e portal consultam periodicamente a mesma fonte e exibem estados de carregamento e falha. Métricas fictícias de leitura e alcance foram removidas da tela de gestão.

Limites: a notificação é interna ao aplicativo demonstrativo; não há push nativo, WhatsApp, e-mail, comprovação de entrega ao aparelho ou da meta temporal da EAP. Não foi criada fila de entrega para canal externo. Anexos de avisos e justificativas continuam limitados ao nome do arquivo, sem upload, antivírus, retenção ou descarte. Os dados semeados e as contas permanecem fictícios.

## MC-014 — Estado de conectividade no portal dos responsáveis

Solicitação: continuar os próximos passos do aplicativo sem contratar infraestrutura ou serviços externos.

Ajustes: o portal passou a observar eventos de conexão do navegador, reunir o estado dos serviços de eventos, justificativas e comunicações, informar o instante da última consulta bem-sucedida e permitir atualização manual. Quando a conexão cai com a sessão aberta, os últimos dados permanecem apenas na memória da página; novas consultas são retomadas automaticamente no retorno da rede. Envio de justificativa e registros de leitura ficam bloqueados offline para não indicar uma persistência inexistente. Os dados pessoais semeados deixaram de ser usados como fallback inicial dos fluxos integrados.

Limites: `navigator.onLine` é um sinal de conectividade e não prova disponibilidade da API; falhas das requisições continuam sendo tratadas separadamente. O service worker mantém somente o shell estático, sem respostas da API. Não há login offline, persistência pessoal no aparelho, fila de escritas do responsável ou resolução de conflitos móveis. Esses recursos dependem de decisão institucional e armazenamento protegido.

## MC-015 — Solicitação e aprovação escolar de vínculos

Solicitação: seguir com os demais passos do portal, substituindo a seleção demonstrativa de dependentes por autorização efetiva da escola.

Ajustes: criada API/SQLite para solicitações de vínculo por matrícula, com idempotência, estados pendente/aprovado/rejeitado, controle otimista e auditoria. Responsáveis consultam somente as próprias solicitações; a identidade do estudante fica ocultada na resposta enquanto o vínculo não é aprovado. Apenas Coordenação/Direção lista e analisa pendências. A aprovação grava ou reativa `guardian_student_links`, passa a liberar as rotas já protegidas e gera notificação interna para o solicitante. O painel escolar recebeu a fila de análise, o portal recebeu formulário e histórico, e o cadastro deixou de expor uma lista pesquisável de estudantes.

Limites: a matrícula funciona como referência demonstrativa e não substitui conferência documental ou procedimento institucional. Ainda faltam limitação de tentativas contra enumeração, gestão de documentos comprobatórios, revogação administrativa pela interface, identidade institucional e notificações externas. Nenhum vínculo com dados reais deve ser criado neste ambiente acadêmico.

## MC-016 — Conteúdo local de anexos de justificativas

Solicitação: continuar os recursos completos que podem funcionar sem serviço pago ou infraestrutura externa.

Ajustes: o formulário de justificativa passou a enviar arquivos reais PDF/JPG/PNG de até 2 MB. A API confere tipo declarado e assinatura do formato, calcula SHA-256, armazena conteúdo e metadados no SQLite, vincula cada arquivo a uma única justificativa e audita upload/descarte. O responsável remetente e Coordenação/Direção podem baixar; outros responsáveis e Portaria são bloqueados no backend. Se a criação da justificativa falhar, o cliente tenta descartar o upload ainda não vinculado. Registros antigos que continham apenas nome permanecem identificados como legados.

Limites: a validação básica não é antivírus nem garante que o conteúdo seja seguro. Não há criptografia do banco em repouso, política institucional de retenção, limpeza periódica de uploads abandonados, backup de anexos ou armazenamento externo. O corte deve usar apenas documentos fictícios. Anexos de avisos continuam somente nominais.

## MC-017 — Endurecimento HTTP e limitação local de tentativas

Solicitação: continuar os controles gratuitos possíveis no ambiente acadêmico local.

Ajustes: a API passou a enviar `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` e `Cache-Control: no-store`. Tentativas de login são limitadas por origem e identificador em janela de 15 minutos; um login válido limpa o contador. Solicitações de vínculo são limitadas por conta em janela de uma hora. A resposta usa HTTP 429 e código estável quando o limite é atingido. Testes automatizados cobrem cabeçalhos e bloqueio.

Limites: os contadores ficam na memória do processo e são perdidos ao reiniciar; não coordenam múltiplas instâncias nem substituem proteção no provedor de identidade, proxy ou gateway. HTTPS, CSP da interface, gestão institucional de segredos, MFA, monitoração e testes formais de segurança continuam pendentes.

## MC-018 — Backup verificado e limpeza de anexos órfãos

Solicitação: continuar a continuidade operacional que pode ser demonstrada sem infraestrutura paga.

Ajustes: adicionado comando `npm run db:backup`, que usa a API de backup do SQLite, grava em arquivo temporário, executa `integrity_check` e somente então publica a cópia final em `.data/backups`. A função de restauração aceita apenas um destino novo e também verifica a integridade, evitando sobrescrita automática da base ativa. Teste automatizado comprova que um estado removido da origem após o backup é recuperado na cópia restaurada. A API passou a remover de hora em hora uploads não vinculados com mais de 24 horas e registra a limpeza na auditoria.

Limites: não há agendador externo, cópia fora do equipamento, criptografia, rotação/retenção dos backups, alerta de falha nem ensaio operacional sobre a base ativa. A restauração definitiva exige parada controlada, escolha explícita do arquivo e validação institucional. Backups contêm o mesmo conteúdo sensível do SQLite e devem permanecer fora do Git.

## MC-019 — Revogação de vínculos e consulta restrita da auditoria

Solicitação: seguir com o funcionamento completo possível sem custos, avançando a governança do portal dos responsáveis.

Ajustes: Coordenação/Direção passaram a consultar vínculos existentes e revogá-los com motivo, confirmação, controle otimista de versão, notificação interna e registro de auditoria. A autorização é conferida nas chamadas seguintes, bloqueando imediatamente os dados do estudante; uma nova solicitação pode revalidar o vínculo revogado. O painel ganhou uma lista de vínculos ativos e uma aba restrita com ator, recurso, ação, referência e instante dos registros de auditoria, sem expor os estados internos armazenados. Migrações preservam bases SQLite existentes e testes cobrem papéis, revogação, bloqueio, repetição e revalidação.

Limites: a conferência documental e o motivo são demonstrativos. A interface conectada consulta vínculos periodicamente, portanto pode levar até cinco segundos para refletir a revogação visualmente, embora o backend já bloqueie a chamada. Não há identidade institucional, encerramento administrativo de sessões, alerta externo, exportação assinada de auditoria ou política formal de retenção dos logs.

## MC-020 — Preparação executável do aplicativo Android

Solicitação: avançar até a criação do app dos responsáveis sem publicação ou infraestrutura paga.

Ajustes: o contêiner Capacitor passou a usar layout nativo de tela inteira, sem moldura de smartphone ou controles exclusivos da apresentação web, com suporte às áreas seguras. Foi criado um fluxo reproduzível para emulador Android que injeta a API acadêmica em `10.0.2.2`, usa origem HTTP somente no build de depuração e mantém HTTPS como padrão. A API passou a responder CORS/preflight apenas às origens Capacitor configuradas, com teste automatizado para origem permitida e rejeitada. Após autorização, JDK 21 e Android SDK 36 foram instalados localmente e ignorados pelo Git. O APK de depuração foi gerado em `.artifacts/`, com pacote `com.gustavosnow.catracatroia`, versão 1.0, `minSdk 24`, `targetSdk 36` e assinatura Android Debug verificada.

Limites: o APK ainda não foi executado em emulador/aparelho e sua assinatura serve somente para depuração. Não há assinatura de distribuição, publicação, push nativo, armazenamento seguro do token ou homologação. O HTTP e tráfego aberto existem apenas no manifesto `debug`; qualquer uso fora do emulador/laboratório deve usar HTTPS.

## MC-021 — Variante Android para teste em celular físico

Solicitação: configurar o aplicativo para teste em um celular real.

Ajustes: o script Android passou a oferecer modos separados para emulador e aparelho. O modo de aparelho detecta o IPv4 da rota local, incorpora a API correspondente no build e gera `catraca-de-troia-responsaveis-device-debug.apk`. Foram adicionados comandos para iniciar API e frontend na rede local. No ambiente desta revisão, a variante aponta para `192.168.0.121:3001`, teve assinatura verificada, contém a URL esperada e concluiu login demonstrativo pela interface LAN. O APK foi disponibilizado temporariamente pelo servidor web local para transferência ao celular.

Limites: celular e computador precisam permanecer na mesma rede confiável, o servidor deve continuar em execução e o endereço IPv4 pode mudar. O APK deve ser regenerado após mudança de IP. A instalação de fonte desconhecida é uma decisão explícita do usuário. O HTTP continua limitado ao build de depuração e não é configuração de produção.

## MC-022 — Entrega correta do APK pelo servidor local

Solicitação: corrigir o download que apareceu como pasta no celular.

Ajustes: o servidor de desenvolvimento/preview passou a interceptar somente o nome conhecido do APK de aparelho e enviá-lo com tipo `application/vnd.android.package-archive`, disposição de anexo, tamanho e ausência de cache. O download foi repetido pelo endereço LAN e seu SHA-256 coincidiu com o artefato original.

Limites: a rota existe apenas enquanto o servidor local estiver ativo e o arquivo ignorado estiver em `public/`. APK permanece exclusivo de Android; iOS não instala esse formato.
