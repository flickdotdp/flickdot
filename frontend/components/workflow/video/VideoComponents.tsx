import React from 'react';
import { useModels } from '@/hooks/use-assets';
import { WorkflowParameterSchema } from '@/lib/api/workflows';

// -------------------------------------------------------------------------
// Video Resolution Selector
// -------------------------------------------------------------------------
export const VideoResolutionSelector = ({ param, value, onChange }: { param: WorkflowParameterSchema, value: string, onChange: (v: string) => void }) => {
  // Default common video resolutions if none provided
  const options = param.options || [
    "512x512", "512x768", "768x512",
    "720x1280", "1280x720",
    "1080x1920", "1920x1080"
  ];

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-white">{param.description || param.key}</label>
      <select 
        value={value || param.default || options[0]} 
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 bg-black/40 border border-white/10 rounded-md text-white focus:outline-none focus:border-cyan-500 transition-colors"
      >
        {options.map((opt, i) => (
          <option key={i} value={opt} className="bg-gray-900">{opt}</option>
        ))}
      </select>
    </div>
  );
};

// -------------------------------------------------------------------------
// Numeric Selectors (FPS, Duration, Frame Count)
// -------------------------------------------------------------------------
const GenericNumberInput = ({ param, value, onChange, unit }: { param: WorkflowParameterSchema, value: number, onChange: (v: number) => void, unit?: string }) => {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-white flex justify-between">
        <span>{param.description || param.key}</span>
        {unit && <span className="text-xs text-white/50">{value !== undefined ? value : param.default || 0} {unit}</span>}
      </label>
      <input 
        type="number" 
        min={param.min} 
        max={param.max} 
        value={value !== undefined ? value : param.default || 0} 
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="px-3 py-2 bg-black/40 border border-white/10 rounded-md text-white focus:outline-none focus:border-cyan-500 transition-colors"
      />
    </div>
  );
};

export const FPSSelector = ({ param, value, onChange }: any) => <GenericNumberInput param={param} value={value} onChange={onChange} unit="fps" />;
export const DurationSelector = ({ param, value, onChange }: any) => <GenericNumberInput param={param} value={value} onChange={onChange} unit="sec" />;
export const FrameCountSelector = ({ param, value, onChange }: any) => <GenericNumberInput param={param} value={value} onChange={onChange} unit="frames" />;

// -------------------------------------------------------------------------
// Motion Strength Slider
// -------------------------------------------------------------------------
export const MotionStrengthSlider = ({ param, value, onChange }: { param: WorkflowParameterSchema, value: number, onChange: (v: number) => void }) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-white">{param.description || "Motion Strength"}</label>
        <span className="text-xs text-white/50 font-mono">{value !== undefined ? value : param.default || 0.5}</span>
      </div>
      <input 
        type="range" 
        min={param.min !== undefined ? param.min : 0} 
        max={param.max !== undefined ? param.max : 1.0} 
        step={0.05}
        value={value !== undefined ? value : param.default || 0.5} 
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-cyan-500"
      />
    </div>
  );
};

// -------------------------------------------------------------------------
// Video Model Selector
// -------------------------------------------------------------------------
export const VideoModelSelector = ({ param, value, onChange }: { param: WorkflowParameterSchema, value: string, onChange: (v: string) => void }) => {
  const { data: models, isLoading } = useModels();

  // Filter explicitly for video models, and respect any required tags
  const requiredTags = param.required_tags || [];
  const compatibleModels = (models?.data || []).filter(model => {
    // We enforce video_model asset type if it exists, or rely on tags if asset_type isn't cleanly set yet
    if (model.asset_type !== 'video_model' && model.asset_type !== 'checkpoint') return false;
    
    if (requiredTags.length === 0) {
      // Just check if it's explicitly a video model or has typical video tags
      return model.asset_type === 'video_model' || model.compatibility_tags.some(t => ['svd', 'wan', 'hunyuan', 'ltx', 'cogvideo'].includes(t.toLowerCase()));
    }

    return requiredTags.some(tag => 
      model.compatibility_tags.map(t => t.toLowerCase()).includes(tag.toLowerCase())
    );
  }) || [];

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-white flex items-center gap-2">
          {param.description || param.key}
          {requiredTags.length > 0 && (
            <span className="text-[10px] bg-cyan-900/50 text-cyan-400 px-1.5 py-0.5 rounded uppercase">
              {requiredTags.join(', ')}
            </span>
          )}
        </label>
      </div>
      
      {isLoading ? (
        <div className="px-3 py-2 bg-black/40 border border-white/10 rounded-md text-white/50 text-sm">
          Loading video models...
        </div>
      ) : (
        <select 
          value={value || ''} 
          onChange={(e) => onChange(e.target.value)}
          className="px-3 py-2 bg-black/40 border border-white/10 rounded-md text-white focus:outline-none focus:border-cyan-500 transition-colors"
        >
          <option value="" disabled className="bg-gray-900 text-white/50">Select a video model...</option>
          {compatibleModels.map((model) => (
            <option key={model.id} value={model.name} className="bg-gray-900">
              {model.name} ({(model.file_size_bytes / (1024 * 1024 * 1024)).toFixed(2)} GB)
            </option>
          ))}
          {compatibleModels.length === 0 && (
            <option disabled className="bg-gray-900 text-red-400">No compatible video models found</option>
          )}
        </select>
      )}
    </div>
  );
};
