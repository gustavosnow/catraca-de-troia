import React, { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  Hand,
  Pause,
  Play,
  QrCode,
  Smartphone,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { soundManager } from '../../utils/sound';
import type { Student } from '../../types';
import { Callout, PageHeader } from '../ui';
import { FaceRecognitionPanel } from './FaceRecognitionPanel';

interface ToolsPageProps {
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onSimulateEntry: () => void;
  onSimulateExit: () => void;
  onOpenManualRelease: () => void;
  onOpenPresentationAccess: () => void;
  onOpenProjectDocs: () => void;
  onSwitchToParentApp: () => void;
  /** Coordenação ou Direção: configuram câmera e gerenciam cadastros faciais. */
  canManageBiometrics: boolean;
  students: Student[];
  isOnline: boolean;
  delivery: React.ReactNode;
}

const ToolRow: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action: React.ReactNode;
}> = ({ icon: Icon, title, description, action }) => (
  <li className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center">
    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-surface text-ink-2">
      <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-0.5 text-[13px] text-muted">{description}</p>
    </div>
    <div className="flex shrink-0 flex-wrap gap-2">{action}</div>
  </li>
);

export const ToolsPage: React.FC<ToolsPageProps> = ({
  isSimulating,
  onToggleSimulation,
  onSimulateEntry,
  onSimulateExit,
  onOpenManualRelease,
  onOpenPresentationAccess,
  onOpenProjectDocs,
  onSwitchToParentApp,
  canManageBiometrics,
  students,
  isOnline,
  delivery,
}) => {
  const [soundOn, setSoundOn] = useState(soundManager.isEnabled());

  const toggleSound = () => {
    const next = !soundOn;
    soundManager.setEnabled(next);
    setSoundOn(next);
  };

  return (
    <>
      <PageHeader
        eyebrow="Demonstração"
        title="Ferramentas"
        description="Recursos para apresentar o piloto. Tudo aqui gera somente eventos fictícios na API local."
      />

      <Callout tone="brand" className="mb-6">
        A simulação e a apresentação geram somente eventos fictícios, sem acionar catracas ou canais externos.
        O protótipo facial abaixo comanda câmeras reais no computador da portaria e continua sem homologação.
      </Callout>

      <div className="space-y-6">
        <section className="card overflow-hidden" aria-labelledby="tools-simulation">
          <div className="card-header">
            <div>
              <h2 id="tools-simulation" className="card-title">Simulação de passagens</h2>
              <p className="card-subtitle">Gere eventos para demonstrar o fluxo da portaria até o portal dos responsáveis.</p>
            </div>
            <span className={`chip ${isSimulating ? 'chip-positive' : 'chip-neutral'}`} role="status">
              <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${isSimulating ? 'bg-positive' : 'bg-subtle'}`} />
              {isSimulating ? 'Fluxo automático ativo' : 'Fluxo pausado'}
            </span>
          </div>
          <ul className="divide-y divide-line border-t border-line">
            <ToolRow
              icon={isSimulating ? Pause : Play}
              title="Fluxo automático"
              description="Registra uma passagem fictícia a cada 9 segundos enquanto estiver ativo."
              action={
                <button type="button" className={`btn ${isSimulating ? 'btn-secondary' : 'btn-primary'}`} onClick={onToggleSimulation} aria-pressed={isSimulating}>
                  {isSimulating ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
                  {isSimulating ? 'Pausar' : 'Iniciar'}
                </button>
              }
            />
            <ToolRow
              icon={ArrowDownLeft}
              title="Passagem pontual"
              description="Registra uma entrada ou saída imediata para o próximo estudante da lista."
              action={
                <>
                  <button type="button" className="btn btn-secondary" onClick={onSimulateEntry}>
                    <ArrowDownLeft aria-hidden="true" />
                    Simular entrada
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={onSimulateExit}>
                    <ArrowUpRight aria-hidden="true" />
                    Simular saída
                  </button>
                </>
              }
            />
            <ToolRow
              icon={Hand}
              title="Passagem assistida"
              description="Registro alternativo com operador e motivo obrigatório."
              action={<button type="button" className="btn btn-secondary" onClick={onOpenManualRelease}>Abrir formulário</button>}
            />
            <ToolRow
              icon={soundOn ? Volume2 : VolumeX}
              title="Sinal sonoro"
              description="Toca um aviso curto quando uma passagem é registrada nesta tela."
              action={
                <button type="button" className="btn btn-secondary" onClick={toggleSound} aria-pressed={soundOn}>
                  {soundOn ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
                  {soundOn ? 'Som ativado' : 'Som desativado'}
                </button>
              }
            />
          </ul>
        </section>

        <section className="card overflow-hidden" aria-labelledby="tools-presentation">
          <div className="card-header">
            <div>
              <h2 id="tools-presentation" className="card-title">Apresentação</h2>
              <p className="card-subtitle">Abra o portal dos responsáveis no celular sem instalar nada.</p>
            </div>
          </div>
          <ul className="divide-y divide-line border-t border-line">
            <ToolRow
              icon={QrCode}
              title="Portal por QR Code"
              description="Gera o link da rede local para abrir o portal no navegador do celular."
              action={<button type="button" className="btn btn-primary" onClick={onOpenPresentationAccess}><QrCode aria-hidden="true" />Gerar QR Code</button>}
            />
            <ToolRow
              icon={Smartphone}
              title="Portal dos responsáveis"
              description="Encerra esta sessão e abre o acesso das famílias neste navegador."
              action={<button type="button" className="btn btn-secondary" onClick={onSwitchToParentApp}>Trocar de acesso</button>}
            />
            <ToolRow
              icon={BookOpen}
              title="Sobre o projeto"
              description="Resumo da demonstração e acesso à documentação oficial."
              action={<button type="button" className="btn btn-secondary" onClick={onOpenProjectDocs}>Abrir documentação</button>}
            />
          </ul>
        </section>

        <FaceRecognitionPanel
          canManageBiometrics={canManageBiometrics}
          students={students}
          isOnline={isOnline}
        />

        {delivery}
      </div>
    </>
  );
};
