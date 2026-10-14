# Alinhamento do protótipo e rastreabilidade

Referências consultadas em 13/10/2026; links em `PROJETO_CATRACA_DE_TROIA.md`.

| Pacote EAP | Requisito | Evidência atual | Situação e próximo trabalho |
|---|---|---|---|
| 1.1.1–1.1.4 | TAP, custos, riscos, acompanhamento e encerramento | Consolidação e links das fontes | Documentação acadêmica existente; aceite e encerramento pendentes |
| 1.2.1 | Requisitos funcionais e não funcionais | Linha de base e metas centralizadas em `projectBaseline.ts` | Refinar histórias e plano de aceite |
| 1.2.2–1.2.3 | Jornadas e protótipo de alta fidelidade | React: painel e `ParentAppView` | Demonstração; formalizar fluxogramas |
| 1.3.1 | Backend e banco | Estados React e `mockData.ts` | Pendente: API e persistência compartilhada |
| 1.3.2 | Reconhecimento facial | Passagens geradas por simulação | Pendente: Python/OpenCV e homologação |
| 1.3.3 | Painel escolar | `Header`, `LiveStreamFeed`, cadastros, avisos e fila de justificativas | Interface demonstrativa com estado compartilhado em memória; faltam API e dados reais |
| 1.3.4 | Portal responsivo dos responsáveis | `ParentAppView`, histórico, notificações e justificativas | Demonstrativo; eventos e justificativas compartilham o estado da sessão com o painel; app móvel proposto como evolução |
| 1.3.5 | Integração e acionamento | Duas catracas em `mockData.ts`, liberação manual visual | Pendente: hardware, operador validado e auditoria persistente |
| 1.3.6 | Notificações | Estados e alertas visuais simulados | Pendente: serviço real, canais aprovados, fila e retentativas |
| 1.3.7 | Gestão biométrica | Cadastro visual e ficha do aluno | Pendente: ciclo de dados biométricos e proteção institucional |
| 1.3.8 | Autenticação e autorização | `AuthModal`, filtros por filhos; tela sem vínculo | Demonstração; backend deve validar vínculos e papéis |
| 1.4.1 | Plano e testes automatizados/manuais | Typecheck, build e verificação dos cenários desta revisão | Não equivale à cobertura funcional/QA da EAP |
| 1.4.2–1.4.3 | Carga, segurança e correções | Sem resultados de homologação | Pendente: plano, execução, retestes e relatório |
| 1.5.1 | Servidor, backup e continuidade local | Arquitetura documentada | Pendente: servidor, fila, sincronização e restauração |
| 1.5.2 | Instalação de duas catracas | Quantidade refletida na demonstração | Pendente: instalação física e comissionamento |
| 1.5.3 | Treinamento e manuais | README para desenvolvimento | Pendente: manuais operacionais e capacitação |

## Divergências corrigidas nesta revisão

- Quatro catracas foram reduzidas às duas previstas; registros de exemplo usam somente essas unidades.
- A geração aleatória agora consegue selecionar ambas as catracas; o cálculo anterior excluía a última.
- Metas herdadas de 99,4%, 99,9%, 1,5s e 45 passagens/min foram substituídas pelas referências oficiais ou removidas.
- Documentação interna esclarece linha de base de R$ 279.000 e reserva gerencial de R$ 12.000 fora dela; financiamento não é tratado como assegurado.
- Simulação automática usa reconhecimento facial. Métodos adicionais não são apresentados como integrações aprovadas já implementadas.
- Painel e portal indicam que são demonstrativos; a tela de autenticação informa seus limites.
- Conta sem vínculo não ganha automaticamente o primeiro estudante nem exibe sua ficha no portal. Isso é apenas uma correção da demonstração; autorização real depende do backend.
- Preferência demonstrativa de notificações não vem marcada e não condiciona cadastro; não equivale a consentimento biométrico.

## Pendências relevantes do protótipo

- A linha do tempo do portal foi limitada aos eventos simulados de entrada e saída; uma agenda pedagógica futura exigirá fonte e escopo próprios.
- Painel e portal usam um fluxo comum em memória para simular entrada/saída e derivar o histórico. Persistência, API, idempotência e sincronização entre aparelhos continuam pendentes.
- Justificativas usam estado compartilhado na sessão e podem ser analisadas no painel demonstrativo. Persistência, anexos reais, autorização e auditoria continuam pendentes.
- Cadastro demonstrativo ainda permite selecionar alunos para explorar a interface; substituir por solicitação de vínculo e aprovação escolar no serviço real.
- QR da carteirinha é ilustrativo; tokens seguros, validade e procedimento de contingência exigem especificação e aprovação.
- WhatsApp/push, anexos, câmeras, biometria, persistência, filas e auditoria não estão conectados a serviços reais.
- Nenhum resultado de acurácia, latência, disponibilidade, segurança ou carga foi medido.

## Próxima sequência de desenvolvimento

1. Evoluir as entradas demonstrativas `#/responsaveis` e `#/escola` para pontos de implantação separados quando a arquitetura de hospedagem for definida.
2. Implementar backend com perfis e vínculos validados pela escola; testar acesso cruzado e contas sem vínculo.
3. Persistir o fluxo comum de eventos e justificativas, com idempotência, auditoria, operação local, fila e sincronização.
4. Integrar canal de notificação aprovado e gestão real de anexos.
5. Preparar portal instalável e empacotamento Android, registrando a extensão nos documentos impactados.
6. Integrar hardware e reconhecimento facial, executar homologação e produzir evidências da EAP.
