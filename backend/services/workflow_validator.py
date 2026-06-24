from typing import Dict, Any, List

class WorkflowValidator:
    """
    Validates dynamic parameters against the workflow's ui_meta_json definition.
    """
    @staticmethod
    def validate_parameters(ui_meta_json: Dict[str, Any], parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates incoming parameters against the schema defined in ui_meta_json.
        Returns the validated parameters with defaults applied where necessary.
        Raises ValueError if validation fails.
        """
        validated = {}
        defined_params: List[Dict[str, Any]] = ui_meta_json.get("parameters", [])
        
        for param_def in defined_params:
            key = param_def.get("key")
            if not key:
                continue
                
            is_required = param_def.get("required", False)
            default_value = param_def.get("default")
            param_type = param_def.get("type", "string")
            
            value = parameters.get(key)
            
            if value is None:
                if is_required and default_value is None:
                    raise ValueError(f"Missing required parameter: {key}")
                value = default_value
                
            if value is not None:
                # Type validation
                if param_type == "slider" or param_type == "number":
                    try:
                        value = float(value)
                    except ValueError:
                        raise ValueError(f"Parameter {key} must be a number.")
                        
                    min_val = param_def.get("min")
                    max_val = param_def.get("max")
                    if min_val is not None and value < min_val:
                        raise ValueError(f"Parameter {key} must be >= {min_val}")
                    if max_val is not None and value > max_val:
                        raise ValueError(f"Parameter {key} must be <= {max_val}")
                        
                elif param_type == "select" or param_type == "dropdown":
                    options = param_def.get("options", [])
                    if options and value not in options:
                        raise ValueError(f"Parameter {key} must be one of {options}")
                        
                elif param_type == "boolean":
                    if not isinstance(value, bool):
                        if str(value).lower() in ["true", "1"]:
                            value = True
                        elif str(value).lower() in ["false", "0"]:
                            value = False
                        else:
                            raise ValueError(f"Parameter {key} must be a boolean")
                            
            validated[key] = value
            
        return validated
