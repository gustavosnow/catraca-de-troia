# Roteiro de aceite acadêmico dos portais

Este roteiro valida o corte web responsivo do Catraca de Troia com dados fictícios, API local e integrações simuladas. Ele não inclui geração de APK, publicação em lojas, acionamento de catracas, câmeras ou reconhecimento facial real.

## Critério deste ciclo

O ciclo é aprovado quando:

- `npm run lint`, `npm run test:api`, `npm run build`, `npm run test:visual` e `npm run test:pwa` terminam sem erro;
- todos os casos críticos abaixo passam nos perfis autorizados;
- nenhuma tela apresenta dado de estudante sem sessão e vínculo aprovados;
- indisponibilidade e simulações são identificadas sem alegar operação real;
- bloqueios encontrados são registrados com evidência, responsável e decisão.

As metas da EAP para acurácia facial, latência, disponibilidade, carga, segurança e notificações externas não são aferidas por este roteiro.

## Preparação

1. Usar somente a base e as contas fictícias incluídas no projeto.
2. Iniciar API e interface com `npm run dev`.
3. Abrir `#/responsaveis` e `#/escola` em janelas separadas.
4. Repetir os casos responsivos em 360 px, 768 px e largura desktop.
5. Registrar data, navegador, largura, perfil, resultado e evidência de cada execução.

## Matriz de verificação

| ID | Área | Cenário | Resultado esperado | Criticidade |
|---|---|---|---|---|
| AC-01 | Sessão | Abrir cada rota sem sessão | Somente o acesso do perfil correspondente é oferecido | Crítica |
| AC-02 | Sessão | Tentar credencial de responsável na rota escolar e vice-versa | A sessão incompatível é recusada sem expor o outro portal | Crítica |
| AC-03 | Sessão | Encerrar sessão e usar voltar/atualizar | Conteúdo protegido não reaparece | Crítica |
| AC-04 | Conta | Bloquear uma conta com outra sessão aberta | Sessões da conta são revogadas e novo login é impedido | Crítica |
| AC-05 | Vínculo | Entrar como responsável sem vínculo | Nenhum nome ou histórico de estudante é revelado | Crítica |
| AC-06 | Vínculo | Solicitar, aprovar, revogar e solicitar revalidação | A autorização muda nas consultas seguintes e gera auditoria | Crítica |
| AC-07 | Eventos | Comparar painel e histórico do responsável vinculado | Ambos derivam os dados da mesma API local | Alta |
| AC-08 | Justificativa | Criar, analisar e consultar justificativa | Papéis, vínculo, versão e estado são respeitados | Alta |
| AC-09 | Anexo | Enviar formatos/tamanhos válidos e inválidos | Somente PDF/JPG/PNG de até 2 MB e assinatura compatível são aceitos | Alta |
| AC-10 | Avisos | Criar, ler e excluir logicamente um aviso | Alterações persistem e respeitam o papel autorizado | Alta |
| AC-11 | Notificações | Gerar evento, justificativa, vínculo ou aviso | Caixa interna e fila `PUSH_DEMO` refletem apenas uma simulação | Alta |
| AC-12 | Fila | Consultar fila sem destino remoto configurado | Eventos ficam preservados e a interface informa operação local | Crítica |
| AC-13 | Fila | Simular falha, retentativa e conflito pelos testes da API | Não há perda, duplicação nem sobrescrita silenciosa | Crítica |
| AC-14 | Conexão | Derrubar a API com o portal já carregado | Dados existentes permanecem só em memória e escritas são bloqueadas | Alta |
| AC-15 | Conexão | Restaurar a API | Consultas são retomadas sem recarregar dados pessoais do cache PWA | Alta |
| AC-16 | Estado vazio | Usar conta sem vínculo, fila vazia e categorias sem notificações | A tela explica o estado e apresenta a ação possível | Média |
| AC-17 | Erro | Forçar respostas indisponíveis nos serviços principais | Mensagem compreensível é anunciada e não há sucesso falso | Alta |
| AC-18 | Teclado | Percorrer cabeçalhos, navegações, formulários e diálogos | Ordem é lógica e o foco permanece visível | Alta |
| AC-19 | Diálogo | Abrir modais e usar `Tab`, `Shift+Tab` e `Escape` | Foco fica contido, `Escape` fecha quando seguro e o acionador recupera foco | Alta |
| AC-20 | Semântica | Inspecionar títulos, regiões, rótulos, página ativa e alertas | Elementos têm nome acessível e mudanças relevantes são anunciadas | Alta |
| AC-21 | Movimento | Ativar redução de movimento no sistema | Animações e transições deixam de causar movimento prolongado | Média |
| AC-22 | Responsividade | Executar os fluxos em 360 px, 768 px e desktop | Não há corte de ação crítica nem rolagem horizontal indevida | Alta |
| AC-23 | PWA | Abrir a interface instalada ou em modo standalone | Layout ocupa a tela sem armazenar respostas pessoais no cache | Média |
| AC-24 | Escopo | Acionar liberação, QR, fila de entrega e status de catraca | A interface identifica a natureza demonstrativa; nenhum hardware ou canal externo é alegado | Crítica |

## Evidências mínimas

Para cada falha, registrar:

- ID do caso e perfil utilizado;
- passos mínimos para reprodução;
- resultado observado e esperado;
- captura de tela ou trecho de log sem dados reais;
- severidade: bloqueante, alta, média ou baixa;
- correção aplicada ou justificativa de aceite da limitação.

Ao concluir, registrar no controle de mudanças a data, os casos executados, os bloqueios restantes e os comandos de validação. Não marcar hardware, biometria, push externo ou indicadores de homologação como aprovados.

O ciclo automatizado de 16/10/2026 está registrado em `EVIDENCIAS_ACEITE_ACADEMICO_2026-10-16.md`. As capturas são geradas localmente em `.artifacts/visual-acceptance/` e não devem ser versionadas.
