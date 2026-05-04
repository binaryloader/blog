---
title: "[Agent] korea-persona-interview, a Korean Synthetic Persona Interview Tool Powered by CLI / MCP"
ref: korea-persona-interview
excerpt: "A writeup of korea-persona-interview, a side project that automates Korean synthetic persona interviews. It layers multi-turn interviews, automatic follow-ups, and persona drift detection on top of NVIDIA's Nemotron-Personas-Korea dataset to validate business hypotheses quickly. The post also covers the design pattern that lets three entry points (CLI / MCP server / MCP orchestrator) share a single core."
date: 2026-05-03T00:00+09:00
last_modified_at: 2026-05-04T19:26+09:00
published: true
lang: en
permalink: /en/:categories/:title/
header:
  overlay_image: "/assets/image/thumbnail/header/korea-persona-interview.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/korea-persona-interview.png"
categories:
  - Development
  - AI
  - Agent
tags:
  - Agent
  - LLM
  - MCP
  - OpenAI
  - Anthropic
  - MLX
  - Korean Persona
  - Nemotron
  - User Research
  - Side Project
  - Python
depth:
  - title: "Development"
    url: /en/development/
  - title: "AI"
    url: /en/development/ai/
  - title: "Agent"
    url: /en/development/ai/agent/
credits:
  planning: Claude
  research: Claude
  drafting: Claude
  editing: Claude
  review: [Claude, binaryloader]
  translation: Claude
  thumbnail: Claude
  publishing: Claude
---

# Overview

This post is a writeup of korea-persona-interview, a side project that automates Korean synthetic persona interviews. It layers multi-turn interviews, automatic follow-ups, and persona drift detection on top of NVIDIA's Nemotron-Personas-Korea dataset to validate business hypotheses quickly. The post also covers the design pattern that lets three entry points (CLI / MCP server / MCP orchestrator) share a single core.

# Summary

## 1. Why I built this side project

The most demanding step in validating a business hypothesis is the user interview. Recruiting participants, scheduling, the interview itself, and post-processing the answers into a form that informs decisions all add up to several days lost per hypothesis. So I needed a synthetic persona tool to act as a first-pass hypothesis filter before committing to real interviews. The intent is not to replace real people. It is to narrow down which hypotheses are worth taking into a real interview.

You can find toy scripts on GitHub that drop a persona description into one LLM's system prompt and ask N people the same question. But because this tool is built for hypothesis validation, I needed mechanisms to constrain both persona diversity and answer quality, quantitatively and qualitatively. Persona distribution is balanced statistically, and answers go through automatic detection of persona drift and ambiguous responses, which then trigger follow-up questions.

## 2. One-line definition and overall flow

In one sentence: it asks N Korean synthetic personas your business-idea questions and returns a quantitative and qualitative report. The user writes a one-liner about the business idea and roughly five questions in a yaml file, then runs both the interview and the report generation with a single CLI command.

The overall flow is as follows.

- Narrow the persona dataset with a filter DSL and seed-locked sampling of N personas
- Ask each persona five questions in multi-turn fashion, with one automatic follow-up triggered for short or ambiguous answers
- After the interview ends, make a separate single-turn call to convert the answers into a structured summary JSON
- Aggregate every persona's responses and emit a markdown report with quantitative scores, price intent, and per-cohort distributions

The artifacts land in `outputs/interview_{slug}_{timestamp}.json` with each persona's messages and raw responses preserved as-is, and a human-readable markdown report sits in the same directory. Every turn, retry, and token-usage figure for a single interview lives in the JSON, which makes it easy to feed intermediate results into other analysis scripts.

## 3. Persona data - NVIDIA Nemotron-Personas-Korea

### 3.1. Dataset structure and columns

The persona source is NVIDIA's Nemotron-Personas-Korea dataset, released on 2026-04-20. The license is CC BY 4.0, so anyone can use it freely as long as they keep the attribution. People often shorthand the size as one million personas, but more precisely it is one million records. Each record carries seven free-form persona columns (professional, sports, arts, travel, culinary, family, persona), which sums to roughly seven million personas. This tool treats one record as one synthetic person.

