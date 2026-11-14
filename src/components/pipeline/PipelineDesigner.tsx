import React, { useState } from 'react';
import { usePaymentHub } from '../../context/PaymentHubContext';
import { PaymentPipeline, PipelineStageConfig } from '../../types/payment';
import { 
  GitFork, 
  Settings2, 
  Play, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  ArrowDown, 
  Layers, 
  Check, 
  X,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export const PipelineDesigner: React.FC = () => {
  const { pipelines, updatePipeline, showToast, runScenario } = usePaymentHub();
  const [selectedPipelineId, setSelectedPipelineId] = useState(pipelines[0].id);
  const [selectedStage, setSelectedStage] = useState<PipelineStageConfig | null>(pipelines[0].stages[0]);
  const [testResult, setTestResult] = useState<string | null>(null);

  const activePipeline = pipelines.find(p => p.id === selectedPipelineId) || pipelines[0];

  const handleToggleStage = (stageId: string) => {
    const updatedStages = activePipeline.stages.map(st => 
      st.id === stageId ? { ...st, enabled: !st.enabled } : st
    );
    updatePipeline(activePipeline.id, { stages: updatedStages });
  };

  const handleTestPipeline = () => {
    setTestResult('Running sandbox verification across enabled stages...');
    setTimeout(() => {
      setTestResult(`Pipeline ${activePipeline.name} (v${activePipeline.version}) passed sandbox execution: Ingestion -> Schema OK -> AMC SSI matched -> 5 Controls passed -> Transformed -> Route: SWIFT BOX -> ACK & Settlement simulated.`);
      showToast('Pipeline execution test completed successfully', 'success');
    }, 800);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Payment Pipeline Visual Designer
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure multi-stage payment orchestration pipelines, enrichment rules, controls, and message transformations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTestPipeline}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>Test Pipeline Execution</span>
          </button>
        </div>
      </div>

      {/* Pipeline Selector Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500">Active Pipeline:</span>
          <div className="flex items-center gap-2">
            {pipelines.map(pipe => (
              <button
                key={pipe.id}
                onClick={() => {
                  setSelectedPipelineId(pipe.id);
                  setSelectedStage(pipe.stages[0]);
                  setTestResult(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  pipe.id === selectedPipelineId
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {pipe.name} (v{pipe.version})
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-500 font-sans">Status:</span>
          <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
            {activePipeline.status}
          </span>
          <span className="text-slate-500 font-sans">Source:</span>
          <span className="text-slate-800 dark:text-slate-200 font-semibold">{activePipeline.sourceSystem}</span>
        </div>
      </div>

      {/* Test Execution Output Banner */}
      {testResult && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{testResult}</span>
          </div>
          <button onClick={() => setTestResult(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Designer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Visual Pipeline Stages Flow */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Pipeline Stages Architecture ({activePipeline.stages.length} Stages)</span>
            </h2>
            <span className="text-xs text-slate-400">Click stage to configure</span>
          </div>

          <div className="space-y-2">
            {activePipeline.stages.map((stage, idx) => {
              const isSelected = selectedStage?.id === stage.id;
              return (
                <div key={stage.id} className="relative">
                  <div
                    onClick={() => setSelectedStage(stage)}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between text-xs ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-[11px] ${
                        stage.enabled
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}>
                        {stage.order}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {stage.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {stage.description}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStage(stage.id);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                          stage.enabled
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {stage.enabled ? 'Enabled' : 'Bypassed'}
                      </button>
                    </div>
                  </div>

                  {idx < activePipeline.stages.length - 1 && (
                    <div className="flex justify-center py-1">
                      <ArrowDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Stage Configuration Panel */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-blue-600" />
              <span>Stage Configuration</span>
            </h2>
            {selectedStage && (
              <span className="font-mono text-xs text-slate-400">{selectedStage.id}</span>
            )}
          </div>

          {selectedStage ? (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Stage Name</label>
                <input
                  type="text"
                  value={selectedStage.name}
                  disabled
                  className="w-full p-2 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Description</label>
                <textarea
                  value={selectedStage.description}
                  disabled
                  rows={2}
                  className="w-full p-2 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-2">Stage Parameters (JSON)</label>
                <pre className="p-3 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded border border-slate-800 overflow-x-auto">
                  {JSON.stringify(selectedStage.config, null, 2)}
                </pre>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-semibold text-slate-800 dark:text-slate-200">Execution Properties</div>
                <div className="text-[11px] text-slate-500 space-y-1">
                  <div>· Execution Order: {selectedStage.order}</div>
                  <div>· Failure Behavior: Route to Exception Workbench</div>
                  <div>· Circuit Breaker: Trip on 3 consecutive timeouts</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggleStage(selectedStage.id)}
                className={`w-full py-2 px-4 rounded font-semibold text-xs transition-colors ${
                  selectedStage.enabled
                    ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {selectedStage.enabled ? 'Bypass Stage for Testing' : 'Enable Stage in Flow'}
              </button>
            </div>
          ) : (
            <div className="text-slate-400 text-center py-12">
              Select a stage from the visual flowchart to view configuration.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
