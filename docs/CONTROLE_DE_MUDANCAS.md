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

## MC-023 — Separação dos acessos, gestão de contas e fila demonstrativa de entrega

Solicitação: aprimorar os dois portais antes de gerar outro APK, corrigindo a autenticação sobreposta, separando os acessos por perfil e avançando os incrementos funcionais gratuitos já previstos.

Ajustes: cada rota de entrada passou a aceitar exclusivamente o perfil correspondente e a exibir somente suas contas demonstrativas. O build móvel permanece restrito a responsáveis. O modal fecha no sucesso, a troca entre portais encerra a sessão anterior e os menus deixaram de abrir login ou cadastro fictício sobre uma sessão ativa. Coordenação/Direção ganharam administração local de contas fictícias, com busca, bloqueio/desbloqueio, revogação remota de sessões, controle otimista, justificativa obrigatória e auditoria. Contas bloqueadas perdem as sessões imediatamente e não autenticam até o desbloqueio. Cada nova notificação interna também cria, na mesma transação, uma entrega `PUSH_DEMO` persistente; o painel permite exercitar sucesso, indisponibilidade, backoff e reenfileiramento, sempre identificando que nenhum canal externo está conectado. Os indicadores do painel deixaram de somar bases fixas e percentuais inventados, passando a derivar somente estudantes e eventos demonstrativos carregados. Foram adicionados testes de autorização, bloqueio, revogação e retentativa.

Limites: contas, credenciais e entregas continuam fictícias. Não há identidade institucional, recuperação real de senha, MFA, push nativo, WhatsApp, comprovante de entrega ao aparelho ou processamento automático por provedor externo. A execução móvel ficou deliberadamente adiada: este ciclo é validado na interface web responsiva, sem gerar um novo APK.

## MC-024 — Experiência PWA de apresentação e primeiro ciclo de acessibilidade

Solicitação: continuar o acabamento dos portais e permitir que a apresentação reproduza a experiência do app sem exigir download de APK.

Ajustes: o portal dos responsáveis detecta telas pequenas e execução standalone, remove a moldura e os controles exclusivos da apresentação desktop e passa a ocupar a tela como o contêiner nativo. O manifesto PWA recebeu orientação, atalho e preferência de exibição. O painel escolar ganhou uma central de apresentação com QR Code, cópia e compartilhamento do endereço da sessão, além de indicação sobre HTTPS e instalação. Foram adicionados comandos para servir o build PWA junto da API e abrir um Quick Tunnel opcional. A autenticação recebeu semântica de diálogo, foco inicial, fechamento por Escape, mensagens anunciadas e estado das abas; as navegações informam a página ativa. Confirmações nativas de revogação e exclusão foram substituídas por diálogos consistentes com contexto e estado de processamento.

Limites: `cloudflared` não é dependência do projeto e precisa estar instalado no computador da apresentação. Quick Tunnel é um recurso externo temporário, público para quem possuir o endereço e sem garantia de disponibilidade. A PWA não torna a API offline, não hospeda o backend e não substitui HTTPS, identidade ou infraestrutura institucional. Nenhum novo APK foi gerado neste ciclo.

## MC-025 — Aceite acadêmico web e delimitação das simulações

Solicitação: avançar os próximos passos do projeto acadêmico sem gerar novo APK e sem integrar hardware real.

Ajustes: foi criado um roteiro reproduzível de aceite para sessão, perfis, vínculos, eventos, justificativas, anexos, avisos, fila, reconexão, estados vazios/erro, acessibilidade e responsividade. Os diálogos de alertas, liberação, ficha, documentação, justificativa, carteirinha e notificações passaram a conter o foco, responder a `Escape` quando seguro, restaurar o foco anterior e expor nome e papel semânticos. Foi adicionado foco visível global, respeito à preferência de redução de movimento, atalhos para o conteúdo principal e anúncios de estado. Textos que sugeriam push entregue ou hardware conectado foram substituídos por descrições explícitas da simulação.

