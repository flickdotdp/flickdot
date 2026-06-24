import React from 'react';
import { useModels } from '@/hooks/use-assets';
import { WorkflowParameterSchema } from '@/lib/api/workflows';

interface ModelSelectorProps {
  param: WorkflowParameterSchema;
  value: string | undefined;
  onChange: (value: string) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ param, value, onChange }) => {
  const { data: models, isLoading } = useModels();

  // Basic compatibility filtering based on required_tags
  const requiredTags = param.required_tags || [];
  const compatibleModels = (models?.data || []).filter(model => {
    if (requiredTags.length === 0) return true;
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
          Loading models...
        </div>
      ) : (
        <select 
          value={value || ''} 
          onChange={(e) => onChange(e.target.value)}
          className="px-3 py-2 bg-black/40 border border-white/10 rounded-md text-white focus:outline-none focus:border-cyan-500 transition-colors"
        >
          <option value="" disabled className="bg-gray-900 text-white/50">Select a model...</option>
          {compatibleModels.map((model) => (
            <option key={model.id} value={model.name} className="bg-gray-900">
              {model.name} ({(model.file_size_bytes / (1024 * 1024 * 1024)).toFixed(2)} GB)
            </option>
          ))}
          {compatibleModels.length === 0 && (
            <option disabled className="bg-gray-900 text-red-400">No compatible models found</option>
          )}
        </select>
      )}
    </div>
  );
};
