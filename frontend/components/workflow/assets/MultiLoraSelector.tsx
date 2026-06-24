import React from 'react';
import { useLoras } from '@/hooks/use-assets';
import { WorkflowParameterSchema } from '@/lib/api/workflows';

interface LoraSelection {
  name: string;
  strength: number;
}

interface MultiLoraSelectorProps {
  param: WorkflowParameterSchema;
  value: LoraSelection[] | undefined;
  onChange: (value: LoraSelection[]) => void;
}

export const MultiLoraSelector: React.FC<MultiLoraSelectorProps> = ({ param, value = [], onChange }) => {
  const { data: loras, isLoading } = useLoras();

  const requiredTags = param.required_tags || [];
  const compatibleLoras = (loras?.data || []).filter(lora => {
    if (requiredTags.length === 0) return true;
    return requiredTags.some(tag => 
      lora.compatibility_tags.map(t => t.toLowerCase()).includes(tag.toLowerCase())
    );
  }) || [];

  const handleAddLora = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const loraName = e.target.value;
    if (!loraName) return;
    
    // Check if already added
    if (value.some(v => v.name === loraName)) return;

    onChange([...value, { name: loraName, strength: 0.8 }]);
    e.target.value = ''; // Reset select
  };

  const handleRemoveLora = (index: number) => {
    const newLoras = [...value];
    newLoras.splice(index, 1);
    onChange(newLoras);
  };

  const handleStrengthChange = (index: number, newStrength: number) => {
    const newLoras = [...value];
    newLoras[index].strength = newStrength;
    onChange(newLoras);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-white flex items-center gap-2">
          {param.description || param.key}
          {requiredTags.length > 0 && (
            <span className="text-[10px] bg-purple-900/50 text-purple-400 px-1.5 py-0.5 rounded uppercase">
              {requiredTags.join(', ')}
            </span>
          )}
        </label>
      </div>

      {/* Selected LoRAs List */}
      <div className="flex flex-col gap-2">
        {value.map((lora, idx) => (
          <div key={`${lora.name}-${idx}`} className="flex flex-col gap-1 p-3 bg-black/40 border border-white/10 rounded-md group">
            <div className="flex justify-between items-center">
              <span className="text-sm text-white truncate max-w-[80%]">{lora.name}</span>
              <button 
                onClick={() => handleRemoveLora(idx)}
                className="text-white/30 hover:text-red-400 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center gap-3">
              <input 
                type="range" 
                min="-2" 
                max="2" 
                step="0.05"
                value={lora.strength}
                onChange={(e) => handleStrengthChange(idx, parseFloat(e.target.value))}
                className="flex-1 accent-purple-500"
              />
              <span className="text-xs text-white/70 font-mono w-8 text-right">{lora.strength.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add LoRA Dropdown */}
      {isLoading ? (
        <div className="px-3 py-2 bg-black/40 border border-white/10 rounded-md text-white/50 text-sm">
          Loading LoRAs...
        </div>
      ) : (
        <select 
          onChange={handleAddLora}
          value=""
          className="px-3 py-2 bg-black/40 border border-white/10 rounded-md text-white focus:outline-none focus:border-purple-500 transition-colors"
        >
          <option value="" disabled className="bg-gray-900 text-white/50">Add a LoRA...</option>
          {compatibleLoras.filter(l => !value.some(v => v.name === l.name)).map((lora) => (
            <option key={lora.id} value={lora.name} className="bg-gray-900">
              {lora.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};