Limites: este ciclo não gera APK nem implementa catracas, câmeras, reconhecimento facial, push externo ou infraestrutura institucional. Os casos do roteiro ainda precisam ser executados manualmente e registrados; os comandos automatizados validam o código, mas não equivalem ao aceite final nem às metas de homologação da EAP.

## MC-026 — Landing pública e rotas de entrada

Solicitação: publicar o incremento anterior, restaurar a API local e criar uma página visual para apresentar a ideia do sistema antes do cadastro/login.

Ajustes: a raiz da aplicação passou a exibir uma landing responsiva com proposta de valor, públicos, fluxo conceitual, premissas e metas explicitamente planejadas. Os botões encaminham para cadastro ou login de responsáveis e login da escola. As rotas `/#/responsaveis/cadastro`, `/#/responsaveis/login` e `/#/escola/login` preservam o modo de entrada após recarregar. A composição mantém a identidade azul-marinho/laranja, usa o ativo oficial e diferencia API local, simulações acadêmicas e resultados ainda não medidos. A página foi inspecionada em 1440 px e 390 px; o cadastro direto também foi conferido visualmente.

Limites: o cadastro, as contas e os dados continuam demonstrativos. A landing não comprova implantação, monitoramento real, hardware, biometria, canal externo ou atingimento das metas. Nenhum APK foi gerado.

## MC-027 — Entrada pública independente da sessão anterior

Solicitação: corrigir a ausência aparente da landing no servidor atual.

Ajustes: a restauração automática de uma sessão salva deixou de redirecionar a raiz antes da apresentação. `/` e `/#/apresentacao` agora mantêm a landing visível; os hashes de responsáveis e escola continuam abrindo seus fluxos específicos. Fechar um modal de entrada substitui a rota atual por `/#/apresentacao`, evitando que o histórico recoloque o login no recarregamento, e o rodapé da autenticação ganhou uma ação textual de retorno.

Limites: a sessão local continua disponível para os fluxos demonstrativos, mas não é restaurada enquanto a pessoa permanece na página pública.

## MC-028 — Navegação fluida e valorização da marca oficial

Solicitação: tornar a landing mais fluida, fazer a navegação do cabeçalho chegar aos blocos e melhorar a presença da logo na apresentação e nas demais telas.

Ajustes: os atalhos do cabeçalho passaram a rolar suavemente até as seções, indicar o bloco ativo e mostrar o progresso da leitura; o menu móvel oferece os mesmos destinos. A arte oficial em `logo-catraca-troia.png` foi mantida sem redesenho ou substituição e recebeu um enquadramento horizontal maior, com recorte apenas do espaço de respiro e assinatura textual. A mesma composição visual passou a identificar landing, autenticação, painel escolar, portal dos responsáveis e carteirinha demonstrativa. O nome exibido foi padronizado como "Catraca de Troia", sem acento, inclusive nos metadados web e nomes dos contêineres móveis.

Limites: a alteração é de navegação e identidade visual; não adiciona integração com hardware, biometria, serviço externo ou resultados de homologação. Nenhum novo APK foi gerado.

## MC-029 — Atualização da landing sob cache PWA

Solicitação: impedir que o recarregamento de `/#/apresentacao` volte a mostrar uma tela de autenticação antiga.

Ajustes: a versão web publicada passou a ativar automaticamente as atualizações do service worker. No servidor de desenvolvimento, registros e caches Workbox anteriores são removidos e `/sw.js` entrega um trabalhador de limpeza, evitando que uma PWA instalada anteriormente continue servindo um bundle obsoleto sobre `localhost`. A rota pública permanece prioritária e não restaura sessão nem autenticação sobre a landing.

Limites: a limpeza automática em desenvolvimento é restrita aos registros da origem e aos caches identificados como Workbox/precache. Não remove contas ou dados persistidos pela API e não gera novo APK.

