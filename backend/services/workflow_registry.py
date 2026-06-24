import os
import json
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from ..database import AsyncSessionLocal
from ..models.workflow import Workflow, WorkflowVersion

WORKFLOWS_DIR = Path(__file__).parent.parent / "workflows"

PRESETS = [
    {
        "id": "preset-cinematic-product",
        "name": "Cinematic Product Commercial",
        "description": "Create luxury product advertisements with studio lighting, cinematic camera movements, premium color grading, macro detail shots, and commercial-quality visuals.",
        "category": "Product Photography",
        "tags": ["Flux Pro", "Imagen", "Veo"],
        "complexity": "Intermediate",
        "estimated_runtime": 45,
        "supported_models": ["Flux Pro", "Imagen", "Veo"],
        "is_featured": True,
        "executions": 12450,
        "success_rate": 98,
        "average_time": 44,
        "rating": 48,
        "bookmarks": 320
    },
    {
        "id": "preset-luxury-fashion",
        "name": "Luxury Fashion Campaign",
        "description": "Generate high-end fashion editorials, magazine covers, runway visuals, brand campaigns, and luxury lifestyle photography.",
        "category": "Fashion Campaigns",
        "tags": ["Flux Pro", "SDXL"],
        "complexity": "Advanced",
        "estimated_runtime": 60,
        "supported_models": ["Flux Pro", "SDXL"],
        "is_featured": True,
        "executions": 8930,
        "success_rate": 95,
        "average_time": 62,
        "rating": 49,
        "bookmarks": 850
    },
    {
        "id": "preset-ai-film-scene",
        "name": "AI Film Scene Creator",
        "description": "Generate complete cinematic scenes with character consistency, dramatic lighting, camera direction, environment design, and storyboard-ready frames.",
        "category": "Cinematic Storytelling",
        "tags": ["Veo", "Kling", "Flux"],
        "complexity": "Expert",
        "estimated_runtime": 90,
        "supported_models": ["Veo", "Kling", "Flux"],
        "is_featured": True,
        "executions": 5420,
        "success_rate": 92,
        "average_time": 95,
        "rating": 47,
        "bookmarks": 1200
    },
    {
        "id": "preset-viral-social-ad",
        "name": "Viral Social Media Ad",
        "description": "Create high-converting Instagram, Facebook, YouTube Shorts, and TikTok advertisements optimized for engagement and performance marketing.",
        "category": "Social Media Ads",
        "tags": ["Flux", "Imagen"],
        "complexity": "Beginner",
        "estimated_runtime": 30,
        "supported_models": ["Flux", "Imagen"],
        "is_featured": False,
        "executions": 45200,
        "success_rate": 99,
        "average_time": 28,
        "rating": 46,
        "bookmarks": 450
    },
    {
        "id": "preset-restaurant-food",
        "name": "Restaurant Food Photography",
        "description": "Generate premium food photography, menu visuals, delivery app images, restaurant branding content, and promotional campaigns.",
        "category": "Product Photography",
        "tags": ["Flux Pro"],
        "complexity": "Beginner",
        "estimated_runtime": 25,
        "supported_models": ["Flux Pro"],
        "is_featured": False,
        "executions": 21000,
        "success_rate": 99,
        "average_time": 24,
        "rating": 48,
        "bookmarks": 210
    },
    {
        "id": "preset-real-estate",
        "name": "Real Estate Showcase",
        "description": "Produce luxury property visuals, architectural photography, lifestyle renders, and cinematic walkthrough keyframes.",
        "category": "Image Generation",
        "tags": ["Flux", "SDXL"],
        "complexity": "Intermediate",
        "estimated_runtime": 45,
        "supported_models": ["Flux", "SDXL"],
        "is_featured": False,
        "executions": 18500,
        "success_rate": 96,
        "average_time": 46,
        "rating": 45,
        "bookmarks": 340
    },
    {
        "id": "preset-character-consistency",
        "name": "Character Consistency Studio",
        "description": "Create reusable characters with consistent facial features, wardrobe, poses, and environments across multiple generations.",
        "category": "Character Creation",
        "tags": ["Flux Pro"],
        "complexity": "Advanced",
        "estimated_runtime": 60,
        "supported_models": ["Flux Pro"],
        "is_featured": True,
        "executions": 32000,
        "success_rate": 91,
        "average_time": 65,
        "rating": 49,
        "bookmarks": 2500
    },
    {
        "id": "preset-fabrics-india",
        "name": "Fabrics of India Storytelling",
        "description": "Generate premium Indian textile storytelling campaigns combining heritage, craftsmanship, culture, fashion, and cinematic visual narratives.",
        "category": "Cinematic Storytelling",
        "tags": ["Flux Pro", "Veo"],
        "complexity": "Advanced",
        "estimated_runtime": 75,
        "supported_models": ["Flux Pro", "Veo"],
        "is_featured": True,
        "executions": 4100,
        "success_rate": 94,
        "average_time": 72,
        "rating": 50,
        "bookmarks": 890
    },
    {
        "id": "preset-luxury-jewellery",
        "name": "Luxury Jewellery Campaign",
        "description": "Create premium jewellery advertisements with elegant lighting, macro shots, luxury styling, premium backgrounds, and fashion editorial aesthetics.",
        "category": "Fashion Campaigns",
        "tags": ["Flux Pro"],
        "complexity": "Intermediate",
        "estimated_runtime": 40,
        "supported_models": ["Flux Pro"],
        "is_featured": False,
        "executions": 7800,
        "success_rate": 97,
        "average_time": 41,
        "rating": 48,
        "bookmarks": 420
    },
    {
        "id": "preset-ai-influencer",
        "name": "AI Influencer Creator",
        "description": "Generate virtual influencer content, lifestyle shoots, branded collaborations, social media assets, and marketing campaigns.",
        "category": "Character Creation",
        "tags": ["Flux Pro"],
        "complexity": "Advanced",
        "estimated_runtime": 50,
        "supported_models": ["Flux Pro"],
        "is_featured": True,
        "executions": 56000,
        "success_rate": 93,
        "average_time": 52,
        "rating": 47,
        "bookmarks": 3100
    },
    {
        "id": "preset-movie-poster",
        "name": "Movie Poster Generator",
        "description": "Create blockbuster movie posters with cinematic composition, dramatic typography placement, key art styling, and premium visual storytelling.",
        "category": "Cinematic Storytelling",
        "tags": ["Flux Pro"],
        "complexity": "Intermediate",
        "estimated_runtime": 35,
        "supported_models": ["Flux Pro"],
        "is_featured": False,
        "executions": 14200,
        "success_rate": 98,
        "average_time": 36,
        "rating": 46,
        "bookmarks": 550
    },
    {
        "id": "preset-multi-agent-ad",
        "name": "Multi-Agent Ad Production Pipeline",
        "description": "Automatically generate concept → script → storyboard → images → video → ad copy → social assets through coordinated AI agents.",
        "category": "Multi-Agent Automation",
        "tags": ["Multiple"],
        "complexity": "Expert",
        "estimated_runtime": 240,
        "supported_models": ["Multiple"],
        "is_featured": True,
        "executions": 2100,
        "success_rate": 88,
        "average_time": 255,
        "rating": 49,
        "bookmarks": 1800
    },
    {
        "id": "preset-dp-studios",
        "name": "DP AI Studios Commercial Engine",
        "description": "End-to-end advertising workflow designed for agencies and brands. Generates creative strategy, key visuals, campaign assets, video concepts, and platform-ready deliverables.",
        "category": "Enterprise Production",
        "tags": ["Multiple"],
        "complexity": "Expert",
        "estimated_runtime": 180,
        "supported_models": ["Multiple"],
        "is_featured": True,
        "executions": 1500,
        "success_rate": 90,
        "average_time": 195,
        "rating": 50,
        "bookmarks": 950
    }
]