The core columns are about eleven demographic fields plus the seven free-form persona columns. The demographic axes - gender, age (19-99), marital status, military service, household type (`family_type` has 39 variants), housing type (six types), education (seven levels), major, occupation, district (252+ variants), and province (17 types) - are the primary attributes. There is also a country column, but since this dataset only has Korea as the value, it is not used in filtering. The free-form `persona` column writes out an individual's tendencies and everyday tone in natural language, which is a great fit for direct injection into a system prompt.

### 3.2. Cohort filtering and sampling

The tool can keep the entire dataset in memory, but most hypotheses target a specific cohort (for example, single-person households of office workers in their thirties living in Seoul). So I introduced a filter DSL that narrows the sample with a single line like `--filter "age:25-39,region:서울특별시,gender:F,occupation_keyword:개발자"`. `parse_filter` in `src/load_personas.py` parses it with the rule of OR within the same key and AND across different keys, and `load_and_sample` selects N personas using a seed-locked `random.Random(seed).sample`.

The seed lock exists so that re-running the same hypothesis pulls the same personas, making result comparisons meaningful. If you swap the provider from OpenAI to Anthropic and the personas differ, you cannot tell whether the answer differences come from the model change or the persona change.

## 4. Interview flow design

### 4.1. Multi-turn plus a post-interview single-turn structured summary

How to bundle the questions for sending was the heaviest decision in the tool design. ADR-001 compares three candidates in a tradeoff table.

- Candidate A is multi-turn. Each question goes one turn at a time and accumulates in the messages history. When the interview ends, a separate system prompt feeds the entire messages into the same model to produce a structured JSON summary in a single turn
- Candidate B is single-turn bundled. It bundles N questions into one request, and the model returns every answer in one response as free-form text plus JSON
- Candidate C is the same as B in that all answers come in one response, but it generates qualitative insights through a separate single-turn call

Candidate A costs roughly 1.8 to 2.5 times more in tokens and time, but it can isolate automatic follow-ups and persona-drift detection at the per-answer level. The decisive factor is that even if one answer gets contaminated, the other four can still be salvaged. Candidates B and C mix all the answers into a single response, so per-answer isolation is fundamentally hard. Since the core guardrails of this tool are follow-up and drift detection, B and C are simply incompatible.

The detailed policy keeps the system message at `messages[0]` without truncation, and once accumulated tokens exceed `llm.context_budget` (default 32000), the oldest user/assistant pair (excluding the system message) is removed first. When truncation fires, the record's `flags.truncated=true` is set. Token estimation uses a heuristic of 1 character of Korean = 1, 1 character of English = 0.25, and other characters = 0.5, which gives a consistent trigger using only the standard library, without an actual tokenizer.

### 4.2. Automatic follow-up - detecting short answers and ambiguous keywords