## MC-030 — Entrada imediata pelas contas demonstrativas

Solicitação: fazer os atalhos de login demonstrativo seguirem diretamente para o portal da conta escolhida.

Ajustes: a autenticação bem-sucedida deixou de chamar também o fechamento cancelável do modal. Essa chamada concorria com a navegação do login e substituía o destino pelo retorno à apresentação. Agora o retorno autenticado controla sozinho a troca para o portal correspondente; os atalhos ficam temporariamente desabilitados durante a validação para evitar solicitações duplicadas.

Limites: as contas e credenciais continuam fictícias e dependem da API local. A correção não altera autorização, perfis, vínculos ou persistência de sessão e não gera novo APK.

## MC-031 — Cabeçalho responsivo do portal dos responsáveis

Solicitação: corrigir sobreposições e textos cortados no portal dos responsáveis e identificar a unidade escolar.

Ajustes: o modo compacto deixou de depender dos breakpoints da janela externa e passou a ser informado pela experiência exibida, inclusive dentro da moldura de smartphone em desktop. A marca reduz espaçamentos e preserva o nome completo do projeto; Carteirinha e Avisos usam ações compactas acessíveis. A unidade "EMEF Profª. Cecília Meireles" ganhou identificação própria e sempre visível. A linha da conta omite dados secundários no espaço reduzido, e os seletores de dependentes passam a uma coluna, permitindo exibir nome, turma e matrícula sem colisão. O componente foi inspecionado a 360 px e 440 px.

Limites: os dados da escola, responsáveis e estudantes continuam demonstrativos. O ajuste não representa homologação em aparelhos, integração institucional ou geração de novo APK.

## MC-032-QA — Regressão visual, desempenho e evidências operacionais

Solicitação: executar os próximos passos de qualidade, exceto a preparação do relatório final.

Ajustes: foi criado um executor visual reproduzível com Firefox/WebDriver BiDi para 360 px, 440 px, 768 px e 1440 px. Ele cobre Início, Histórico, Avisos, Carteirinha, Notificações e Justificativa, verifica rolagem horizontal, colisões, identificação da escola, navegação ativa, `Escape`, restauração de foco, movimento reduzido e estados offline/online. A carteirinha passou a permitir quebra do nome, turma e turno sem truncagem. O build separa React, ícones e QR Code, reduzindo o chunk da aplicação de cerca de 600 kB para 331,85 kB. Uma verificação específica confirma o manifesto PWA e a exclusão de `/api` do cache. Foram executados 26 testes da API, backup da base local e restauração verificada em arquivo novo; as evidências estão em `EVIDENCIAS_ACEITE_ACADEMICO_2026-10-16.md`.

Limites: capturas, backup e restauração ficam em diretórios locais ignorados pelo Git. Interrupção operacional observada da API, percurso manual integral por teclado e instalação standalone ainda exigem execução manual. Não houve relatório final, novo APK, hardware real ou homologação institucional.


## MC-032 — Escopo enxuto e apresentação pelo navegador em 29/10/2026

Solicitação: corrigir funcionalidades adicionais após comparar o código com os documentos acadêmicos e permitir apresentar a experiência móvel sem exigir instalação do APK.

Decisão vigente: manter justificativas textuais enviadas pelos responsáveis e analisadas pela Coordenação/Direção; retirar atestados/anexos, ficha de saúde, carteirinha digital, RFID, contato manual por WhatsApp e gestão de acesso de terceiros das telas do piloto. Upload/download ficam indisponíveis na API e novas referências a anexos são rejeitadas. Métodos novos de acesso ficam restritos a facial e manual. Bases existentes não são apagadas.

APK Android continua como objetivo do produto. O modo de apresentação usa o mesmo portal responsivo pelo navegador via URL/QR Code. Instalar PWA ou APK é opcional e não faz parte do requisito da apresentação. A central aceita endereço alcançável pelo celular, não gera QR de localhost/loopback, remove parâmetros de consulta e aponta à rota dos responsáveis sem credenciais. Não inicia túnel, publica site ou gera novo APK automaticamente.

