import React from 'react';
import { WorkflowParameterSchema } from '@/lib/api/workflows';
import { ModelSelector } from './assets/ModelSelector';
import { MultiLoraSelector } from './assets/MultiLoraSelector';
import { 
  VideoResolutionSelector, 
  FPSSelector, 
  DurationSelector, 
  FrameCountSelector, 
  MotionStrengthSlider, 
  VideoModelSelector 
} from './video/VideoComponents';

// Registry of dynamic parameter renderers
const parameterRenderers: Record<string, React.FC<{ param: WorkflowParameterSchema, value: any, onChange: (v: any) => void }>> = {
  text: ({ param, value, onChange }) => (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-white">{param.description || param.key}</label>
      <input 
        type="text" 
        value={value || ''} 
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 bg-black/40 border border-white/10 rounded-md text-white focus:outline-none focus:border-cyan-500 transition-colors"
      />
    </div>
  ),
  textarea: ({ param, value, onChange }) => (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-white">{param.description || param.key}</label>
      <textarea 
        value={value || ''} 
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 bg-black/40 border border-white/10 rounded-md text-white min-h-[100px] focus:outline-none focus:border-cyan-500 transition-colors"
      />
    </div>
  ),
  slider: ({ param, value, onChange }) => (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-white">{param.description || param.key}</label>
        <span className="text-xs text-white/50">{value !== undefined ? value : param.default}</span>
      </div>
      <input 
        type="range" 
        min={param.min || 0} 
        max={param.max || 100} 
        step={param.type === 'slider' ? 0.01 : 1}
        value={value !== undefined ? value : param.default || 0} 
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-cyan-500"
      />
    </div>
  ),
  number: ({ param, value, onChange }) => (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-white">{param.description || param.key}</label>
      <input 
        type="number" 
        min={param.min} 
        max={param.max} 
        value={value !== undefined ? value : param.default || 0} 
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="px-3 py-2 bg-black/40 border border-white/10 rounded-md text-white focus:outline-none focus:border-cyan-500 transition-colors"
      />
    </div>
  ),
  checkbox: ({ param, value, onChange }) => (
    <div className="flex items-center gap-2">
      <input 
        type="checkbox" 
        checked={value !== undefined ? value : param.default || false} 
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-cyan-500"
      />
      <label className="text-sm font-medium text-white">{param.description || param.key}</label>
    </div>
  ),
  dropdown: ({ param, value, onChange }) => (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-white">{param.description || param.key}</label>
      <select 
        value={value || param.default || ''} 
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 bg-black/40 border border-white/10 rounded-md text-white focus:outline-none focus:border-cyan-500 transition-colors"
      >
        {param.options?.map((opt, i) => (
          <option key={i} value={opt} className="bg-gray-900">{opt}</option>
        ))}
      </select>
    </div>
  ),
  // Add stubs for complex types
  image: ({ param }) => <div className="p-4 border border-dashed border-white/20 rounded-md text-sm text-center text-white/50">Image Upload: {param.key}</div>,
  seed: ({ param, value, onChange }) => (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-white">{param.description || param.key}</label>
        <button onClick={() => onChange(Math.floor(Math.random() * 4294967295))} className="text-xs text-cyan-400 hover:text-cyan-300">🎲 Random</button>
      </div>
      <input 
        type="number" 
        value={value !== undefined ? value : param.default || 0} 
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="px-3 py-2 bg-black/40 border border-white/10 rounded-md text-white focus:outline-none focus:border-cyan-500 transition-colors font-mono"
      />
    </div>
  ),
  model_selector: ({ param, value, onChange }) => (
    <ModelSelector param={param} value={value} onChange={onChange} />
  ),
  multi_lora_selector: ({ param, value, onChange }) => (
    <MultiLoraSelector param={param} value={value} onChange={onChange} />
  ),
  lora_selector: ({ param, value, onChange }) => (
    // Single LoRA wrapper using MultiLoraSelector UI for consistency
    <MultiLoraSelector 
      param={param} 
      value={value ? [value] : []} 
      onChange={(arr) => onChange(arr.length > 0 ? arr[0] : undefined)} 
    />
  ),
  video_resolution: ({ param, value, onChange }) => (
    <VideoResolutionSelector param={param} value={value} onChange={onChange} />
  ),
  fps: ({ param, value, onChange }) => (
    <FPSSelector param={param} value={value} onChange={onChange} />
  ),
  duration: ({ param, value, onChange }) => (
    <DurationSelector param={param} value={value} onChange={onChange} />
  ),
  frame_count: ({ param, value, onChange }) => (
    <FrameCountSelector param={param} value={value} onChange={onChange} />
  ),
  motion_strength: ({ param, value, onChange }) => (
    <MotionStrengthSlider param={param} value={value} onChange={onChange} />
  ),
  video_model_selector: ({ param, value, onChange }) => (
    <VideoModelSelector param={param} value={value} onChange={onChange} />
  ),
};

export const DynamicParameterRenderer = ({ 
  parameters, 
  values, 
  onChange 
}: { 
  parameters: WorkflowParameterSchema[], 
  values: Record<string, any>, 
  onChange: (key: string, value: any) => void 
}) => {
  if (!parameters || parameters.length === 0) {
    return <div className="text-sm text-white/50 text-center py-4">No parameters configured for this workflow.</div>;
  }

  // Simple rendering sequence - can be enhanced with grouping later
  return (
    <div className="flex flex-col gap-4">
      {parameters.map((param) => {
        const Renderer = parameterRenderers[param.type] || parameterRenderers.text;
        return (
          <div key={param.key} className="w-full">
            <Renderer 
              param={param} 
              value={values[param.key]} 
              onChange={(val) => onChange(param.key, val)} 
            />
          </div>
        );
      })}
    </div>
  );
};
