// Metas planejadas do TAP e Dicionário da EAP, consultados em 13/10/2026.
// Nenhum indicador desta configuração representa uma medição do protótipo.
export const projectBaseline = {
  schoolCount: 1,
  turnstileCount: 2,
  weeks: 24,
  productiveHours: 2400,
  costBaseline: 279000,
  managementReserve: 12000,
  totalBudget: 291000,
  targets: [
    'Acurácia facial de pelo menos 95% nas condições de homologação.',
    'Inferência de até 500 ms em pelo menos 95% das tentativas.',
    'Pelo menos 95% das notificações processadas para envio em até 5 segundos, nas condições de conectividade previstas.',
    'Disponibilidade de pelo menos 99% durante o horário escolar.',
    'Ausência de vulnerabilidades críticas ou altas após correções e novos testes.',
    'Capacidade sob a carga aprovada no plano de testes; sem meta de 45 passagens/min aprovada.',
  ],
  sources: [
    { title: 'Atividade 01 — Ciclo de Vida', url: 'https://docs.google.com/document/d/1eYtvWycQ0RY8AZVUsdvft_6PcsAiU6WM-Qp0A1GZnhA/edit' },
    { title: 'Termo de Abertura do Projeto', url: 'https://docs.google.com/document/d/123CtOo0_VU80zlFWrm8pKOE5eh1VWj38N-YrP_6kH2U/edit' },
    { title: 'Dicionário da EAP', url: 'https://docs.google.com/document/d/1oiOUK3fTjjsJNeXXXpx0q8YL7LK9P8CJ/edit' },
    { title: 'Mapeamento e Plano de Resposta a Riscos em TI', url: 'https://docs.google.com/document/d/1btSlX5aFU_2gdUn7JFvTXXJ90HBENuXh_d514wiCOHE/edit' },
  ],
};
