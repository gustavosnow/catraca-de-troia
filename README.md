# Catraca de Troia

Protótipo acadêmico de controle de entrada e saída em uma escola pública de ensino fundamental. Painel web da gestão escolar e portal responsivo dos responsáveis, preparado para evolução móvel.

**Estado: demonstração em evolução.** O frontend ainda usa dados, autenticação, passagens, notificações e anexos simulados. Há uma primeira API local isolada para justificativas, com SQLite e autorização demonstrativa; ela ainda não está conectada às interfaces nem equivale a autenticação real.

## Executar

Requisito: Node.js com npm. A demonstração atual não exige chave Gemini.

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`. O portal inicia na visão dos responsáveis; o botão de painel escolar permite explorar o outro perfil da demonstração.

As interfaces também possuem entradas demonstrativas identificáveis: `http://localhost:3000/#/responsaveis` e `http://localhost:3000/#/escola`. Ambas compartilham em memória os eventos de entrada/saída, notificações e justificativas enquanto a página permanece aberta.

```bash
npm run lint
npm run build
npm run preview
```

## API local de justificativas

O primeiro corte do backend persiste justificativas em `.data/catraca-de-troia.sqlite`, valida vínculos no servidor, restringe revisões à Coordenação/Direção e registra auditoria. Os dados iniciais são fictícios e coerentes com os identificadores da demonstração.

```bash
npm run api:dev
npm run test:api
```

A API inicia em `http://127.0.0.1:3001`. O script ativa `DEMO_AUTH=true`; envie o header `X-Demo-User-Id` com um ator fictício, como `guardian-1` ou `staff-2`. Esse mecanismo existe somente para desenvolvimento e não deve ser exposto como autenticação real. A integração do React com a API permanece pendente.

## Documentação

- [Escopo, critérios de aceite e fontes oficiais](docs/PROJETO_CATRACA_DE_TROIA.md)
- [Rastreabilidade da EAP, estado atual e próximos passos](docs/ALINHAMENTO_E_RASTREABILIDADE.md)
- [Controle de mudanças](docs/CONTROLE_DE_MUDANCAS.md)
- [Instruções de desenvolvimento](AGENTS.md)
- [Política de contribuição e commits](CONTRIBUTING.md)

Linha de base: uma escola, duas catracas, processamento facial local, 24 semanas e orçamento global acadêmico de R$ 291.000. Critérios quantitativos são metas de homologação, não resultados deste frontend.

## Estrutura e evolução

`src/components/ParentApp/` contém a experiência dos responsáveis. Os demais componentes compõem o painel escolar e as interfaces compartilhadas. `src/services/demoAccessService.ts` deriva linha do tempo e histórico do fluxo comum em memória. `src/data/mockData.ts` reúne os cenários fictícios; `projectBaseline.ts` centraliza metas e links das fontes.

App Android/iOS via Capacitor e distribuição PWA são evoluções propostas; ainda não há APK ou instalação PWA. Painel e app deverão consumir uma API comum, com autorização no servidor por perfil e vínculo validado pela escola.

Origem: [protótipo no Google AI Studio](https://ai.studio/apps/b85c5f96-392f-43b3-8272-31d8c99a8592). O primeiro commit de importação preserva essa versão; o seguinte registra o alinhamento documental.

## Limites

Não utilizar a demonstração com dados reais de estudantes. Controles visuais não substituem autenticação, autorização, governança biométrica ou testes de segurança. Consulte a matriz de rastreabilidade para distinguir funcionalidades demonstrativas de entregas pendentes.
