# Instruções e Regras de Negócio do Projeto: Catraca de Tróia

## 1. Visão Geral do Sistema
O **Catraca de Tróia** é uma solução de controle de acesso escolar inteligente para a rede pública de ensino fundamental, integrada a hardware físico (câmeras de visão computacional e catracas eletrônicas) e comunicação instantânea com pais e responsáveis.

- **Justificativa Central**: Controle de acesso ineficiente para o registro de entrada e saída de alunos no ensino fundamental da rede pública.
- **Orçamento Global**: R$ 291.000,00 (Mão de Obra: R$ 276.000,00 incluindo contingência e reserva gerencial; Hardware/CAPEX: R$ 15.000,00).
- **Prazo e Equipe**: 6 meses (24 semanas), 2.400 horas produtivas distribuídas entre Iniciação, Planejamento, Execução, Testes, Monitoramento e Encerramento.

## 2. Objetivos SMART do Projeto
- **S (Específico)**: Desenvolver e implementar uma plataforma de controle de acesso inteligente integrada a hardware (câmeras e catracas) para registrar automaticamente os horários de entrada e saída de alunos, permitindo que pais e responsáveis visualizem esses registros em tempo real.
- **M (Mensurável)**: Avaliação contínua por indicadores-chave (KPIs):
  1. Taxa de precisão do reconhecimento facial (Meta: > 99.4%);
  2. Tempo médio de disponibilidade do sistema / Uptime (Meta: > 99.9%);
  3. Tempo de resposta nas notificações aos pais (Meta: < 1.5s);
  4. Número de registros processados por minuto (Meta: > 45 passagens/min).
- **A (Atingível)**: Equipe multidisciplinar com funções bem definidas (back-end, front-end, design, testes) e recursos de investimento público.
- **R (Relevante)**: Modernização da rede pública escolar, transparência total aos responsáveis e otimização da rotina de segurança da portaria.
- **T (Temporal)**: Prazo estipulado de 6 meses desde o planejamento até a implantação e entrega final.

## 3. Pilares Funcionais
1. **Controle de Acesso Escolar (Portaria e Catracas)**:
   - Suporte a múltiplos métodos de validação: Reconhecimento Facial por Visão Computacional, Crachá RFID/NFC, QR Code Dinâmico e Biometria Digital.
   - Monitoramento contínuo de fluxo de alunos, professores, funcionários e visitantes.
   - Bloqueio com alerta de segurança para alunos suspensos, saídas não autorizadas ou horários divergentes do turno.
   - Módulo de liberação manual na portaria com registro do operador e justificativa.

2. **Aplicativo dos Pais / Responsáveis**:
   - Linha do tempo do dia com horário exato e catraca utilizada pelo estudante.
   - Histórico semanal de presença e pontualidade.
   - Envio de justificativas de falta com upload de atestado médico.
   - Visualização da Carteirinha Digital do Estudante.
   - Canal de Comunicados Oficiais e Avisos da Direção.

3. **Documentação Oficial & Governança do Projeto**:
   - Central de documentação normativa e técnica (`PROJETO_CATRACA_DE_TROIA.md`).
   - Monitoramento das metas SMART, indicadores KPIs, detalhamento orçamentário (R$ 291k) e matriz de responsabilidade da equipe.

## 4. Identidade Visual Oficial
- **Conceito**: Intersecção entre os componentes mecânicos da catraca e os vetores de geometria facial biométrica.
- **Paleta Oficial**:
  - **Azul Marinho Tecnológico**: `#0B192C` / `#1E293B` (Solidez e autoridade institucional).
  - **Laranja Vibrante / Alerta**: `#EA580C` / `#F97316` / `#FF6500` (Ação em tempo real e calor humano).

## 5. Diretrizes de Sincronização Contínua
- A pasta `/docs/` armazena os documentos oficiais de especificação (`PROJETO_CATRACA_DE_TROIA.md`). Qualquer novo requisito ou artefato deve ser documentado e refletido fielmente nas interfaces e regras de negócio do sistema.