Atualizados TAP, Atividade 01, Plano de Riscos e Dicionário da EAP v1.3 no Drive, além da consolidação técnica, instruções e roteiro no repositório. Os registros anteriores de desenvolvimento de anexos são históricos e ficam superados por esta decisão de escopo.

## MC-033 — Responsividade, rolagem e QR direto em 04/11/2026

Solicitação: corrigir o formulário cortado e a rolagem do portal dos responsáveis e tornar direto o acesso da apresentação por QR Code.

Ajustes: o formulário de vínculo passou a responder à largura real do card, inclusive dentro da moldura de smartphone em uma janela desktop. Nessa prévia, a moldura mantém proporções de celular, com largura e altura limitadas, enquanto a rolagem externa do navegador movimenta o conteúdo exibido; a navegação inferior integra o rodapé da moldura sem flutuar sobre os cartões. No celular real, PWA e modo expandido, a área interna continua rolável para preservar o comportamento de aplicativo. A justificativa possui rolagem própria e o diálogo da prévia abre sobre a janela para não depender da posição vertical da moldura. A API passou a listar endereços IPv4 utilizáveis, priorizando a interface Wi-Fi; a central escolhe automaticamente esse endereço quando a página está em localhost e gera o QR diretamente para `/#/responsaveis`. O aceite visual cobre o final da aba de avisos, a justificativa rolável e a moldura estreita em desktop.

Limites: o endereço local só funciona quando celular e computador estão na mesma rede e a rede permite comunicação entre aparelhos. O QR não leva sessão, senha ou token e não evita a autenticação demonstrativa. A descoberta não abre túnel, não publica o sistema e não altera o escopo do piloto.


## MC-034 — Conferência da documentação para apresentação em 05/11/2026

Fontes relidas em 04/11/2026: TAP, Atividade 01, Dicionário da EAP v1.3 (atualizado em 29/10/2026) e Plano de Riscos. Os documentos acadêmicos permanecem coerentes com as decisões vigentes e não foram reescritos.

Ajustes: substituída a data obsoleta de 13/10/2026 por uma data fixa de conferência em `projectBaseline`, usada na tela. Corrigida a referência residual à EAP v1.2. Metas agrupadas no item Mensurável, com os critérios complementares da EAP; prazo de 24 semanas, marcos e classificação oficial dos oito riscos apresentados sem tratar o planejamento como resultado comprovado. Distintos os controles locais implementados das integrações físicas/externas e da homologação pendentes. O QR do portal foi diferenciado do crachá eventual de contingência. O registro antigo de regressão visual, antes duplicado como MC-032, recebeu o identificador MC-032-QA; MC-032 continua identificando a decisão de escopo de 29/10.

A gestão de justificativas ainda exibia uma mensagem antiga afirmando armazenamento de novos anexos, apesar do bloqueio já aplicado na API. O texto foi corrigido para justificativas exclusivamente textuais. O cadastro deixou de sugerir WhatsApp como canal implementado na validação do telefone; o resumo do orçamento explicita a inclusão de ambas as reservas e a base dos percentuais.

Validação e limites: ver `VERIFICACAO_APRESENTACAO_2026-11-04.md`. Ensaio com celular e rede do local continua necessário; não foram gerados APK, túnel ou publicação pública. Datas históricas de testes, documentos e decisões foram preservadas.

## MC-035 — Redesign do frontend em 17/11/2026

Solicitação: reestruturar somente o frontend conforme o protótipo de interfaces publicado na Vercel, evitando estética genérica e priorizando tabelas e menus profissionais.

