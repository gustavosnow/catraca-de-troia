# Catraca de Troia

Protótipo acadêmico de controle de entrada e saída em uma escola pública de ensino fundamental. Painel web da gestão escolar e portal responsivo dos responsáveis, preparado para evolução móvel.

**Estado: demonstração em evolução.** Autenticação, origem das passagens, notificações e anexos ainda são simulados. Eventos de entrada/saída e justificativas já consomem uma API local com SQLite, vínculo, papéis, idempotência e auditoria demonstrativos. A experiência dos responsáveis também possui PWA instalável e projetos-base Capacitor; isso não equivale a autenticação real, aplicativo publicado ou integração com hardware/serviços externos.

## Executar

Requisito: Node.js com npm. A demonstração atual não exige chave Gemini.

```bash
npm ci
npm run dev
```

Abra `http://localhost:3000`. O comando inicia a API na porta `3001` e o Vite na porta `3000`; o proxy do Vite mantém as chamadas da interface no mesmo endereço. O portal inicia na visão dos responsáveis, e o botão de painel escolar permite explorar o outro perfil da demonstração.

As interfaces também possuem entradas demonstrativas identificáveis: `http://localhost:3000/#/responsaveis` e `http://localhost:3000/#/escola`. Eventos de entrada/saída, histórico derivado e justificativas são persistidos pela API local; avisos e notificações visuais ainda permanecem somente na memória da página.

```bash
npm run lint
npm run build
npm run preview
```

## API local de justificativas e eventos

O primeiro corte do backend persiste justificativas em `.data/catraca-de-troia.sqlite`, valida vínculos no servidor, restringe revisões à Coordenação/Direção e registra auditoria. Os dados iniciais são fictícios e coerentes com os identificadores da demonstração.

```bash
npm run api:dev
npm run test:api
```

A API inicia em `http://127.0.0.1:3001`. O script ativa `DEMO_AUTH=true`; envie o header `X-Demo-User-Id` com um ator fictício, como `guardian-1` ou `staff-2`. Esse mecanismo existe somente para desenvolvimento e não deve ser exposto como autenticação real.

O React já consome essas rotas. Contas de Coordenação (`staff-2`) e Direção (`staff-3`) podem analisar justificativas; o operador de portaria (`staff-1`) pode consultar a fila, mas os comandos de análise permanecem bloqueados na interface e no servidor. Somente o nome de um anexo demonstrativo é armazenado.

Os eventos persistidos registram estudante, entrada/saída, instante, catraca, método, ator escolar e estados demonstrativos de notificação. Responsáveis consultam somente estudantes com vínculo aprovado; apenas perfis escolares registram passagens. O botão de simulação e a simulação automática — desativada por padrão — alimentam esse fluxo sem representar hardware ou reconhecimento facial real. Liberações manuais de estudantes também persistem o motivo; visitantes e emergências sem estudante continuam apenas visuais.

## PWA e projetos móveis

A entrada instalável abre em `/#/responsaveis`, possui manifesto e cache apenas do shell estático. Chamadas `/api`, envios e dados pessoais não são armazenados pelo service worker. Em navegadores compatíveis, use o convite **Instalar**; no Safari iOS, use **Compartilhar → Adicionar à Tela de Início**.

```bash
npm run build:parent
npm run preview
npm run cap:sync
```

Para conferir a versão instalável local, mantenha a API ativa e abra `http://localhost:4173/#/responsaveis` após `npm run preview`. O servidor de desenvolvimento prioriza HMR; o manifesto e o service worker validados são os arquivos do build de produção.

Os projetos nativos ficam em `android/` e `ios/`. O build móvel oculta a troca para o painel escolar e desativa o service worker dentro do Capacitor. Para consumir uma API fora do navegador local, configure `VITE_API_BASE_URL` com uma URL HTTPS alcançável pelo aparelho antes de `npm run cap:sync`; `localhost` no celular não é este computador.

O identificador `com.gustavosnow.catracatroia` é provisório e deve ser confirmado com o domínio institucional antes de assinatura ou publicação. Android exige Android Studio/SDK compatíveis; iOS exige macOS e Xcode. Não há APK, assinatura, push nativo nem publicação em loja nesta etapa.

## Documentação

- [Escopo, critérios de aceite e fontes oficiais](docs/PROJETO_CATRACA_DE_TROIA.md)
- [Rastreabilidade da EAP, estado atual e próximos passos](docs/ALINHAMENTO_E_RASTREABILIDADE.md)
- [Controle de mudanças](docs/CONTROLE_DE_MUDANCAS.md)
- [Instruções de desenvolvimento](AGENTS.md)
- [Política de contribuição e commits](CONTRIBUTING.md)

Linha de base: uma escola, duas catracas, processamento facial local, 24 semanas e orçamento global acadêmico de R$ 291.000. Critérios quantitativos são metas de homologação, não resultados deste frontend.

## Estrutura e evolução

`src/components/ParentApp/` contém a experiência dos responsáveis. Os demais componentes compõem o painel escolar e as interfaces compartilhadas. `src/services/accessEventsApi.ts` integra o fluxo persistente, e `demoAccessService.ts` deriva linha do tempo e histórico desses registros. `src/data/mockData.ts` ainda reúne dados visuais fictícios; `projectBaseline.ts` centraliza metas e links das fontes.

O corte atual entrega uma PWA instalável e estruturas Capacitor para Android/iOS, reaproveitando o mesmo React/TypeScript. Justificativas, eventos e histórico derivado já usam a API comum; autenticação, avisos, notificações, anexos e sincronização offline ainda precisam de serviços compartilhados reais.

Origem: [protótipo no Google AI Studio](https://ai.studio/apps/b85c5f96-392f-43b3-8272-31d8c99a8592). O primeiro commit de importação preserva essa versão; o seguinte registra o alinhamento documental.

## Limites

Não utilizar a demonstração com dados reais de estudantes. Controles visuais não substituem autenticação, autorização, governança biométrica ou testes de segurança. Consulte a matriz de rastreabilidade para distinguir funcionalidades demonstrativas de entregas pendentes.