`should_auto_follow_up` in `src/interview.py` decides whether to follow up on two axes: answer length and ambiguous keywords. If the character count after stripping whitespace falls below the threshold (`heuristics.short_answer_threshold`, default 20 characters), it returns True. Otherwise, it checks whether any of the six evasive expressions defined in `heuristics.ambiguous_keywords` ("글쎄요" (well...), "잘 모르겠습니다" / "잘 모르겠어요" (I'm not sure), "딱히" (not really), "별로 생각 안 해봤" (haven't thought about it much), "모르겠" (don't know)) appears as a substring. If either fires, one more follow-up question is sent in the same turn flow.

Limiting follow-ups to one round was a deliberate choice for two reasons. First, if you keep firing follow-ups indefinitely, the persona drifts toward the model's base voice during the interview. Second, if tokens and time vary unevenly across personas, cost estimation breaks down. A single follow-up is enough to fortify short answers while keeping cost variance within a predictable range.

### 4.3. Persona drift detection - heuristics for drift and refusal

`detect_persona_drift` checks whether the response contradicts the persona's demographics head-on. The detection axes are five: English ratio, age contradiction, gender contradiction, region contradiction, and housing-type contradiction. The English-ratio threshold (default 0.30) is computed at the word level. If you go by characters, a four-letter English word mixed into a Korean sentence rarely crosses the threshold, which causes false negatives to balloon. At the word level, English-heavy responses like "I think this is solo" get caught reliably.

More time went into reducing false positives. Demographic contradictions are checked only inside a 30-character window around self-assertion contexts like "저는" (I), "나는" (I), "제가" (I), "내가" (I). The housing-type axis matches only first-person subject + housing-verb precise regex within the same sentence. Third-person generalizations like "혼자 사시는 분들" (people who live alone), behavioral expressions like "혼자서 끼니를 해결" (handling meals on my own), and product-keyword artifacts like "1인 가구용" (for single-person households) accidentally appearing in the response are excluded from triggers. A negative assertion like "1인 가구가 아니라서" (because I am not a single-person household) from a persona living with family is a coherent answer, so it is not flagged as drift.

There is also a whitelist for English-language occupation names. When personas like "IT 컨설턴트" (IT consultant) or "UX 디자이너" (UX designer) naturally mention their own occupation in English, those tokens are removed from both the numerator and denominator of the English ratio to block false positives. `_occupation_english_tokens` extracts English tokens from the persona's `occupation` field as lowercase and returns a frozenset.

### 4.4. Single builder for the system prompt

The system prompt is enforced through a single builder so that all three entry points share the same first-person persona guardrails. `build_system_prompt` in `src/interview.py:399` is that entry point. It always injects seven demographic fields and a free-form `persona` summary, and if any of the toggle keywords - professional, sports, arts, travel, culinary, family - is enabled, it pulls the corresponding free-form column from the raw record and appends it.

The template itself is split out into `prompts/system_prompt.txt`. Only two placeholders, `{persona_json}` and `{product}`, are substituted via `str.format`, and the static prefix stays intact. This structure plays well with OpenAI's automatic prompt caching. Repeated calls against the same template reuse the prefix, which earns a partial discount on input tokens. See section 5.2 for the detailed numbers.

The reason `family_type` and `housing_type` are explicitly exposed in the system prompt is to block one regression. Without those two fields, the model tends to fill in single-person-household status and housing type from inference, which makes the persona wobble at random. If the raw record has values, they go in as-is; if not, the prompt simply omits them.

## 5. Multi-provider LLM backend

### 5.1. OpenAI / Anthropic / local OpenAI-compatible servers

The LLM backend is abstracted behind an `LLMBackend` Protocol. The implementations are `OpenAIBackend` and `AnthropicBackend`. The provider toggle is determined by `LlmConfig.provider`. `provider=openai` (default) handles OpenAI Chat Completions and OpenAI-compatible endpoints like mlx_lm.server, vLLM, and llama.cpp. Pointing `base_url` at `http://localhost:PORT/v1` plugs straight into a local server. `provider=anthropic` calls the Anthropic Messages API directly.

Both the official `openai` and `anthropic` packages were dropped from the dependencies, and httpx makes the calls directly. It is easier to standardize retry, timeout, and logging policy in one module, and the transitive dependency tree shrinks. The Anthropic Messages API has a different shape from OpenAI Chat Completions. It uses a top-level `system` field, requires the `x-api-key` header, and `max_tokens` is mandatory. Branching on base_url alone is not stable enough, so the adapters are split.

### 5.2. Leveraging prompt caching

OpenAI's prompt caching is automatic. No extra annotation in client code is required. That said, the prefix must be at least 1024 tokens for the cache to activate, and beyond that the cache prefix grows in 128-token increments. Matching only counts as a hit on exact prefix match, so the system prompt + persona reinforcement at `messages[0]` must come before the variable parts (the question and accumulated answers). This tool always keeps system at messages[0], so multi-turn calls within one persona naturally produce repeated prefixes.

Anthropic's prompt caching is not automatic - it requires explicit `cache_control` markers. You annotate at the block or request level, with up to four breakpoints per request. The minimum prefix length also varies by model. Sonnet 4.5 / Opus 4.1 / Sonnet 3.7 require 1024 tokens, Sonnet 4.6 requires 2048, and Opus 4.7 / 4.6 / 4.5 plus Haiku 4.5 require 4096 tokens. The default TTL is 5 minutes, and you can opt for 1 hour with `cache_control.ttl: "1h"`. Pricing multipliers are 1.25x base input for a 5-minute cache write, 2x for a 1-hour write, and 0.1x for cache reads. This tool's `AnthropicBackend` puts a `cache_control: ephemeral` marker on the system block.

Because the two providers behave differently, the impact on this tool also differs. On the OpenAI side, simply isolating the prefix is enough to gain the benefit. On the Anthropic side, the `cache_control` markers must be placed precisely, and the next call has to arrive within the 5-minute TTL for the read to activate. Running 100 personas with concurrency 4 means the same prefix repeats within 5 minutes often enough for the read hit rate to climb meaningfully.

### 5.3. Cost and time tradeoffs

The processing-performance SLO is to finish one 100-persona interview in 5-10 minutes on the v1.x baseline. That assumes five questions and concurrency 4. The initial v1.0 had a 30-minute SLO based on the local MLX era, but switching to the OpenAI backend dropped per-turn responses to 1-3 seconds, so the SLO was updated to 5-10 minutes. The PRD keeps the change history of both SLOs intact.

Concurrency limits and the retry policy are conservative. asyncio.Semaphore caps concurrent calls, retries default to 3, and timeout and jitter widths are tunable from yaml. Truncation triggers only when accumulated tokens cross the `llm.context_budget` threshold, so even a five-turn multi-turn interview with persona reinforcement still has headroom. In real usage, truncation has only fired for a handful of personas whose follow-ups grew long.

## 6. The evolution of the decisions

The core decisions of this tool were not settled in one shot. They were updated five times as operational data and the deployment environment shifted. This section walks through the five ADRs and the SLO updates in the PRD in chronological order. To preserve the retrospective tone, each subsection focuses less on what was decided and more on why the decision had to be revisited.

### 6.1. The multi-turn strategy decision

The first thing to settle was how to bundle N questions when sending them to the model. Even with the same set of questions, the bundling shape changes persona consistency, token usage, processing time, and post-processing complexity all at once. ADR-001 lays out three candidates in a tradeoff table.

Candidate A is multi-turn interviews plus a post-interview single-turn structured summary. Each question goes one turn at a time and accumulates in the messages history, then a separate system prompt feeds the entire messages into the model to produce a structured JSON summary in a single turn. Candidate B is single-turn bundled, where N questions go in one request and the model returns every answer in one response. Candidate C is the same as B in that all answers come in one response, but qualitative insights are generated through a separate single-turn call.

In the table, Candidate A costs roughly 1.8 to 2.5 times more in tokens and processing time, but it wins on all four axes - persona consistency, automatic follow-up integration, drift / refusal isolation, and debugging ergonomics. Because the core guardrails of this tool are automatic follow-up and persona drift detection, per-answer isolation is fundamentally required. The decision criterion was whether the other four answers can survive when one is contaminated, and Candidates B and C mix all the answers into a single response, which is incompatible with these guardrails.

So Candidate A was adopted along with three detailed policies. The system message is preserved at messages[0] without truncation, and when accumulated tokens exceed the threshold, the oldest user/assistant pair is removed first. Token estimation uses a heuristic of 1 character of Korean = 1, 1 character of English = 0.25, and other characters = 0.5, which gives a consistent trigger using only the standard library. Single-turn mode is opened only via the `--single-turn` flag for dry-run / token-saving purposes, and the v1 default stays multi-turn.

### 6.2. From local MLX to the OpenAI backend

In the v1 draft phase, the inference backend was local MLX. The design idea was to combine Apple Silicon with `mlx_lm.server`, bring external API cost to zero, keep business-idea data flowing only on the local machine, and gain an edge on both security and cost.

After GATE-1 passed, operational verification and main-session dry-runs piled up limitations. The 35B-A3B 4bit MLX build had unstable EOS recognition in its tokenizer, and certain inputs reproduced token loops (like repeated Chinese characters such as `券后`). The 27B Dense 6bit was already dropped from the candidate list with even worse token loops. The Qwen3 thinking toggle had a branch where calling with `enable_thinking=true` consumed all of `max_tokens` on English reasoning, leaving content as an empty string. The 35B-A3B 4bit took up 8-10 GB, so concurrency above 4 risked OOM on a 16 GB machine, forcing concurrency down to 1-3. The first model download of 12-20 GB and the external dependency of having the user spin up `mlx_lm.server` in a separate terminal also raised the entry friction.

ADR-002 cataloged this cluster of limitations and decided to switch to the OpenAI Chat Completions API. The default model became `gpt-4o-mini`, the base_url became `https://api.openai.com/v1`, and authentication used the standard `OPENAI_API_KEY` with a fallback `KPI_OPENAI_API_KEY` (this fallback was removed in v1.2.0). The HTTP client kept httpx, and the official `openai` SDK was not introduced. Qwen-specific parameters like `chat_template_kwargs`, used only by OSS inference servers, were also removed. Cost was no longer zero (about $0.50-$2.00 per 100-persona interview), but persona consistency, EOS recognition stability, response latency, and OS constraints all improved.

The most visible effect was the SLO update. PRD section 6.1 line 268 was updated to "Complete one 100-persona interview within 5-10 minutes (assuming five questions and concurrency 4). On gpt-4o-mini, per-turn responses are estimated around 1-3 seconds (...) The v1.0 30-minute SLO was a conservative estimate from the local MLX era; on the v1.x OpenAI backend, the SLO is updated to 5-10 minutes." PRD section 10 success metrics line 389 reflects the same flow with "Processing performance: complete one 100-persona interview within 5-10 minutes (five questions and concurrency 4 baseline. The v1.0 30-minute SLO is updated to match the OpenAI backend)."

The default concurrency also moved from 1-3 up to 4, with the upper bound relaxed to a 1-10 range. As the average per-turn response dropped from 4-10 seconds to 1-3 seconds, the meaning of the concurrency guard shifted from memory protection to OpenAI rate-limit protection. User environment diversity was absorbed at the same time. macOS, Linux, and Windows all work, so the Apple Silicon prerequisite disappears too.

### 6.3. The multi-provider abstraction

Right after the OpenAI single-backend decision, two user requests piled up. One was that users with Anthropic credits or users wanting to evaluate Claude's Korean tone wanted to use Claude as an interview backend directly. The other was that environments with security domains or in-house LLMs wanted to run offline on a local LLM (mlx_lm.server, vLLM, llama.cpp).

ADR-003 absorbed both requests by introducing the `LLMBackend` Protocol and branching the entry point on `LlmConfig.provider`. `provider=openai` (default) maps to `OpenAIBackend`, which handles both the OpenAI Chat Completions API and OpenAI-compatible local servers. Pointing base_url at `http://localhost:PORT/v1` plugs straight into a local server. `provider=anthropic` maps to `AnthropicBackend`, which calls the Anthropic Messages API directly via httpx. The anthropic SDK dependency was not added.

The heuristic of branching by base_url match alone was rejected as not stable enough. Anthropic uses a Messages API schema that is not compatible with OpenAI Chat Completions. With a top-level `system` field, an `x-api-key` header, and required `max_tokens`, the differences pile up to the point where a base_url pattern-matching branch breaks frequently. Splitting it into a separate adapter is better. Adopting the anthropic SDK was also rejected. From the leftpad-avoidance principle in dependency.md section 1 and minimizing the transitive tree, unifying retry / timeout / logging in a single module via direct httpx calls keeps the control cost lower.

Token usage tracking was also normalized in this round. OpenAI uses `cached_tokens` and Anthropic uses `cache_read_input_tokens`, and even though the field names differ, both are merged into `TokenUsage.cached_tokens` so the whole tool aggregates through the same interface. On the Anthropic side, prompt caching is not automatic and requires explicit `cache_control` markers, which differs from OpenAI. The structure puts a `cache_control: ephemeral` marker on the system block.

ADR-002's OpenAI single-backend decision was superseded by ADR-003. That said, ADR-003 itself carried a story where one decision about the MCP entry point inside ADR-003 section 2 (the decision section) would be partly superseded in the next round. That is the starting point of the MCP mode introduction covered in section 6.4.

### 6.4. Introducing the MCP mode (server / sampling)

In ADR-003, the MCP server entry point was simplified to be sampling-only. The policy was to always delegate inference to the host agent's `sampling/createMessage` and not place any OpenAI / Anthropic keys server-side. From the perspective that MCP is fundamentally a protocol for leveraging the host LLM, that is a clean decision.

That said, operational friction piled up on two fronts. First, as of April 2026, MCP clients exposing the sampling capability as a standard were extremely scarce. The cmux build did not support sampling, the official Claude Code Desktop build had not finalized sampling exposure, and only some Cursor builds offered partial support. Second, as a result, when a typical user registered the tool in mcp.json and called it via natural language, they always got a ConfigError. The tool failed to boot at all, so its real-world utility evaporated.

ADR-004 introduced the `mcp.mode` toggle to resolve this operational friction. There is no automatic fallback. The core principle is that the user picks the runtime path through an explicit toggle.

`mcp.mode: "server"` (the default at the time) made MCP tool calls use the server-side `OpenAIBackend` or `AnthropicBackend`. It reused the same `LlmConfig` fields as the CLI (provider, base_url, model, api_key, timeout, retry, anthropic_cache_control, extra_chat_kwargs, streaming) and required `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` set in the mcp.json `env`. The response was labeled `"backend": "mcp_server"`. `mcp.mode: "sampling"` was an explicit opt-in that delegated to the host agent's `sampling/createMessage` and required no server-side keys. If the host did not expose the sampling capability, it was blocked with a ConfigError and a CLI-fallback notice. The response label was `"mcp_sampling"`.

The reason automatic fallback was rejected is surprise behavior and debugging difficulty. A flow that tries server mode and falls back to sampling when the key is missing makes it hard for the user to trace which path the response went through. The biggest problem is that the cost-attribution owner becomes unclear. If a charge thought to be on the server key actually went through host sampling, or vice versa, an operator cannot detect a cost spike immediately. In the end, it was settled with explicit toggles plus response labels.

### 6.5. Removing sampling and introducing orchestrator mode

The two-mode (server / sampling) toggle resolved the onboarding friction, but the v1.1.1 operational data made it clear that sampling mode was effectively unused. The supersede threshold pinned in ADR-004 was 50%+ adoption among sampling-compatible clients, and as of 2026-05 the estimate is below 10%, with no signal that the threshold will be reached anytime soon.

Meanwhile, host sub-agent tools (Claude Code's Task tool, Cursor's sub-agent pattern) had stable mainstream support, so an alternative path opened up: if the host directly spawns a sub-agent to run the interview with its own LLM, the same value (no server-side keys + use of the host LLM) can be delivered without any sampling dependency. To be transparent, the adoption number is not from official statistics but is the project's own estimate from ADR-005 section 1.

ADR-005 bundled two decisions in one round. First, `mcp.mode: "sampling"` was removed from both the whitelist and the code. The `McpSamplingBackend` class, the sampling capability check, and the `_convert_to_sampling_messages` and `_extract_sampling_text` helpers were also cleaned up. Second, `mcp.mode: "orchestrator"` was introduced as the new default. The server-side does not call any LLM; the host sub-agent runs the interview with its own LLM, and this tool exposes only data / prompt helpers. The response label is `"mcp_orchestrator"`. ADR-004's server-default decision was also superseded in this round. The judgment was that working immediately without any key configuration minimizes friction for new users.

This change is BREAKING, so users who had been using `mcp.mode: "sampling"` need to migrate the yaml to `"orchestrator"` or `"server"`. Orchestrator mode loses automatic application of heuristics, so the host has to call helper tools (`detect_persona_drift`, `should_auto_follow_up`, `parse_structured_summary`, `interview_record_schema`) explicitly to apply the same thresholds for drift / follow-up as in server mode. A side decision in this round was to expose the same thresholds and keywords as helper tools so that the host does not need to reimplement the heuristics. There is no automatic fallback for the same reasons as ADR-004. The user picks a mode through an explicit toggle to make the runtime path and the cost-attribution owner clear.

Across these five decisions, the tool's inference path evolved from a single local MLX into multi-provider plus two entry-point modes. Looking back, the decision flow itself follows one pattern: when a clean initial policy generates friction in operational data, separate the paths through explicit toggles, secure traceability via response labels instead of automatic fallback, and consolidate options whose adoption or value converges to zero through a supersede ADR. This pattern shows up once more as a runtime outcome in the static design discussions in sections 7 and 8.

## 7. One core, three entry points - CLI / MCP server / MCP orchestrator

### 7.1. Per-entry-point separation of concerns

There are three entry points. The CLI, `main.py`, exposes four `click` subcommands and maps them to exit codes. The subcommands are healthcheck, list-personas, interview, and report. The MCP server, `src/mcp_handlers/server.py`, runs in server-only mode and additionally exposes the `interview` tool, which calls OpenAI/Anthropic directly server-side. The MCP orchestrator, `src/mcp_handlers/orchestrator.py`, does not call server-side LLMs and exposes only prompt helpers. Tools like `healthcheck`, `list_personas`, `report`, `should_auto_follow_up`, `detect_persona_drift`, `parse_structured_summary`, and `interview_record_schema` are common across both modes.

Each entry point handles only I/O and dispatch and carries no business logic. The CLI focuses on click option parsing and exit-code mapping, and the MCP entry points focus on MCP tool argument validation and response envelope generation. The actual interview flow lives in shared modules.

### 7.2. Shared modules - load_personas / build_system_prompt / run_batch / report

Both the CLI and the MCP server import `from src.batch import run_batch`, `from src.llm_backend import build_cli_backend`, and `from src.load_personas import load_and_sample`. `run_batch` enters via `from .interview import run_interview`, and `run_interview` builds the system prompt with `build_system_prompt` and then runs the multi-turn calls. In other words, the CLI and the MCP server traverse the same function call graph.

The MCP orchestrator calls `build_system_prompt` directly to produce the prompt that gets handed to the host's sub-agent. Because the host LLM runs the actual interview, the orchestrator does not pass through `run_batch` / `run_interview`. The persona-loading function `load_and_sample` and the report-generation function `report.generate_report`, however, reuse the same modules as-is. There is no reason for persona selection or per-cohort aggregation logic to differ across entry points.

| Entry point | LLM call path | Shared core invocation |
| --- | --- | --- |
| CLI | server-side `LLMBackend` | `load_and_sample` -> `run_batch` -> `run_interview` -> `build_system_prompt` |
| MCP server | server-side `LLMBackend` | `load_and_sample` -> `run_batch` -> `run_interview` -> `build_system_prompt` |
| MCP orchestrator | host sub-agent | `load_and_sample` -> direct `build_system_prompt` -> host runs interview -> `aggregate_results` -> `generate_report` |

### 7.3. Mode-branched dispatch pattern

The MCP entry point has two modes (`server`, `orchestrator`), so even tools with the same name should behave differently per mode. `TOOLS_BY_MODE` at `src/mcp_handlers/__init__.py:24` holds the list of exposed tool names per mode, and `HANDLERS` at `src/mcp_handlers/__init__.py:51` dispatches tuples of `(mode, tool_name)` to coroutines. `mcp_server.dispatch_tool` consumes both mappings as-is, so the list_tools response is trimmed to fit the current mode, and calling a tool not exposed in the current mode fails to dispatch because the key does not exist.

The strength of this structure is the absence of fallthrough. Calling the `interview` tool in orchestrator mode looks up `("orchestrator", "interview")`, which is not in the mapping, so it gets blocked immediately. It does not silently fall back to server mode. The response label, `backend: "mcp_server"` or `"mcp_orchestrator"`, makes it explicit which backend handled the tool call, which keeps debugging cheap. Automatic fallback to the other mode was also considered but rejected because it muddied the cost-attribution owner and the data flow.

## 8. The runtime structure of the MCP orchestrator mode today

### 8.1. Where sampling and sub-agent fan-out fit in

This section organizes how the tool actually runs today, from the static design perspective, as the outcome of the decision flow laid out in section 6.5. The narrative of the changes belongs in section 6.5; this section covers only the runtime shape and the tool responsibilities.

MCP defines a sampling capability that lets the server delegate inference to the host LLM. The server sends a request via `sampling/createMessage`, and the host generates the response with its own LLM and returns it. The phrase straight from the official documentation, "no server API keys necessary," captures the core value. This tool removed sampling mode in v1.2.0 and now provides the same value through host sub-agent fan-out. Patterns like Claude Code's Task tool and Cursor's sub-agent are stable mainstream support, so the normal path for tool invocations is the host directly spawning a sub-agent that runs the interview with its own LLM.

### 8.2. Tool responsibilities in orchestrator mode

The current orchestrator mode splits the host sub-agent flow across three tools.

- `build_persona_prompt` returns the system prompt and persona dict for a single persona. The host plugs the returned `system_prompt` into the sub-agent's system message verbatim and runs the interview
- `build_batch_prompts` returns N personas worth of system prompts and persona dicts in one shot. The host receives this response and fans out N interviews in parallel via sub-agents
- `aggregate_results` takes the records the host has collected and produces the quantitative aggregation and the markdown report

The tool only owns prompt building and aggregation; inference belongs to the host. Helper tools like `detect_persona_drift`, `should_auto_follow_up`, `parse_structured_summary`, and `interview_record_schema` are also exposed in this mode, so if the host calls them explicitly, the same thresholds and keywords as in server mode apply. The host does not need to reimplement the heuristics.

### 8.3. Differences in cost attribution

Server mode and orchestrator mode have different cost-attribution owners. Server mode requires `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` set in the mcp.json `env`, and the interview cost is billed to that key holder. The response label is `"mcp_server"`. Orchestrator mode runs without a server-side key, and the interview cost is absorbed within the host's LLM subscription (Claude Code subscription, Cursor pro, etc). The response label is `"mcp_orchestrator"`.

Because the response label is explicit per mode, the cost-attribution owner and the data flow can be traced at a glance. The absence of automatic fallback also reinforces this traceability. The response label literally tells you "which key did this call go through," so an operator can spot a cost-spike signal immediately.

## 9. Interpreting results - quantitative and qualitative reports

### 9.1. quant scores and willingness_to_pay signals

The quantitative report aggregates each persona's `StructuredSummary`. The five core fields are: `intent` (positive/neutral/negative), `acceptable_price_signal` (cheap/fair/expensive/null), `willingness_to_pay` (integer or null), `rejection_reasons` (a list of refusal reasons), and `one_line` (a one-line summary within 80 characters).

The biggest change in schema v2 (`SCHEMA_VERSION = 2` in `src/models.py`) is splitting price intent into two fields. In v1, `willingness_to_pay` alone carried both qualitative signals and explicit numbers. Without explicit figures like "월 5만원 정도면 쓸 만하다" (around 50,000 KRW per month would be reasonable) in the response body, the quantitative distribution had a lot of empty values, which made analysis hard. From v2, `acceptable_price_signal` classifies qualitative signals like "비싸다" (expensive), "적당하다" (fair/reasonable), and "저렴하다" (cheap), filling every record where possible, while `willingness_to_pay` accepts only explicit integer values. Reading both distributions side by side splits price acceptance from absolute amount intent.

v1 JSON files load with backward compatibility by setting `acceptable_price_signal` to None, so existing result files reload as-is.

### 9.2. Single-turn summary for qualitative insights

Qualitative insights are generated by a separate single-turn call after the interview ends. The same model receives the entire messages and is constrained to a JSON schema that pulls out per-category insights. Because it is a separate call from the multi-turn interview, the interview body's tone does not blur with the summary tone.

In orchestrator mode, this step does not exist on the server side. It is not a fallback - the normal path is for the host to produce the qualitative summary with its own LLM and pass it as the `insights` argument to `aggregate_results`. With the same helper tools the host can apply heuristics first, then bundle those results into a single-turn summary. The actual fallback is when the host passes no insights, in which case the qualitative section of the report is filled with a notice telling the host to add qualitative analysis on its end.

### 9.3. drift ratio and confidence flags

In the JSON, each `raw_responses[i]` keeps the per-turn response, latency, retry count, and token usage isolated, and per-record flags `flags.persona_drift`, `flags.refusal_detected`, `flags.truncated`, `flags.parse_failed`, and `flags.auto_follow_up_used` are set. The report shows drift ratio, refusal ratio, and truncated ratio together, giving a basis to judge data confidence.

A drift ratio above 5% triggers consideration of introducing persona reinforcement (re-injecting the system prompt every turn) per ADR-001 section 3.3. In real usage, after introducing the housing-type precise regex and the 30-character self-intro window guard, drift settled within the 5% threshold. A non-zero truncated ratio is a signal to reduce the question count or raise `llm.context_budget`.

## 10. Limitations and next steps

A synthetic persona is, in the end, synthetic. The quantitative scores and qualitative summaries this tool returns are meant to be a first-pass filter for narrowing hypotheses, not material that replaces real user interviews. The answers are ultimately the LLM's first-person rendering of the persona columns, which means the genuine context the persona carries (family relationships, coworkers, events from the past month) is missing. It is safest to position the tool as an aid that reduces real-interview recruiting cost.

The next steps split in two directions. One is cohort expansion. The current dataset has only Korea as country, so it cannot be used as-is for validating other markets. The work of fitting other-language datasets in the same NVIDIA series into the same abstraction is on the roadmap. The other is per-industry prompt templates. Today there is only one `prompts/system_prompt.txt`, so every business idea gets the same first-person guardrails. B2B SaaS and D2C food have such different interview tones that splitting the templates is worth doing.

# References

- <https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching>
- <https://github.com/binaryloader/korea-persona-interview>
- <https://huggingface.co/datasets/nvidia/Nemotron-Personas-Korea>
- <https://modelcontextprotocol.io/docs/concepts/sampling>
- <https://platform.openai.com/docs/guides/prompt-caching>