Ajustes: criado um design system (Inter, laranja para ação, azul-marinho para leitura, estados sempre com ícone e texto, contraste AA conferido) e componentes base compartilhados. O painel escolar passou a usar barra lateral agrupada (Gestão escolar, Administração, Ferramentas), com rota própria por seção (`#/escola/<seção>`) e tabelas administrativas com filtros. Landing, login, cadastro e portal dos responsáveis foram redesenhados; o portal deixou a moldura de smartphone e passou a ser responsivo, com navegação inferior no celular. Estudantes aparecem por iniciais, sem fotografias. Novas ilustrações em SVG seguem o traço da identidade visual oficial, que foi preservada. O cartão de presença deixou de afirmar reconhecimento facial e notificação no app como fatos e passou a exibir o último registro demonstrativo; indicadores do painel deixaram de afirmar "hoje" quando contam todos os eventos carregados. A edição de comunicados ficou visível apenas para os perfis que o backend autoriza. O aceite visual foi adaptado ao layout responsivo.

Ajustes da revisão (PR #1): os cabeçalhos da apresentação, do login e dos portais passaram a exibir o logo oficial (recorte com fundo transparente e traço reforçado, derivado de `logo-catraca-troia.png`, que segue intacto); o símbolo compacto ficou reservado a espaços pequenos. O contador de notificações do portal passou a usar `action` (4,73:1 com texto branco). A gaveta de navegação do painel fecha ao entrar no breakpoint `lg`, liberando a rolagem da página. O link de cadastro da landing passou a quebrar linha em 360 px. Na segunda rodada, o modal **Sobre o projeto** passou a ser um resumo curto da demonstração com o botão **Consultar documentação oficial**, que abre a pasta do Drive em nova aba; saíram as abas e os valores copiados de orçamento, prazo, metas e riscos, e `projectBaseline.ts` foi removido por ficar sem uso. Na aba Avisos do portal, o seletor de estudante fica oculto, porque os avisos são da escola e a leitura é registrada por responsável; a escolha é preservada nas demais abas. O portal foi revisado de 320 a 390 px: banner de instalação com o texto na largura disponível e a ação abaixo dele, filtros e ação da caixa de notificações sem corte, rótulos da navegação inferior em 12 px, nome do estudante sem truncamento no formulário de justificativa e cabeçalho do login sem empurrar o link de retorno. Em uma terceira rodada, o banner de instalação voltou a reservar o espaço do botão de dispensar a partir de 640 px (`sm:p-5` redefinia o `padding-right`), de modo que o **X** deixasse de cobrir a borda direita do botão **Instalar** quando o navegador oferece o prompt de instalação.

Limites: backend, contratos, regras de autorização e escopo do piloto não foram alterados. A lista de justificativas do painel escolar continua sem atualização periódica, como antes. Validação: lint, build, PWA, 29 testes de API, 24 cenários de aceite visual e 19 fluxos ponta a ponta executados em base isolada.

## MC-036 — Protótipo de reconhecimento facial com câmera em 17/11/2026

Solicitação: deixar de depender apenas da simulação de entrada/saída e demonstrar o fluxo com uma câmera real (webcam ou celular via DroidCam/IP Webcam), reconhecimento em Python/OpenCV e registro pela API local.

Decisão: revê parcialmente o corte de MC-034/consolidação ("hardware e biometria real não serão integrados") **somente para um protótipo de laboratório**. O agente `edge/` usa YuNet (detecção) e SFace (vetor facial) do OpenCV, compara com vetores cadastrados localmente e envia à API apenas o resultado: estudante candidato, similaridade, limiar e tempo de inferência. A API autentica o dispositivo por token opaco (hash SHA-256 armazenado), aplica um limiar mínimo próprio, confere se o estudante pertence à escola e registra o evento com `source = FACE_PROTOTYPE`, reaproveitando fila, auditoria e notificação interna. Negações são gravadas em `access_denials`, sem imagem nem vetor, sem notificar responsáveis; a passagem assistida continua sendo o caminho alternativo.

Governança: o cadastro facial do protótipo deve usar **apenas adultos da equipe, com consentimento**, vinculados a estudantes fictícios. Não usar rostos de crianças ou estudantes reais sem a validação institucional de necessidade, proporcionalidade, base jurídica, retenção e direitos. Vetores e fotos ficam em `edge/data/`, fora do Git, e podem ser apagados pelo script de cadastro.

Limites: sem prova de vida (anti-spoofing), sem catraca física acionada, sem criptografia institucional dos vetores e sem homologação. Similaridade e tempo de inferência registrados servem como medição de protótipo com poucos rostos e não comprovam as metas de 95% de acurácia ou 500 ms. A simulação permanece disponível e é identificada separadamente no painel.

## MC-037 — Comando das câmeras e do cadastro facial pelo painel em 18/11/2026

Solicitação: iniciar o cadastro facial e as catracas de entrada e saída por botões no front, sem rodar comandos Python. O front será renovado; esta mudança entrega somente a funcionalidade (API, contrato e cliente `src/services/edgeAgentsApi.ts`), sem alterar telas. Guia para quem construir as telas: `INTEGRACAO_FRONT_CAMERAS.md`.

Decisão: a API local passa a iniciar e encerrar os scripts de `edge/` como processos filhos no computador do servidor escolar, onde as janelas de vídeo continuam abrindo. Rotas: `GET /api/v1/edge-agents`, `POST /api/v1/edge-agents/recognition/:deviceId/start|stop`, `PATCH /api/v1/access-devices/:deviceId/camera`, `GET|POST /api/v1/face-enrollments`, `POST /api/v1/face-enrollments/current/cancel` e `DELETE /api/v1/face-enrollments/:studentId`. A câmera de cada catraca fica em `access_devices.camera_source` (índice da webcam ou URL http/https/rtsp sem usuário e senha). Cada início de catraca renova o token do dispositivo e o entrega só ao processo, por variável de ambiente; o token não volta na resposta nem é gravado em arquivo. O agente encerra ao ter a entrada padrão fechada (botão parar ou queda da API), liberando a câmera, e a catraca recarrega a galeria quando um cadastro termina.

Segurança e governança: desligado por padrão; ligado somente por `EDGE_CONTROL_ENABLED=true`, definido em `npm run dev` (uso local) e ausente de `api:device` e da apresentação. Argumentos dos scripts vêm da base (catraca, câmera, nome do estudante), nunca de texto livre. Iniciar/parar catraca: perfis escolares. Cadastrar, consultar, remover rostos e configurar câmera: somente Coordenação e Direção; o cadastro exige `consent: true` (adulto da equipe, com consentimento, ligado a estudante fictício). Início, término e remoção ficam em `audit_log` (`FACE_ENROLLMENT`, `EDGE_AGENT`, `ACCESS_DEVICE`). Uma câmera não pode ser usada por dois processos ao mesmo tempo.

Limites: mantém todos os limites de MC-036. O comando só funciona no computador onde a API e o ambiente Python estão instalados; não há controle remoto de outras máquinas nem acionamento de catraca física.


## MC-038 — Integração do protótipo facial ao redesign em 18/11/2026

Solicitação: integrar a PR #2 (MC-036 e MC-037) à `main` com o redesign da MC-035, sem restaurar a interface antiga e sem perder simulação, passagem assistida, registros ou autorização.

Decisão: a `main` é a referência de estrutura e identidade visual; a PR é a referência de contratos, API e agente. O backend da PR entrou sem conflito. `LiveStreamFeed.tsx`, substituído no redesign, foi removido; a distinção de origem que ele recebeu foi levada para `AccessLogTable`. O painel facial foi reescrito com os componentes do redesign e passou a ser um cartão de **Ferramentas**: estado das câmeras, fonte de vídeo (Coordenação/Direção), iniciar e parar por catraca, cadastro facial com estudante fictício, câmera de captura e confirmação obrigatória de consentimento, lista e remoção de cadastros com confirmação, últimas leituras negadas e os estados `RUNNING`, `STOPPING`, `STOPPED`, `COMPLETED` e `FAILED`. Uma única consulta periódica (2 s com processo ativo, 5 s no restante) é encerrada ao sair da tela. O aviso de nova passagem pela câmera reaproveita a consulta de eventos do `App.tsx` e dispara uma vez por registro.

Origem dos registros: `FACE_PROTOTYPE` aparece como **Protótipo facial**, distinto de **Simulada** e **Assistida**, com o mesmo rótulo na tabela de registros, na ficha do estudante e na exportação CSV (coluna `Origem`, antes `Metodo`).

Limites: mantém todos os limites de MC-036 e MC-037. Comando das câmeras só com `npm run dev` no computador da portaria; na apresentação por QR, o cartão mostra estado e leituras negadas, com os comandos desligados. Ensaio físico com câmera e adulto voluntário não foi executado nesta integração (ambiente sem `edge/.venv`, OpenCV e modelos). Validação: lint, build, PWA, 39 testes de API, 24 cenários de aceite visual, 26 verificações de regras de negócio em base isolada e 15 verificações da interface com respostas simuladas da API.

Ajuste posterior: o endereço do QR da apresentação deixou de ser calculado só na inicialização da API. Com o servidor ligado em uma rede e o computador movido para outra, o QR continuava apontando para o IP antigo e o celular não abria o portal. A rota `/api/presentation-access` passa a consultar as interfaces a cada pedido; o comportamento de escolha do endereço (prioridade ao Wi-Fi, sem loopback, IPv6 ou autoconfigurados) não mudou. Coberto por teste de API.

## MC-039 — Dados reais, RBAC conferido e sequência de passagens em 19/11/2026

Solicitação: retirar os dados fictícios do frontend, do backend e do banco; trabalhar com os dados cadastrados da escola; conferir rotas e RBAC por perfil; identificar as câmeras de entrada e de saída; impedir que a câmera grave duas entradas (ou duas saídas) seguidas do mesmo estudante; remover duplicidades e funcionalidades que não funcionavam; carregar ao menos 10 estudantes, a Coordenação (Gustavo Coelho), a Portaria (Hanrry Junior) e os responsáveis, com Saylon Batista responsável por mais de um estudante.

Dados: `src/data/mockData.ts` foi removido e o painel passou a ler estudantes (`GET /students`), catracas (câmeras cadastradas) e pontos de atenção (leituras negadas do dia) da API. `createDatabase` cria só o esquema; os registros de exemplo foram para `server/test/fixtures/` (testes de API) e `visual-tests/fixtures.ts` (aceite visual), fora do sistema. `npm run db:seed` carrega a escola com a senha inicial de `SEED_PASSWORD` (nunca no código); com `--reset`, faz backup verificado em `.data/backups/` e preserva as câmeras cadastradas. A ficha do estudante ganhou turma, turno, etapa, regente, nascimento, regra de saída, contato e situação; o vínculo passou a guardar o parentesco aprovado. O portal recebe só o próprio vínculo, sem dados de outros responsáveis.

Sequência: a mesma regra vale para câmera e passagem assistida: a primeira passagem do dia letivo (fuso `SCHOOL_TIME_ZONE`, padrão America/Sao_Paulo) é entrada e depois alterna. Fora dela, a câmera recebe `SEQUENCE_BLOCKED` (sem gravar passagem nem negação; o agente mostra **JA REGISTRADO** em amarelo) e a passagem assistida recebe `409 SEQUENCE_CONFLICT`. A repetição dentro de 15 s continua devolvendo o mesmo evento.

Segurança e RBAC: a rota `POST /students/:id/access-events` passou a aceitar só passagem assistida (método manual, motivo obrigatório, catraca cadastrada e ativa), com nova origem `ASSISTED_PASSAGE`; o cliente não define nome da catraca nem status de entrega. Antes, qualquer conta da equipe podia gravar uma passagem "facial autorizada" pelo painel. `server/test/rbac.test.ts` confere todas as rotas de leitura para seis perfis e as escritas restritas. A rota `/me`, duplicada de `/auth/session` e sem uso, foi removida.

Funcionalidades corrigidas ou retiradas: simulação de passagens removida (a passagem assistida passou a registrar entrada ou saída, com a direção esperada sugerida); cadastro de responsável passou a ser real (`POST /auth/register`, com limite de tentativas, cria a conta e o pedido de vínculo, sem liberar dados antes da aprovação); cadastro de equipe com chave fixa e recuperação de senha com código fixo foram retirados (contas da equipe e redefinição de senha ficam com a escola); "marcar alerta como verificado", que não persistia, foi retirado; contas de demonstração e troca de conta no portal foram retiradas. Indicadores "do dia" e presença do portal passaram a considerar só o dia corrente. O formulário de passagem assistida não é mais reiniciado pela consulta periódica, e o foco do login não é mais roubado a cada atualização.

Duplicidades: `/me/students` era consultado em três lugares a cada 5 s (agora um, a cada 15 s); a função de listar estudantes vinculados existia em dois clientes; o `UPDATE` de origem dos eventos rodava duas vezes na criação do banco; Ferramentas repetia "Sobre o projeto" e "Portal dos responsáveis", já fixos na barra lateral e no topo.

Limites: o reconhecimento facial segue protótipo de laboratório, sem homologação, sem prova de vida e sem catraca física; a entrega externa de notificações continua simulada. Os estudantes da carga são registros de teste: o cadastro facial continua restrito ao rosto de adultos voluntários da equipe, nunca de crianças. Rostos cadastrados antes desta mudança ficaram ligados a estudantes removidos e aparecem como tal no painel até serem removidos. Não há edição de estudantes nem criação de contas da equipe pelo painel. O projeto não declara `@types/react`, então `npm run lint` não confere as props do JSX; esta mudança foi conferida com os tipos instalados temporariamente.

## MC-040 — Movimento de duas semanas letivas para alimentar o sistema em 19/11/2026

Solicitação: alimentar o sistema com mais dados sobre a carga da MC-039.

Decisão: `npm run db:seed:atividade` gera o movimento das dez últimas semanas letivas anteriores e do dia corrente até o horário atual, sempre pelos serviços da API com um relógio controlado, nunca por inserção direta. Assim valem a sequência entrada → saída, a origem das passagens (câmera autenticada ou passagem assistida com motivo), as notificações aos responsáveis, a fila de sincronização, a auditoria e as permissões de cada perfil. A sequência pseudoaleatória é fixa: a mesma carga gera o mesmo movimento. O script recusa um banco que já tenha passagens.

Conteúdo: passagens dos 10 estudantes por turno, com cerca de 1 em 8 assistidas, chegadas atrasadas, uma saída antecipada e cinco faltas; uma ou duas leituras negadas por dia; cinco comunicados da Coordenação; quatro justificativas textuais (duas aprovadas, uma recusada, uma pendente) e uma falta sem justificativa; um pedido de vínculo recusado e o cadastro de uma nova responsável com pedido pendente; leitura das notificações pelos responsáveis, deixando as dos dois últimos dias não lidas.

Limites: as passagens pela câmera são geradas pela rota de reconhecimento, sem câmera física; similaridade e tempo de inferência são valores de carga, não medições do protótipo.

Ajuste da MC-040: o banco (`.data/`) continua fora do Git, porque guarda hashes de senhas e sessões e mudaria a cada uso. Para a equipe ver os mesmos dados, `npm run db:demo` roda a carga da escola e o movimento num clone novo; sem câmeras a preservar, a carga cadastra entrada e saída da catraca 01. O README avisa que os dados precisam ser ativados e não publica a senha.
