# Controle de mudanças — 13/10/2026

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
