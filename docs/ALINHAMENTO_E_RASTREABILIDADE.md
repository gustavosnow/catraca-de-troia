# Alinhamento do protótipo e rastreabilidade

Referências consultadas em 13/10/2026; links em `PROJETO_CATRACA_DE_TROIA.md`.

| Pacote EAP | Requisito | Evidência atual | Situação e próximo trabalho |
|---|---|---|---|
| 1.1.1–1.1.4 | TAP, custos, riscos, acompanhamento e encerramento | Consolidação e links das fontes | Documentação acadêmica existente; aceite e encerramento pendentes |
| 1.2.1 | Requisitos funcionais e não funcionais | Linha de base e metas centralizadas em `projectBaseline.ts` | Refinar histórias e plano de aceite |
| 1.2.2–1.2.3 | Jornadas e protótipo de alta fidelidade | React: painel e `ParentAppView` | Demonstração; formalizar fluxogramas |
| 1.3.1 | Backend e banco | Estados React e `mockData.ts` | Pendente: API e persistência compartilhada |
| 1.3.2 | Reconhecimento facial | Passagens geradas por simulação | Pendente: Python/OpenCV e homologação |
| 1.3.3 | Painel escolar | `Header`, `LiveStreamFeed`, cadastros e avisos | Interface demonstrativa; faltam API e dados reais |
| 1.3.4 | Portal responsivo dos responsáveis | `ParentAppView`, histórico, notificações e justificativas | Demonstrativo; app móvel proposto como evolução |
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

- A linha do tempo contém aulas e recreio fictícios. Isso não representa integração com diário de classe nem confirmação de localização do estudante; remodelar para separar eventos de acesso de agenda ilustrativa.
- As simulações de entrada do painel e do portal ainda usam fluxos distintos; criar serviço de eventos único com entrada/saída e histórico comum antes de sincronizar aparelhos.
- Justificativas ficam no estado local da interface dos responsáveis; implementar estado/serviço compartilhado e análise no painel.
- Cadastro demonstrativo ainda permite selecionar alunos para explorar a interface; substituir por solicitação de vínculo e aprovação escolar no serviço real.
- QR da carteirinha é ilustrativo; tokens seguros, validade e procedimento de contingência exigem especificação e aprovação.
- WhatsApp/push, anexos, câmeras, biometria, persistência, filas e auditoria não estão conectados a serviços reais.
- Nenhum resultado de acurácia, latência, disponibilidade, segurança ou carga foi medido.

## Próxima sequência de desenvolvimento

1. Separar pontos de entrada das interfaces e preservar troca de perfil apenas na demonstração.
2. Unificar eventos de entrada/saída, histórico e justificativas entre painel e portal.
3. Implementar backend com perfis e vínculos validados pela escola; testar acesso cruzado e contas sem vínculo.
4. Persistir registros e preparar operação local, fila e sincronização.
5. Integrar canal de notificação aprovado e gestão de anexos.
6. Preparar portal instalável e empacotamento Android, registrando a extensão nos documentos impactados.
7. Integrar hardware e reconhecimento facial, executar homologação e produzir evidências da EAP.
