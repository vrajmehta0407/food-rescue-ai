"""FoodRescue AI FastAPI Service: Vision, Safety, Matching, Logistics, Impact, Moderation, Chat & Orchestrator."""

import logging
import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.chat.assistant import ChatAskRequest, ChatAskResponse, answer_helper_chat
from app.impact.calculator import ImpactCalculateRequest, ImpactCalculateResponse, calculate_impact
from app.logistics.router import (
    BatchGroup,
    BatchRequest,
    ReassignRequest,
    ReassignResponse,
    RouteRequest,
    RouteResponse,
    batch_nearby_pickups,
    compute_route,
    handle_volunteer_stall,
)
from app.matching.engine import MatchRankRequest, MatchRankResponse, rank_receivers
from app.moderation.trust import ModerationDecision, ModerationInput, evaluate_trust_and_moderation
from app.orchestrator.pipeline import (
    OrchestrateListingRequest,
    OrchestrateListingResponse,
    orchestrate_new_listing,
)
from app.pii import hash_input
from app.safety.engine import (
    SafetyEvaluateRequest,
    SafetyEvaluateResponse,
    evaluate_safety,
    load_safety_rules,
)
from app.vision.adapter import VisionAnalyzeRequest, VisionAnalyzeResponse, analyze_food_photo

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("foodrescue.api")

app = FastAPI(
    title="FoodRescue AI Service",
    version="1.0.0",
    description="Deterministic Food Safety Rules, Impact Calculator, Matching, Logistics, Moderation & Chat.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _log_run(agent_name: str, payload: str, decision: str, started_at: float) -> None:
    latency_ms = int((time.perf_counter() - started_at) * 1000)
    logger.info(
        "agent_run agent=%s input_hash=%s decision=%s latency_ms=%d",
        agent_name,
        hash_input(payload),
        decision,
        latency_ms,
    )


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "foodrescue-api"}


@app.get("/safety/rules")
async def get_safety_rules() -> dict:
    return load_safety_rules()


@app.post("/vision/analyze", response_model=VisionAnalyzeResponse)
async def vision_analyze(req: VisionAnalyzeRequest) -> VisionAnalyzeResponse:
    t0 = time.perf_counter()
    res = await analyze_food_photo(req)
    _log_run("vision_intake", f"{req.filename}:{req.voice_note}", res.category, t0)
    return res


@app.post("/safety/evaluate", response_model=SafetyEvaluateResponse)
async def safety_evaluate(req: SafetyEvaluateRequest) -> SafetyEvaluateResponse:
    t0 = time.perf_counter()
    res = evaluate_safety(req)
    _log_run("food_safety", req.model_dump_json(), res.decision, t0)
    return res


@app.post("/impact/calculate", response_model=ImpactCalculateResponse)
async def impact_calculate(req: ImpactCalculateRequest) -> ImpactCalculateResponse:
    t0 = time.perf_counter()
    res = calculate_impact(req)
    _log_run("impact_calculator", req.model_dump_json(), f"meals={res.meals}", t0)
    return res


@app.post("/matching/rank", response_model=MatchRankResponse)
async def matching_rank(req: MatchRankRequest) -> MatchRankResponse:
    t0 = time.perf_counter()
    res = rank_receivers(req)
    _log_run("matching", f"portions={req.portions}", f"candidates={len(res.matches)}", t0)
    return res


@app.post("/logistics/route", response_model=RouteResponse)
async def logistics_route(req: RouteRequest) -> RouteResponse:
    t0 = time.perf_counter()
    res = await compute_route(req)
    _log_run("logistics_route", req.model_dump_json(), f"km={res.distance_km}", t0)
    return res


@app.post("/logistics/batch", response_model=list[BatchGroup])
async def logistics_batch(req: BatchRequest) -> list[BatchGroup]:
    t0 = time.perf_counter()
    res = batch_nearby_pickups(req)
    _log_run("logistics_batch", f"tasks={len(req.tasks)}", f"batches={len(res)}", t0)
    return res


@app.post("/logistics/reassign", response_model=ReassignResponse)
async def logistics_reassign(req: ReassignRequest) -> ReassignResponse:
    t0 = time.perf_counter()
    res = handle_volunteer_stall(req)
    _log_run("logistics_reassign", req.task_id, res.fallback_mode, t0)
    return res


@app.post("/moderation/evaluate", response_model=ModerationDecision)
async def moderation_evaluate(req: ModerationInput) -> ModerationDecision:
    t0 = time.perf_counter()
    res = evaluate_trust_and_moderation(req)
    _log_run("trust_moderation", req.profile_id, f"escalate={res.escalate_to_admin}", t0)
    return res


@app.post("/chat/ask", response_model=ChatAskResponse)
async def chat_ask(req: ChatAskRequest) -> ChatAskResponse:
    t0 = time.perf_counter()
    res = answer_helper_chat(req)
    _log_run("helper_chat", req.message, ",".join(res.tools_used) or "fallback", t0)
    return res


@app.post("/orchestrator/new-listing", response_model=OrchestrateListingResponse)
async def orchestrator_new_listing(req: OrchestrateListingRequest) -> OrchestrateListingResponse:
    t0 = time.perf_counter()
    res = await orchestrate_new_listing(req)
    _log_run("orchestrator", req.category, res.safety.decision, t0)
    return res
