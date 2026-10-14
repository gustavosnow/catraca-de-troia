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
