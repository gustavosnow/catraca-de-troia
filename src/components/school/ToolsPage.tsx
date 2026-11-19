import React, { useState } from 'react';
import {
  Hand,
  QrCode,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { soundManager } from '../../utils/sound';
import type { Student } from '../../types';
import { PageHeader } from '../ui';
import { FaceRecognitionPanel } from './FaceRecognitionPanel';

interface ToolsPageProps {
  onOpenManualRelease: () => void;
  onOpenPresentationAccess: () => void;
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
  onOpenManualRelease,
  onOpenPresentationAccess,
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
        eyebrow="Operação"
        title="Ferramentas"
        description="Passagem assistida, apresentação do portal e o protótipo de reconhecimento facial."
      />

      <div className="space-y-6">
        <section className="card overflow-hidden" aria-labelledby="tools-gate">
          <div className="card-header">
            <div>
              <h2 id="tools-gate" className="card-title">Operação da portaria</h2>
              <p className="card-subtitle">Registro manual quando a câmera não identifica o estudante.</p>
            </div>
          </div>
          <ul className="divide-y divide-line border-t border-line">
            <ToolRow
              icon={Hand}
              title="Passagem assistida"
              description="Registra entrada ou saída com operador e motivo obrigatório. Respeita a sequência do dia."
              action={<button type="button" className="btn btn-primary" onClick={onOpenManualRelease}>Registrar passagem</button>}
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
