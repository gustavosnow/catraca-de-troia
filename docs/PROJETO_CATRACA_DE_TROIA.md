# Projeto: Catraca de Tróia – Controle de Acesso Inteligente

## 1. Justificativa
Controle de acesso ineficiente para o registro de entrada e saída de alunos no ensino fundamental da rede pública de ensino.

---

## 2. Objetivos SMART

* **S (Específico)**: Desenvolver e implementar uma plataforma de controle de acesso inteligente integrada a hardware (câmeras e catracas) para registrar automaticamente os horários de entrada e saída de alunos, permitindo que pais e responsáveis visualizem esses registros em tempo real.
* **M (Mensurável)**: O sucesso será medido através de indicadores como:
  - Taxa de precisão do reconhecimento facial;
  - Tempo médio de disponibilidade do sistema (uptime);
  - Tempo de resposta nas notificações para os pais;
  - Número de registros processados por minuto.
* **A (Atingível)**: O projeto dispõe de uma equipe definida (back-end, front-end, design, testes) e utilizará recursos públicos (computadores, servidores, hardware de portaria) e tecnologias estabelecidas (Python, HTML, CSS, JavaScript, visão computacional) para alcançar a entrega.
* **R (Relevante)**: O projeto atende à necessidade de modernizar o controle de acesso ineficiente na rede pública e oferece maior transparência e segurança aos pais e responsáveis, além de auxiliar a gestão escolar.
* **T (Temporal)**: O projeto tem um prazo definido de 6 meses para ser concluído, desde o início do planejamento até a implantação e entrega da plataforma funcional.

---

## 3. Orçamento Preliminar

### 3.1. Estimativa de Mão de Obra (Técnica e Gestão)
Baseado em uma equipe de 3 pessoas trabalhando durante 24 semanas (2.880h de capacidade total, com 2.400h alocadas produtivamente para o projeto):
* **Custo Base (2.400h estimadas a R$ 100,00/h)**: R$ 240.000,00
* **Reserva de Contingência (10%)**: R$ 24.000,00
* **Reserva Gerencial (5%)**: R$ 12.000,00
* **Subtotal Mão de Obra**: R$ 276.000,00

### 3.2. Estimativa de Hardware (Investimento em Ativos - CAPEX)
* **Câmeras (Reconhecimento/Segurança)**: R$ 2.000,00
* **Catracas Eletrônicas (2 unidades)**: R$ 8.000,00
* **Servidor/Infraestrutura de Processamento**: R$ 5.000,00
* **Subtotal Hardware**: R$ 15.000,00

### 3.3. Orçamento Global Consolidado
**Total Geral do Projeto**: **R$ 291.000,00**

---

## 4. Distribuição de Horas e Custos por Etapa

| Etapa do Projeto | Horas Estimadas | Custo Estimado (R$) |
| :--- | :--- | :--- |
| **Iniciação e Planejamento** | 300h | R$ 30.000,00 |
| **Execução** | 1.200h | R$ 120.000,00 |
| **Testes e Segurança** | 400h | R$ 40.000,00 |
| **Monitoramento** | 300h | R$ 30.000,00 |
| **Encerramento** | 200h | R$ 20.000,00 |
| **Total (Base)** | **2.400h** | **R$ 240.000,00** |

---

## 5. Etapas do Ciclo de Vida do Projeto

### 5.1. Iniciação
* **Problema**: Controle de acesso para o registro de entrada e saída de alunos no ensino fundamental da rede pública.
* **Objetivo**: Permitir maior transparência aos pais e/ou responsáveis de alunos, que poderão visualizar, por meio de uma plataforma, os horários de entrada e saída do(s) aluno(s) sob sua custódia.
* **Usuários**: Gestão escolar (diretoria, coordenação, portaria) e pais e/ou responsáveis dos alunos.

