# Alinhamento do protótipo e rastreabilidade

Referências consultadas em 13/10/2026; links em `PROJETO_CATRACA_DE_TROIA.md`.

| Pacote EAP | Requisito | Evidência atual | Situação e próximo trabalho |
|---|---|---|---|
| 1.1.1–1.1.4 | TAP, custos, riscos, acompanhamento e encerramento | Consolidação e links das fontes | Documentação acadêmica existente; aceite e encerramento pendentes |
| 1.2.1 | Requisitos funcionais e não funcionais | Linha de base e metas centralizadas em `projectBaseline.ts` | Refinar histórias e plano de aceite |
| 1.2.2–1.2.3 | Jornadas e protótipo de alta fidelidade | React: painel e `ParentAppView` | Demonstração; formalizar fluxogramas |
| 1.3.1 | Backend e banco | API Express/SQLite consumida por justificativas e eventos; fila de saída e receptor de sincronização | Corte integrado com idempotência/auditoria/retentativas; expandir para avisos e notificações e implantar destino remoto |
| 1.3.2 | Reconhecimento facial | Passagens geradas por simulação | Pendente: Python/OpenCV e homologação |
| 1.3.3 | Painel escolar | `Header`, `LiveStreamFeed`, cadastros, avisos e fila de justificativas | Eventos e justificativas usam API local; cadastros, avisos e notificações continuam demonstrativos |
| 1.3.4 | Portal responsivo dos responsáveis | `ParentAppView`, histórico pela API, PWA e projetos Capacitor Android/iOS | Shell instalável e dados persistentes locais; API remota, homologação móvel e publicação pendentes |
| 1.3.5 | Integração e acionamento | Duas catracas em `mockData.ts`, liberação manual visual | Pendente: hardware, operador validado e auditoria persistente |
| 1.3.6 | Notificações | Estados e alertas visuais simulados | Pendente: serviço real, canais aprovados, fila e retentativas |
| 1.3.7 | Gestão biométrica | Cadastro visual e ficha do aluno | Pendente: ciclo de dados biométricos e proteção institucional |
| 1.3.8 | Autenticação e autorização | Login local, senha derivada com scrypt, sessão opaca expirada/revogável e APIs validando papéis/vínculos | Corte funcional testado com contas fictícias; integrar identidade institucional, HTTPS e controles de produção |
| 1.4.1 | Plano e testes automatizados/manuais | Typecheck, build e verificação dos cenários desta revisão | Não equivale à cobertura funcional/QA da EAP |
| 1.4.2–1.4.3 | Carga, segurança e correções | Sem resultados de homologação | Pendente: plano, execução, retestes e relatório |
| 1.5.1 | Servidor, backup e continuidade local | Fila SQLite de eventos, lease, retentativa exponencial, receptor idempotente e testes automatizados | Pendente: implantação em servidor escolar/destino, monitoramento, teste real de desconexão, backup e restauração |
| 1.5.2 | Instalação de duas catracas | Quantidade refletida na demonstração | Pendente: instalação física e comissionamento |
| 1.5.3 | Treinamento e manuais | README para desenvolvimento | Pendente: manuais operacionais e capacitação |

## Divergências corrigidas nesta revisão

- Quatro catracas foram reduzidas às duas previstas; registros de exemplo usam somente essas unidades.
- A geração aleatória agora consegue selecionar ambas as catracas; o cálculo anterior excluía a última.
- Metas herdadas de 99,4%, 99,9%, 1,5s e 45 passagens/min foram substituídas pelas referências oficiais ou removidas.
- Documentação interna esclarece linha de base de R$ 279.000 e reserva gerencial de R$ 12.000 fora dela; financiamento não é tratado como assegurado.
- Simulação automática usa reconhecimento facial. Métodos adicionais não são apresentados como integrações aprovadas já implementadas.
- Painel e portal indicam que são demonstrativos; a tela de autenticação diferencia a sessão funcional local dos fluxos de cadastro/recuperação ainda fictícios.
- Conta sem vínculo não ganha automaticamente o primeiro estudante nem exibe sua ficha no portal. Isso é apenas uma correção da demonstração; autorização real depende do backend.
- Preferência demonstrativa de notificações não vem marcada e não condiciona cadastro; não equivale a consentimento biométrico.

## Pendências relevantes do protótipo

- A linha do tempo do portal foi limitada aos eventos simulados de entrada e saída; uma agenda pedagógica futura exigirá fonte e escopo próprios.
- Painel e portal consultam os mesmos eventos persistidos para formar feed, presença, linha do tempo e histórico. A origem ainda é simulada; a fila local e o protocolo de sincronização existem no corte técnico, mas hardware, implantação remota e homologação offline continuam pendentes.
- Justificativas já são lidas, criadas e analisadas pelo React por meio da API local, com idempotência, controle otimista, auditoria, papéis e vínculos. `X-Demo-User-Id` foi removido; a identidade agora deriva de sessão emitida após validação de credencial fictícia. Anexos continuam restritos ao nome fictício do arquivo.
- A PWA armazena somente o shell estático. Cache da interface não substitui a continuidade do servidor escolar; a fila implementada é do servidor escolar e não habilita escritas offline no celular do responsável.
- Os projetos Capacitor foram gerados e sincronizados, mas ainda exigem URL HTTPS de API acessível ao aparelho, identificador institucional definitivo, SDKs, assinatura, testes em dispositivos e decisão formal de distribuição.
- Cadastro demonstrativo ainda permite selecionar alunos para explorar a interface; substituir por solicitação de vínculo e aprovação escolar no serviço real.
- QR da carteirinha é ilustrativo; tokens seguros, validade e procedimento de contingência exigem especificação e aprovação.
- WhatsApp/push, conteúdo de anexos, câmeras e biometria não estão conectados a serviços reais. Persistência e auditoria existem nos cortes locais de justificativas e eventos; a fila de eventos existe, mas o destino remoto e a sincronização implantada continuam pendentes.
- Nenhum resultado de acurácia, latência, disponibilidade, segurança ou carga foi medido.

## Próxima sequência de desenvolvimento

1. Definir o provedor de identidade institucional, política de credenciais/MFA/recuperação, HTTPS e armazenamento seguro de sessão no app.
2. Implantar e observar a fila/sincronização já implementada entre servidor escolar e destino remoto, incluindo teste real de desconexão, conflito, backup e restauração.
3. Definir hospedagem e configuração por ambiente para painel, PWA e aparelhos móveis.
4. Persistir avisos/notificações, integrar canal aprovado e implementar gestão real de anexos, com retenção e proteção definidas.
5. Confirmar identificador institucional, estratégia de distribuição e critérios móveis; testar PWA/Android e executar iOS em macOS/Xcode.
6. Integrar hardware e reconhecimento facial, executar homologação e produzir evidências da EAP.
