from pathlib import Path
import os


def find_repo_root() -> Path:
    """Locate the repository root containing packages/safety-rules."""
    current = Path(__file__).resolve()
    for parent in current.parents:
        if (parent / "packages" / "safety-rules").exists():
            return parent
    return Path.cwd()


REPO_ROOT = find_repo_root()


def _load_dotenv() -> None:
    env_file = REPO_ROOT / ".env"
    if not env_file.exists():
        return
    for raw_line in env_file.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, val = line.split("=", 1)
        key = key.strip()
        val = val.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = val


_load_dotenv()

SAFETY_RULES_PATH = Path(
    os.getenv(
        "SAFETY_RULES_PATH",
        str(REPO_ROOT / "packages" / "safety-rules" / "safety_rules.json"),
    )
)
IMPACT_FACTORS_PATH = Path(
    os.getenv(
        "IMPACT_FACTORS_PATH",
        str(REPO_ROOT / "packages" / "safety-rules" / "impact_factors.json"),
    )
)

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "mock").lower()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemini-3.1-flash-lite")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
VISION_TIMEOUT_SECONDS = 20.0
AGENT_TIMEOUT_SECONDS = 8.0