### 5.2. Planejamento
* **Requisitos**: Sincronização em tempo real dos registros; registrar entradas e saídas de aluno com nome, dia e horário, responsável (caso haja); painel contendo histórico dos registros; quadro de avisos com justificativas declaradas pela gestão escolar.
* **Equipe**: Time de desenvolvimento com funções bem definidas (back-end, front-end, design, testes).
* **Prazo**: 6 meses (24 semanas).
* **Recursos**: Recursos oriundos do investimento público (computadores, servidores, câmeras, catracas para representar a portaria, profissionais de TI).

### 5.3. Execução
* **Desenvolvimento**: VS Code como IDE; uso de Python, integrado com HTML, CSS e JavaScript; visão computacional.
* **Testes**: Testes de segurança/autenticação para evitar vazamento de dados; testes de integração para verificar se a sincronização dos registros ocorre como esperado; teste de carga.
* **Implantação**: Plataforma integrada com a portaria construída, cujo funcionamento ocorre por meio da inteligência computacional para o reconhecimento de pessoas; servidor configurado com a plataforma on-line e operante.

### 5.4. Monitoramento
* **Indicadores (KPIs)**:
  - Taxa de precisão do reconhecimento facial;
  - Tempo médio de disponibilidade do sistema (uptime);
  - Tempo de resposta na notificação para os pais;
  - Número de registros processados por minuto.
* **Riscos**: Falhas técnicas no hardware (câmera/catraca); quedas de conexão ou servidor; vulnerabilidades de segurança; resistência de usuários.
* **Acompanhamento**: Reuniões quinzenais de status; análise semanal dos logs de sistema; feedback contínuo dos usuários.

### 5.5. Encerramento
* **Entrega**: Encerramento do desenvolvimento e entrega da plataforma funcional integrada a câmeras e catracas, pronta para comportar o cadastro de pais e gestores escolares.
* **Treinamento**: Orientações para o cadastro e acompanhamento por parte dos usuários.
* **Documentação**: Registro formal do desenvolvimento do projeto, contendo prazos, pessoas envolvidas e recursos utilizados, além de manual de utilização e manutenção.

---

## 6. Marcos do Projeto
1. **Planejamento**: Definição de requisitos e alocação de equipe.
2. **Desenvolvimento**: Codificação da plataforma (Python, HTML, CSS, JavaScript) e implementação da visão computacional.
3. **Testes**: Validação de segurança, autenticação, integração e testes de carga.
4. **Implantação**: Integração da plataforma com o hardware (câmeras/catracas) e servidor configurado.
5. **Encerramento**: Entrega da plataforma funcional, treinamento de usuários e documentação (manual de uso e manutenção).

---

## 7. Matriz de Riscos e Mitigações

| Risco Identificado | Categoria | Impacto | Estratégia de Mitigação |
| :--- | :--- | :--- | :--- |
| **Falhas Técnicas** | Hardware | Alto | Manutenção preventiva das catracas e câmeras; múltiplos métodos de contingência (RFID, QR Code, Biometria, Liberação Manual). |
| **Infraestrutura** | Redes / Servidor | Médio-Alto | Arquitetura com buffer offline local e reconexão automática com a nuvem; monitoramento de Uptime. |
| **Segurança** | Dados / LGPD | Crítico | Criptografia ponta a ponta, dados biométricos processados localmente e trilhas de auditoria protegidas. |
| **Adoção** | Usuários | Médio | Interface intuitiva com onboarding para pais, notificações diretas via WhatsApp/App e treinamentos práticos para a portaria. |

---

## 8. Identidade Visual
* **Conceito**: Linhas de conexão entre o hardware físico (catraca giratória de acesso) e os pontos biométricos de visão computacional (reconhecimento facial).
* **Paleta de Cores Oficial**:
  - **Azul Marinho Tecnológico**: `#0B192C` / `#1E293B` (Representa solidez, segurança e estabilidade pública).
  - **Laranja Vibrante / Ação**: `#EA580C` / `#F97316` / `#FF6500` (Representa energia, calor humano e alertas em tempo real).
  - **Neutros de Suporte**: `#F8FAFC` (Slate Claro) e `#FFFFFF`.
