# Alinhamento do protótipo e rastreabilidade

Referências consultadas em 13/10/2026; links em `PROJETO_CATRACA_DE_TROIA.md`.

| Pacote EAP | Requisito | Evidência atual | Situação e próximo trabalho |
|---|---|---|---|
| 1.1.1–1.1.4 | TAP, custos, riscos, acompanhamento e encerramento | Consolidação e links das fontes | Documentação acadêmica existente; aceite e encerramento pendentes |
| 1.2.1 | Requisitos funcionais e não funcionais | Linha de base e metas centralizadas em `projectBaseline.ts` | Refinar histórias e plano de aceite |
| 1.2.2–1.2.3 | Jornadas e protótipo de alta fidelidade | React: painel e `ParentAppView` | Demonstração; formalizar fluxogramas |
| 1.3.1 | Backend e banco | API Express/SQLite consumida por justificativas, eventos, avisos e notificações internas; fila de saída e receptor de sincronização | Corte integrado com idempotência, controle de versão, auditoria e retentativas; implantar destino remoto e ampliar os demais módulos |
| 1.3.2 | Reconhecimento facial | Passagens geradas por simulação | Pendente: Python/OpenCV e homologação |
| 1.3.3 | Painel escolar | `Header`, `LiveStreamFeed`, cadastros, avisos, fila de justificativas, vínculos, auditoria e estado da sincronização | Fluxos integrados usam API local; cadastro geral de estudantes continua demonstrativo |
| 1.3.4 | Portal responsivo dos responsáveis | `ParentAppView`, PWA, Capacitor Android/iOS e APK Android de depuração verificado | APK demonstrativo criado; teste em aparelho, API HTTPS remota, armazenamento seguro nativo, assinatura de distribuição, homologação e publicação permanecem pendentes |
| 1.3.5 | Integração e acionamento | Duas catracas em `mockData.ts`, liberação manual visual | Pendente: hardware, operador validado e auditoria persistente |
| 1.3.6 | Notificações | Caixa interna persistente para passagens, justificativas e avisos | Corte local funcional; pendentes canal externo aprovado, fila de entrega, retentativas e comprovação da meta |
| 1.3.7 | Gestão biométrica | Cadastro visual e ficha do aluno | Pendente: ciclo de dados biométricos e proteção institucional |
| 1.3.8 | Autenticação e autorização | Login local, sessão opaca, APIs validando papéis/vínculos, revogação/revalidação auditada e limitação local de tentativas | Corte funcional testado com contas fictícias; integrar identidade institucional, HTTPS e controles distribuídos de produção |
| 1.4.1 | Plano e testes automatizados/manuais | Typecheck, build e verificação dos cenários desta revisão | Não equivale à cobertura funcional/QA da EAP |
| 1.4.2–1.4.3 | Carga, segurança e correções | Sem resultados de homologação | Pendente: plano, execução, retestes e relatório |
| 1.5.1 | Servidor, backup e continuidade local | Fila SQLite, retentativas, receptor idempotente, backup verificado e restauração testada em arquivo novo | Pendente: implantação em servidor escolar/destino, agenda e retenção operacional, monitoramento e teste real de desconexão/restauração |
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
- O painel escolar consulta o estado real da fila local, diferencia destino não configurado e exibe pendências, processamento, sincronizados, conflitos e última sincronização. Reenfileiramento de conflitos permanece restrito à Coordenação/Direção também no backend.
- Justificativas já são lidas, criadas e analisadas pelo React por meio da API local, com idempotência, controle otimista, auditoria, papéis e vínculos. Anexos novos de justificativas armazenam conteúdo no SQLite, com tipos/tamanho restritos, assinatura conferida, hash e download autorizado. Registros semeados antigos e anexos de avisos continuam apenas nominais; não há antivírus homologado.
- Avisos são persistidos na API local, com gestão restrita à Coordenação/Direção, controle otimista, exclusão lógica, auditoria, leitura individual e disparo idempotente para a caixa interna dos responsáveis. Passagens e mudanças em justificativas também geram notificações internas somente para os vínculos aprovados.
- A PWA armazena somente o shell estático. Cache da interface não substitui a continuidade do servidor escolar; a fila implementada é do servidor escolar e não habilita escritas offline no celular do responsável.
- Com o portal aberto, a perda de conexão preserva somente o estado já carregado em memória, informa a última atualização, bloqueia escritas e dispara nova consulta no retorno da rede. Uma abertura sem conexão ainda não restaura sessão nem dados pessoais, por decisão de minimização deste corte.
- Os projetos Capacitor foram gerados e sincronizados, mas ainda exigem URL HTTPS de API acessível ao aparelho, identificador institucional definitivo, SDKs, assinatura, testes em dispositivos e decisão formal de distribuição.
- O contêiner nativo remove a moldura e os controles exclusivos da apresentação web, ocupa a tela, respeita áreas seguras e possui configuração isolada para a API HTTP do emulador. A API trata preflight somente para origens Capacitor permitidas. Um JDK 21 e Android SDK 36 locais foram instalados após autorização, e o APK de depuração foi compilado e teve pacote, SDKs e assinatura verificados. Isso ainda não constitui teste em dispositivo, assinatura de distribuição ou publicação.
- Uma variante para celular físico detecta o IP atual do computador, incorpora a URL da API no build e mantém um nome de artefato separado. O modo `dev:device` limita o uso pretendido à mesma rede local; a disponibilidade foi conferida no endereço LAN e o login demonstrativo respondeu com sucesso. A execução visual e funcional no aparelho ainda depende da instalação pelo usuário.
- O cadastro demonstrativo não lista mais estudantes. Responsáveis autenticados solicitam vínculo pela matrícula; pendências não revelam o nome do estudante, e somente Coordenação/Direção aprova ou rejeita com controle otimista e auditoria.
- Coordenação/Direção consultam vínculos existentes, revogam com motivo e controle de versão e podem revalidar após nova solicitação. A revogação deixa de autorizar o responsável nas chamadas seguintes; a interface do responsável atualiza os dependentes em até cinco segundos enquanto estiver conectada. A visão de auditoria é restrita e não entrega os estados internos gravados no log.
- QR da carteirinha é ilustrativo; tokens seguros, validade e procedimento de contingência exigem especificação e aprovação.
- WhatsApp/push, antivírus, anexos de avisos, câmeras e biometria não estão conectados a serviços reais. Persistência e auditoria existem nos cortes locais de justificativas, anexos locais, eventos, avisos e notificações internas; a fila de eventos existe, mas o destino remoto e a sincronização implantada continuam pendentes.
- Nenhum resultado de acurácia, latência, disponibilidade, segurança ou carga foi medido.

## Próxima sequência de desenvolvimento

1. Completar a administração local de contas e sessões fictícias, incluindo bloqueio/desbloqueio, encerramento remoto de sessões e auditoria, sem confundir esse corte com identidade institucional.
2. Implantar e observar a fila/sincronização já implementada entre servidor escolar e destino remoto, incluindo teste real de desconexão, conflito, backup e restauração.
3. Modelar uma fila demonstrativa de entrega de notificações, com estados e retentativas, mantendo o canal externo simulado.
4. Definir agenda, retenção, destino protegido e teste operacional dos backups; definir criptografia e verificação antimalware institucionais.
5. Instalar o APK de depuração em emulador/aparelho, executar o roteiro móvel e registrar evidências; depois confirmar identificador institucional, estratégia de distribuição e executar iOS em macOS/Xcode.
6. Integrar hardware e reconhecimento facial, executar homologação e produzir evidências da EAP.
