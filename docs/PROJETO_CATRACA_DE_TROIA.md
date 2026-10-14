# Catraca de Troia — Controle de Acesso Inteligente

Consolidação técnica consultada em **13/10/2026**. Referências acadêmicas revisadas em outubro de 2026; entregas e metas planejadas, sem homologação comprovada neste protótipo.

## Fontes de referência

- [Atividade 01 — Ciclo de Vida](https://docs.google.com/document/d/1eYtvWycQ0RY8AZVUsdvft_6PcsAiU6WM-Qp0A1GZnhA/edit).
- [Termo de Abertura do Projeto](https://docs.google.com/document/d/123CtOo0_VU80zlFWrm8pKOE5eh1VWj38N-YrP_6kH2U/edit).
- [Dicionário da EAP — versão 1.2](https://docs.google.com/document/d/1oiOUK3fTjjsJNeXXXpx0q8YL7LK9P8CJ/edit).
- [Mapeamento e Plano de Resposta a Riscos em TI](https://docs.google.com/document/d/1btSlX5aFU_2gdUn7JFvTXXJ90HBENuXh_d514wiCOHE/edit).

Esses documentos prevalecem sobre textos herdados do AI Studio. A consolidação não substitui os documentos originais nem comprova aprovação de novas funcionalidades.

## Problema, objetivo e limites

O registro ineficiente de entrada e saída dificulta o acompanhamento pela gestão escolar e a consulta pelos responsáveis. O projeto prevê um piloto em **uma escola pública de ensino fundamental**, com **duas catracas eletrônicas**, câmeras, servidor local, reconhecimento facial, backend e banco de dados.

Cada evento deve identificar aluno, data, hora e entrada ou saída. A gestão terá painel web; responsáveis terão portal responsivo com acesso somente aos alunos vinculados. Também fazem parte do escopo histórico, notificações, avisos, justificativas, cadastro e gestão biométrica, autenticação, autorização, testes, implantação e treinamento.

A extensão para outras escolas não integra a entrega-piloto. RFID, biometria digital, integração com diário pedagógico e acompanhamento de aulas não são entregas aprovadas. A carteirinha visual existente é recurso demonstrativo adicional, sem comprovar QR Code seguro ou mecanismo de autorização.

## App dos responsáveis e painel escolar

A decisão de trabalho desta conversa é evoluir o portal para experiência de app, preservando a interface React/TypeScript. O painel escolar permanece web. Ambos devem consumir os mesmos serviços e regras, com permissões distintas.

A distribuição PWA e a base de empacotamento Android/iOS com Capacitor foram implementadas como **corte técnico demonstrativo**. Publicação em lojas, assinatura, serviços push, infraestrutura externa e critérios de aceite móveis devem ser detalhados e refletidos nos documentos acadêmicos antes de serem tratados como obrigações do piloto. Não há APK, build iOS, publicação ou homologação em aparelhos nesta revisão.

O protótipo oferece entradas por hash para responsáveis e escola e permite alternar os perfis na versão web. O build móvel dedicado abre somente a experiência dos responsáveis. A API Express/SQLite valida credenciais fictícias, sessões opacas, papéis e vínculos; a troca de interface exige uma sessão do perfil correspondente. Justificativas e eventos de entrada/saída também usam idempotência e auditoria. Eventos novos são registrados com uma fila SQLite local e um trabalhador opcional de sincronização, com retentativas, retomada e isolamento de conflitos. Avisos, leitura individual e notificações internas do portal são persistidos; não há canal push/WhatsApp real, implantação remota nem sincronização homologada entre equipamentos.

## Arquitetura prevista e continuidade

- Servidor local: identificação facial Python/OpenCV, aplicação das regras de acesso, registro persistente e integração física das duas catracas.
- Fila local: corte técnico em SQLite preserva eventos, sincroniza depois, deduplica repetições e isola conflitos; implantação e teste ponta a ponta continuam pendentes.
- Backend/API: autenticação, sessão, perfis, vínculos familiares validados, avisos, justificativas e auditoria.
- Anexos de justificativas: armazenamento local demonstrativo no SQLite, limite de 2 MB, PDF/JPG/PNG, assinatura de formato, hash e download autorizado; antivírus, criptografia e retenção institucionais permanecem pendentes.
- Notificações: canal aprovado, fila, novas tentativas e estados distintos de processamento, envio, entrega e falha.
- Interfaces: painel escolar e portal/app dos responsáveis com acesso restrito.

A queda da internet não deve interromper identificação e registro locais. Notificações externas e consulta remota podem atrasar. O portal já sinaliza perda de conexão, conserva em memória os dados carregados na sessão e retoma consultas ao reconectar, sem guardar respostas pessoais no cache da PWA ou aceitar escritas offline. Esse comportamento da interface não substitui a operação local da portaria. A stack do backend e da fila deve ser detalhada na implementação; SQLite/RabbitMQ aparecem como referências no plano de riscos.

## Critérios quantitativos de homologação

| Indicador | Meta oficial | Condição |
|---|---|---|
| Acurácia facial | Pelo menos 95% | Condições de homologação previstas |
| Inferência facial | Até 500 ms em pelo menos 95% das tentativas | Ambiente e carga homologados |
| Notificações | Pelo menos 95% processadas para envio em até 5s | Conectividade prevista; não garantia de entrega ao celular em 5s |
| Disponibilidade | Pelo menos 99% | Horário escolar no período definido |
| Segurança | Ausência de vulnerabilidades críticas/altas | Após correções e novos testes |
| Segregação de dados | 100% dos testes aprovados | Consulta restrita aos vínculos autorizados |
| Carga | Taxa de erro inferior a 1% sob pico aprovado | Carga definida no plano de testes |
| Cobertura crítica | Superior a 80% | Serviços e rotinas críticas, conforme EAP |

O cenário de até 30 passagens/min mencionado em R06 orienta testes. Não há meta aprovada de 45 passagens/min nem resultados de desempenho aferidos no protótipo.

## Prazo, equipe e orçamento

Prazo estimado: **24 semanas**, aproximadamente seis meses. Três pessoas, capacidade total de 2.880 horas e 2.400 horas produtivas alocadas.

| Componente | Valor estimado |
|---|---:|
| Mão de obra — 2.400h a R$ 100/h | R$ 240.000,00 |
| Contingência — 10% da mão de obra | R$ 24.000,00 |
| Câmeras | R$ 2.000,00 |
| Duas catracas | R$ 8.000,00 |
| Servidor local | R$ 5.000,00 |
| Linha de base, incluindo contingência e hardware | **R$ 279.000,00** |
| Reserva gerencial, fora da linha de base | R$ 12.000,00 |
| Orçamento global | **R$ 291.000,00** |

Estimativas acadêmicas; não representam despesas realizadas ou financiamento assegurado. Alocação de horas: iniciação/planejamento 300h; execução 1.200h; testes/segurança 400h; monitoramento 300h; encerramento 200h.

## Governança e controle de acesso

O backend valida a sessão, o perfil e o vínculo autorizado com cada estudante nas rotas implementadas de justificativas e eventos. Cadastro público não autoriza automaticamente acesso ao histórico: o responsável autenticado solicita o vínculo pela matrícula, a identidade do estudante permanece ocultada enquanto não há aprovação e somente Coordenação/Direção pode decidir. Aprovação, revogação e revalidação atualizam a autorização efetiva e são auditadas; a consulta administrativa de vínculos e dos metadados da auditoria também é restrita a esses perfis. O corte local usa scrypt com salt para as senhas fictícias, tokens opacos armazenados como hash, expiração, revogação e auditoria de criação/encerramento. Integração com identidade institucional, HTTPS, MFA, recuperação, política de senha, proteção nativa do token, limitação distribuída de tentativas e testes de segurança continuam pendentes.

O tratamento biométrico de menores depende de validação institucional de necessidade, proporcionalidade, base jurídica, minimização, retenção, direitos e resposta a incidentes. Vetores faciais também são dados biométricos sensíveis. Preferências de notificação não autorizam automaticamente biometria nem condicionam frequência escolar.

Procedimentos alternativos de entrada precisam ser aprovados e testados, incluindo segurança física, inclusão e rastreabilidade. O QR Code provisório de R07 depende dessa aprovação. Liberação manual deve registrar operador e justificativa. Bloqueios acadêmicos ou disciplinares não devem virar regras de entrada sem decisão institucional documentada.

## Riscos R01–R08

| ID | Evento | P × I | Classe oficial |
|---|---|---:|---|
| R01 | Exposição de biometria ou cadastro de menores | 10 | Médio |
| R02 | Consulta indevida ao histórico / comprometimento de sessão | 10 | Médio |
| R03 | Falha da internet | 16 | Alto |
| R04 | Falha elétrica ou mecânica de catraca | 6 | Baixo |
| R05 | Acurácia facial inferior a 95% | 12 | Médio |
| R06 | Gargalo e inferência superior a 500 ms | 16 | Alto |
| R07 | Resistência ou baixa adesão ao cadastro | 16 | Alto |
| R08 | Indisponibilidade de integrante essencial | 12 | Médio |

Consulte gatilhos, responsáveis e respostas no plano oficial. A classificação numérica não reduz a prioridade de incidentes graves envolvendo menores ou segurança física. Criptografia, auditoria, backups, fila local e testes são requisitos previstos, ainda não demonstrados pelo frontend.

## Ciclo de vida e aceite

Iniciação e planejamento formalizam escopo, requisitos, EAP, custos, cronograma e riscos. Desenvolvimento abrange os pacotes 1.3.1–1.3.8. QA inclui integração, autorização, carga, segurança, recuperação e contingência. Implantação configura servidor, instala duas catracas e capacita usuários. Reuniões quinzenais e análise semanal de logs acompanham a execução.

Encerramento exige evidências dos fluxos completos, continuidade local, sincronização, rastreabilidade, procedimentos alternativos, resultados de testes, manuais, lições aprendidas e aceite formal.

## Estado atual e mudanças

Veja `ALINHAMENTO_E_RASTREABILIDADE.md` para o mapeamento entre EAP e código e `CONTROLE_DE_MUDANCAS.md` para as decisões desta revisão. O frontend demonstra parte das jornadas; autenticação/sessão, justificativas, eventos e fila de saída possuem backend local. Biometria, hardware, identidade institucional, demais serviços, infraestrutura remota e homologação da sincronização estão pendentes.

Identidade visual preservada: azul-marinho `#0B192C`/`#1E293B` e laranja `#EA580C`/`#F97316`/`#FF6500`, com os ativos existentes.