def seed_workflows_directory():
    """Seeds the /workflows directory with the preset manifests if missing."""
    os.makedirs(WORKFLOWS_DIR, exist_ok=True)
    
    for preset in PRESETS:
        preset_dir = WORKFLOWS_DIR / preset["id"]
        os.makedirs(preset_dir, exist_ok=True)
        
        manifest_path = preset_dir / "manifest.json"
        if not manifest_path.exists():
            with open(manifest_path, "w") as f:
                json.dump(preset, f, indent=4)
                
        # Mock comfyui json
        workflow_path = preset_dir / "workflow.json"
        if not workflow_path.exists():
            with open(workflow_path, "w") as f:
                json.dump({"nodes": [], "links": []}, f, indent=4)

async def scan_and_register_workflows():
    """Scans the workflows directory and registers any new/updated manifests into the DB."""
    seed_workflows_directory()
    
    async with AsyncSessionLocal() as db:
        for entry in os.scandir(WORKFLOWS_DIR):
            if entry.is_dir():
                manifest_path = Path(entry.path) / "manifest.json"
                if manifest_path.exists():
                    try:
                        with open(manifest_path, "r") as f:
                            data = json.load(f)
                            
                        stmt = select(Workflow).where(Workflow.id == data.get("id"))
                        result = await db.execute(stmt)
                        existing_wf = result.scalar_one_or_none()
                        
                        if existing_wf:
                            # Update metadata
                            existing_wf.name = data.get("name", existing_wf.name)
                            existing_wf.description = data.get("description", existing_wf.description)
                            existing_wf.category = data.get("category", existing_wf.category)
                            existing_wf.tags = data.get("tags", existing_wf.tags)
                            existing_wf.complexity = data.get("complexity", existing_wf.complexity)
                            existing_wf.estimated_runtime = data.get("estimated_runtime", existing_wf.estimated_runtime)
                            existing_wf.supported_models = data.get("supported_models", existing_wf.supported_models)
                            existing_wf.is_featured = data.get("is_featured", existing_wf.is_featured)
                            
                            # Only update stats if we want to override from manifest
                            existing_wf.executions = data.get("executions", existing_wf.executions)
                            existing_wf.success_rate = data.get("success_rate", existing_wf.success_rate)
                            existing_wf.average_time = data.get("average_time", existing_wf.average_time)
                            existing_wf.rating = data.get("rating", existing_wf.rating)
                            existing_wf.bookmarks = data.get("bookmarks", existing_wf.bookmarks)
                        else:
                            # Create new
                            new_wf = Workflow(
                                id=data.get("id"),
                                name=data.get("name"),
                                description=data.get("description"),
                                category=data.get("category", "General"),
                                tags=data.get("tags", []),
                                complexity=data.get("complexity", "Beginner"),
                                estimated_runtime=data.get("estimated_runtime", 30),
                                supported_models=data.get("supported_models", []),
                                is_featured=data.get("is_featured", False),
                                executions=data.get("executions", 0),
                                success_rate=data.get("success_rate", 100),
                                average_time=data.get("average_time", 30),
                                rating=data.get("rating", 50),
                                bookmarks=data.get("bookmarks", 0),
                                author="DP AI Studios"
                            )
                            db.add(new_wf)
                            
                            # Add a default version
                            workflow_path = Path(entry.path) / "workflow.json"
                            comfyui_json = {}
                            if workflow_path.exists():
                                with open(workflow_path, "r") as wf_file:
                                    comfyui_json = json.load(wf_file)
                                    
                            new_version = WorkflowVersion(
                                workflow_id=new_wf.id,
                                version_number=1,
                                comfyui_json=comfyui_json,
                                ui_meta_json={"parameters": [{"key": "prompt", "type": "text", "description": "Generation prompt"}]}
                            )
                            db.add(new_version)
                            
                    except Exception as e:
                        print(f"Failed to process manifest {manifest_path}: {e}")
                        
        await db.commit()
