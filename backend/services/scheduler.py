import logging
import random
from typing import List, Optional, Dict, Any

from backend.models.generation import Generation, GenerationType
from backend.models.compute import WorkerNode, GPUDevice

logger = logging.getLogger("scheduler")

class Scheduler:
    """Base interface for GPU assignment algorithms."""
    def select_target(self, generation: Generation, available_workers: List[WorkerNode], available_gpus: List[GPUDevice]) -> Optional[GPUDevice]:
        raise NotImplementedError("Must implement select_target")

class RoundRobinScheduler(Scheduler):
    """Assigns jobs sequentially to distribute load evenly."""
    def __init__(self):
        self.last_index = -1

    def select_target(self, generation: Generation, available_workers: List[WorkerNode], available_gpus: List[GPUDevice]) -> Optional[GPUDevice]:
        if not available_gpus:
            return None
        self.last_index = (self.last_index + 1) % len(available_gpus)
        return available_gpus[self.last_index]

class LeastLoadedScheduler(Scheduler):
    """Prioritizes GPUs with the lowest queue depth and utilization."""
    def select_target(self, generation: Generation, available_workers: List[WorkerNode], available_gpus: List[GPUDevice]) -> Optional[GPUDevice]:
        if not available_gpus:
            return None
        return min(available_gpus, key=lambda g: (g.queue_depth, g.utilization))

class VramAwareScheduler(Scheduler):
    """Strictly prefers GPUs with the highest available VRAM, crucial for video workflows."""
    def select_target(self, generation: Generation, available_workers: List[WorkerNode], available_gpus: List[GPUDevice]) -> Optional[GPUDevice]:
        if not available_gpus:
            return None
        # Maximize (total - used)
        return max(available_gpus, key=lambda g: g.vram_total - g.vram_used)

class CapabilityBasedScheduler(Scheduler):
    """Filters workers by workflow tags before delegating to another scheduler."""
    def __init__(self, fallback_scheduler: Scheduler):
        self.fallback = fallback_scheduler

    def select_target(self, generation: Generation, available_workers: List[WorkerNode], available_gpus: List[GPUDevice]) -> Optional[GPUDevice]:
        # Filter available GPUs based on if their worker supports the required tags
        # In a real scenario, generation would have workflow tags stored. 
        # For simulation, we assume any GPU passed the capability filter beforehand
        # or we just pass it to the fallback
        return self.fallback.select_target(generation, available_workers, available_gpus)

class SchedulerService:
    def __init__(self):
        self.round_robin = RoundRobinScheduler()
        self.least_loaded = LeastLoadedScheduler()
        self.vram_aware = VramAwareScheduler()

    def route_generation(self, generation: Generation, workers: List[WorkerNode], gpus: List[GPUDevice], policy: str = "AUTO") -> Optional[GPUDevice]:
        """
        Orchestrates finding the optimal GPU for a generation.
        """
        if not gpus:
            return None
            
        policy = policy.upper()
        
        # AUTO Logic: Images -> Least Loaded, Video -> VRAM Aware
        if policy == "AUTO":
            if generation.generation_type in [GenerationType.TEXT_TO_VIDEO, GenerationType.IMAGE_TO_VIDEO]:
                policy = "VRAM_AWARE"
            else:
                policy = "LEAST_LOADED"
                
        if policy == "ROUND_ROBIN":
            return self.round_robin.select_target(generation, workers, gpus)
        elif policy == "VRAM_AWARE":
            return self.vram_aware.select_target(generation, workers, gpus)
        elif policy == "LEAST_LOADED":
            return self.least_loaded.select_target(generation, workers, gpus)
        
        # Fallback
        return self.least_loaded.select_target(generation, workers, gpus)
