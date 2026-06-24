import copy
import hashlib
import json
from typing import Dict, Any

class WorkflowExecutionService:
    """
    Handles injecting dynamic parameters into a ComfyUI JSON graph safely.
    """
    
    @staticmethod
    def inject_parameters(comfyui_json: Dict[str, Any], ui_meta_json: Dict[str, Any], validated_params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Takes a raw ComfyUI JSON graph, deepcopies it, and maps validated parameters into the exact nodes.
        Returns the mutated deepcopy.
        """
        # Rule: Never mutate source workflow files. Always work on deepcopy.
        execution_graph = copy.deepcopy(comfyui_json)
        
        defined_params = ui_meta_json.get("parameters", [])
        
        for param_def in defined_params:
            key = param_def.get("key")
            target_node = str(param_def.get("node_id"))
            target_input = param_def.get("input_name")
            
            if not key or not target_node or not target_input:
                continue
                
            if key in validated_params:
                value = validated_params[key]
                if value is not None:
                    # Navigate the graph and inject
                    if target_node in execution_graph:
                        node = execution_graph[target_node]
                        if "inputs" in node:
                            node["inputs"][target_input] = value
                            
        return execution_graph

    @staticmethod
    def hash_snapshot(graph: Dict[str, Any]) -> str:
        """
        Creates a SHA256 hash of the final JSON to guarantee reproducibility tracking.
        """
        serialized = json.dumps(graph, sort_keys=True)
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()
