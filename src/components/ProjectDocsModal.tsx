import React, { useState } from 'react';
import { 
  FileText, 
  X, 
  Target, 
  DollarSign, 
  Layers, 
  ShieldAlert, 
  Activity, 
  CheckCircle2, 
  Clock, 
  Users, 
  Cpu, 
  Sparkles,
  Building,
  ArrowRight
} from 'lucide-react';

interface ProjectDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectDocsModal: React.FC<ProjectDocsModalProps> = ({ isOpen, onClose }) => {
  const [activeDocTab, setActiveDocTab] = useState<'charter' | 'smart' | 'budget' | 'lifecycle' | 'risks' | 'identity'>('charter');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">Catraca de Tróia • Documentação do Projeto</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded">
                  Rede Pública
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Especificação formal, governança, objetivos SMART, orçamento e ciclo de vida
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 pt-3 pb-2 bg-slate-50 border-b border-slate-200 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveDocTab('charter')}
            className={`px-3 py-2 rounded-lg font-semibold flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeDocTab === 'charter'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Termo de Abertura</span>
          </button>

          <button
            onClick={() => setActiveDocTab('smart')}
            className={`px-3 py-2 rounded-lg font-semibold flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeDocTab === 'smart'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-orange-600" />
            <span>Objetivos SMART</span>
          </button>

          <button
            onClick={() => setActiveDocTab('budget')}
            className={`px-3 py-2 rounded-lg font-semibold flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeDocTab === 'budget'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span>Orçamento & Custos</span>
          </button>

          <button
            onClick={() => setActiveDocTab('lifecycle')}
            className={`px-3 py-2 rounded-lg font-semibold flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeDocTab === 'lifecycle'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-600" />
            <span>Ciclo de Vida (6 Meses)</span>
          </button>

          <button
            onClick={() => setActiveDocTab('risks')}
            className={`px-3 py-2 rounded-lg font-semibold flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeDocTab === 'risks'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Marcos & Riscos</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800 text-sm">
          
          {/* TAB 1: Termo de Abertura / Justificativa */}
          {activeDocTab === 'charter' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-orange-50/80 border border-orange-200/60">
                <h4 className="text-xs font-bold uppercase tracking-wider text-orange-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-orange-600" />
                  Justificativa do Projeto
                </h4>
                <p className="mt-1 text-slate-700 leading-relaxed font-medium">
                  Controle de acesso ineficiente para o registro de entrada e saída de alunos no ensino fundamental da rede pública.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold mb-2">
                    <Target className="w-4 h-4" />
                  </div>
                  <h5 className="font-bold text-slate-900 text-xs">Objetivo Principal</h5>
                  <p className="text-xs text-slate-600 mt-1">
                    Permitir maior transparência aos pais e/ou responsáveis, visualizando em tempo real a passagem dos estudantes.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold mb-2">
                    <Users className="w-4 h-4" />
                  </div>
                  <h5 className="font-bold text-slate-900 text-xs">Público Usuário</h5>
                  <p className="text-xs text-slate-600 mt-1">
                    Gestão escolar (diretoria, coordenação, portaria) e pais ou responsáveis legais dos estudantes matriculados.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-2">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h5 className="font-bold text-slate-900 text-xs">Prazo de Execução</h5>
                  <p className="text-xs text-slate-600 mt-1">
                    6 meses (24 semanas) com capacidade alocada de 2.400 horas técnicas e gerenciais produtivas.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <h5 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-slate-700" />
                  Arquitetura Tecnológica e Recursos
                </h5>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Visão Computacional para Reconhecimento Facial</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Integração física com Catracas e Câmeras</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Python + HTML / CSS / JavaScript / React</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Notificações em tempo real para os responsáveis</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: Objetivos SMART */}
          {activeDocTab === 'smart' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 gap-3">
                
                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    S
                  </div>
                  <div>
                    <h5 className="font-bold text-blue-950 text-xs">Específico (Specific)</h5>
                    <p className="text-xs text-slate-700 mt-1">
                      Desenvolver e implementar uma plataforma de controle de acesso inteligente integrada a hardware (câmeras e catracas) para registrar automaticamente os horários de entrada e saída de alunos, permitindo que pais e responsáveis visualizem esses registros em tempo real.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    M
                  </div>
                  <div>
                    <h5 className="font-bold text-emerald-950 text-xs">Mensurável (Measurable)</h5>
                    <p className="text-xs text-slate-700 mt-1">
                      O sucesso será medido através de indicadores como: taxa de precisão do reconhecimento facial, tempo médio de disponibilidade do sistema (uptime), tempo de resposta nas notificações para os pais e número de registros processados por minuto.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    A
                  </div>
                  <div>
                    <h5 className="font-bold text-amber-950 text-xs">Atingível (Achievable)</h5>
                    <p className="text-xs text-slate-700 mt-1">
                      O projeto dispõe de uma equipe definida (back-end, front-end, design, testes) e utilizará recursos públicos (computadores, servidores, hardware de portaria) e tecnologias estabelecidas (Python, HTML, CSS, JavaScript, visão computacional) para alcançar a entrega.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    R
                  </div>
                  <div>
                    <h5 className="font-bold text-purple-950 text-xs">Relevante (Relevant)</h5>
                    <p className="text-xs text-slate-700 mt-1">
                      O projeto atende à necessidade de modernizar o controle de acesso ineficiente na rede pública e oferece maior transparência e segurança aos pais e responsáveis, além de auxiliar a gestão escolar.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    T
                  </div>
                  <div>
                    <h5 className="font-bold text-rose-950 text-xs">Temporal (Time-bound)</h5>
                    <p className="text-xs text-slate-700 mt-1">
                      O projeto tem um prazo definido de 6 meses para ser concluído, desde o início do planejamento até a implantação e entrega da plataforma funcional.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: Orçamento & Custos */}
          {activeDocTab === 'budget' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* Grand Total Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Orçamento Global do Projeto
                  </span>
                  <h3 className="text-2xl font-extrabold text-white mt-0.5">R$ 291.000,00</h3>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-emerald-400">Recurso Público Previsto</span>
                  <p className="text-[11px] text-slate-300">2.400h Base + Ativos CAPEX</p>
                </div>
              </div>

              {/* Two columns breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Labor */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <h5 className="font-bold text-slate-900 text-xs flex items-center justify-between">
                    <span>1. Mão de Obra (Técnica e Gestão)</span>
                    <span className="text-slate-900 font-extrabold">R$ 276.000,00</span>
                  </h5>
                  <p className="text-[11px] text-slate-500">
                    Equipe de 3 pessoas durante 24 semanas (2.880h totais / 2.400h produtivas).
                  </p>
                  <div className="pt-2 border-t border-slate-200 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-700">
                      <span>Custo Base (2.400h a R$ 100/h)</span>
                      <span className="font-semibold">R$ 240.000,00</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Reserva de Contingência (10%)</span>
                      <span className="font-semibold">R$ 24.000,00</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Reserva Gerencial (5%)</span>
                      <span className="font-semibold">R$ 12.000,00</span>
                    </div>
                  </div>
                </div>

                {/* Hardware CAPEX */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <h5 className="font-bold text-slate-900 text-xs flex items-center justify-between">
                    <span>2. Hardware (Ativos CAPEX)</span>
                    <span className="text-slate-900 font-extrabold">R$ 15.000,00</span>
                  </h5>
                  <p className="text-[11px] text-slate-500">
                    Equipamentos físicos de portaria e servidores de visão computacional.
                  </p>
                  <div className="pt-2 border-t border-slate-200 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-700">
                      <span>Câmeras (Reconhecimento/Segurança)</span>
                      <span className="font-semibold">R$ 2.000,00</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Catracas Eletrônicas (2 unidades)</span>
                      <span className="font-semibold">R$ 8.000,00</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Servidor & Processamento</span>
                      <span className="font-semibold">R$ 5.000,00</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Table of Stages */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Etapa do Projeto</th>
                      <th className="px-4 py-2.5 text-center">Horas Estimadas</th>
                      <th className="px-4 py-2.5 text-right">Custo Estimado (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    <tr>
                      <td className="px-4 py-2 font-medium">Iniciação e Planejamento</td>
                      <td className="px-4 py-2 text-center font-mono">300h</td>
                      <td className="px-4 py-2 text-right font-semibold">R$ 30.000,00</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium">Execução (Desenvolvimento)</td>
                      <td className="px-4 py-2 text-center font-mono">1.200h</td>
                      <td className="px-4 py-2 text-right font-semibold">R$ 120.000,00</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium">Testes e Segurança</td>
                      <td className="px-4 py-2 text-center font-mono">400h</td>
                      <td className="px-4 py-2 text-right font-semibold">R$ 40.000,00</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium">Monitoramento</td>
                      <td className="px-4 py-2 text-center font-mono">300h</td>
                      <td className="px-4 py-2 text-right font-semibold">R$ 30.000,00</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium">Encerramento & Treinamento</td>
                      <td className="px-4 py-2 text-center font-mono">200h</td>
                      <td className="px-4 py-2 text-right font-semibold">R$ 20.000,00</td>
                    </tr>
                    <tr className="bg-slate-50 font-bold text-slate-900">
                      <td className="px-4 py-2.5">Total Base de Mão de Obra</td>
                      <td className="px-4 py-2.5 text-center font-mono">2.400h</td>
                      <td className="px-4 py-2.5 text-right">R$ 240.000,00</td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 4: Ciclo de Vida */}
          {activeDocTab === 'lifecycle' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              <div className="relative border-l-2 border-slate-200 ml-3 pl-6 space-y-6">
                
                <div className="relative">
                  <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow-xs"></div>
                  <h5 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                    <span>1. Iniciação</span>
                    <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold">Problema & Objetivos</span>
                  </h5>
                  <p className="text-xs text-slate-600 mt-1">
                    Definição do problema de controle de acesso ineficiente, objetivos SMART, usuários (gestão escolar e pais/responsáveis).
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-purple-600 border-4 border-white shadow-xs"></div>
                  <h5 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                    <span>2. Planejamento (300h)</span>
                    <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-bold">Requisitos & Prazos</span>
                  </h5>
                  <p className="text-xs text-slate-600 mt-1">
                    Definição de requisitos de sincronização em tempo real, equipe multidisciplinar, prazo de 6 meses e alocação de recursos públicos.
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-orange-600 border-4 border-white shadow-xs"></div>
                  <h5 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                    <span>3. Execução & Desenvolvimento (1.200h + 400h Testes)</span>
                    <span className="text-[10px] px-2 py-0.5 bg-orange-100 text-orange-800 rounded font-bold">Visão Computacional</span>
                  </h5>
                  <p className="text-xs text-slate-600 mt-1">
                    Codificação da plataforma em Python e tecnologias web, implementação de visão computacional para reconhecimento facial, testes de segurança e integração física com catracas/câmeras.
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-emerald-600 border-4 border-white shadow-xs"></div>
                  <h5 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                    <span>4. Monitoramento (300h)</span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">KPIs & Uptime</span>
                  </h5>
                  <p className="text-xs text-slate-600 mt-1">
                    Acompanhamento contínuo da taxa de precisão do reconhecimento facial, disponibilidade (uptime), tempo de resposta nas notificações aos pais e análise de logs.
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-slate-900 border-4 border-white shadow-xs"></div>
                  <h5 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                    <span>5. Encerramento & Treinamento (200h)</span>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-bold">Entrega Final</span>
                  </h5>
                  <p className="text-xs text-slate-600 mt-1">
                    Entrega da plataforma funcional integrada, treinamento aos operadores de portaria e pais, documentação formal e manual de manutenção.
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* TAB 5: Riscos & Mitigações */}
          {activeDocTab === 'risks' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                <div className="p-4 rounded-xl border border-red-200 bg-red-50/40 space-y-2">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Falhas Técnicas no Hardware</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Problemas em câmeras ou catracas mecânicas.
                  </p>
                  <div className="text-[11px] text-slate-700 bg-white/80 p-2 rounded-lg border border-red-100">
                    <strong>Mitigação:</strong> Manutenção preventiva e redundância de métodos (RFID, QR Code, Biometria e Liberação Manual).
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                    <Activity className="w-4 h-4 text-amber-600" />
                    <span>Infraestrutura e Conectividade</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Quedas de conexão à internet ou instabilidade de servidor.
                  </p>
                  <div className="text-[11px] text-slate-700 bg-white/80 p-2 rounded-lg border border-amber-100">
                    <strong>Mitigação:</strong> Armazenamento local em buffer para sincronização assíncrona automática assim que a rede restabelecer.
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2">
                  <div className="flex items-center gap-2 text-purple-800 font-bold text-xs">
                    <Target className="w-4 h-4 text-purple-600" />
                    <span>Segurança da Informação</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Vulnerabilidades ou vazamento de dados pessoais de estudantes.
                  </p>
                  <div className="text-[11px] text-slate-700 bg-white/80 p-2 rounded-lg border border-purple-100">
                    <strong>Mitigação:</strong> Criptografia ponta a ponta, processamento biométrico local seguro e conformidade rigorosa com a LGPD.
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
                  <div className="flex items-center gap-2 text-blue-800 font-bold text-xs">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Adoção e Resistência de Usuários</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Dificuldade de adaptação dos responsáveis ou operadores de portaria.
                  </p>
                  <div className="text-[11px] text-slate-700 bg-white/80 p-2 rounded-lg border border-blue-100">
                    <strong>Mitigação:</strong> Interfaces simplificadas e intuitivas, notificações diretas no WhatsApp e capacitações práticas.
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Arquivo de referência: <code className="font-mono text-slate-700">/docs/PROJETO_CATRACA_DE_TROIA.md</code></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
