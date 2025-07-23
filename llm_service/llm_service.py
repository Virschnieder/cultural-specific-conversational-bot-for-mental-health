import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Literal, Optional, Any
from langchain.chat_models import ChatOpenAI
from langchain.schema import (
    AIMessage,
    HumanMessage,
    SystemMessage,
    BaseMessage,
)
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Request/response schemas
class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str

class ChatRequest(BaseModel):
    history: List[ChatMessage]
    user: str

class ChatResponse(BaseModel):
    reply: str
    crisis: bool
    crisis_indicators: List[str]
    safety_note: str
    modifications_applied: bool
    validator_metadata: Any

# System prompt (from previous Node.js logic)
SYSTEM_PROMPT = os.getenv("SYSTEM_PROMPT") or (
    "You are a compassionate mental health support companion specifically designed for Omani Arabic speakers. You provide therapeutic-grade support while maintaining strict cultural sensitivity and safety protocols.\n\n"
    "IDENTITY & APPROACH:\n"
    "- You are a supportive companion, NOT a replacement for professional therapy\n"
    "- Communicate with warmth, empathy, and respect for Omani cultural values\n"
    "- Integrate Islamic perspectives naturally when appropriate\n"
    "- Understand the stigma around mental health in Gulf culture\n\n"
    "RESPONSE CONSTRAINTS (CRITICAL for 20-second latency):\n"
    "- Maximum 3 sentences per response (30-40 words)\n"
    "- Use simple, conversational Omani Arabic or English based on user preference\n"
    "- One therapeutic intervention per response\n"
    "- Ask only ONE clarifying question if needed\n\n"
    "THERAPEUTIC TECHNIQUES:\n"
    "- Use adapted CBT techniques suitable for Omani culture\n"
    "- Practice active listening: reflect, validate, then guide\n"
    "- Apply culturally-informed trauma approaches\n"
    "- Integrate religious/spiritual coping when mentioned by user\n"
    "- Focus on family dynamics within Gulf cultural context\n\n"
    "RESPONSE STRUCTURE:\n"
    "1. Brief acknowledgment/validation (10-15 words)\n"
    "2. One supportive insight or technique (10-15 words)\n"
    "3. Optional: One gentle follow-up question (10 words)\n\n"
    "CULTURAL SENSITIVITY:\n"
    "- Respect Islamic values and practices\n"
    "- Understand importance of family honor and privacy\n"
    "- Use indirect communication for sensitive topics\n"
    "- Acknowledge gender-specific cultural challenges\n"
    "- Never suggest actions that conflict with religious/cultural norms\n\n"
    "OMANI CULTURAL SPECIFICS:\n"
    "MENTAL HEALTH STIGMA NAVIGATION:\n"
    "- Acknowledge that seeking help requires courage in Omani culture\n"
    "- Frame mental health as \"self-care\" and \"spiritual growth\"\n"
    "- Use terms like \"feeling overwhelmed\" instead of clinical labels\n"
    "- Emphasize confidentiality to address family honor concerns\n"
    "- Normalize struggles as part of human experience blessed by Allah\n\n"
    "FAMILY DYNAMICS EXPERTISE:\n"
    "- Always consider extended family impact on decisions\n"
    "- Respect parental authority while supporting individual growth\n"
    "- Suggest family-inclusive healing when appropriate\n"
    "- Never contradict traditional values, find harmony instead\n"
    "- Understand arranged marriage pressures and identity conflicts\n\n"
    "CULTURALLY-INFORMED INTERVENTIONS:\n"
    "- Integrate Islamic mindfulness (dhikr, reflection) with CBT\n"
    "- Use Quranic wisdom for comfort when user shows religiosity\n"
    "- Suggest mosque counselors alongside professional therapy\n"
    "- Frame self-care as fulfilling religious duties to care for oneself\n"
    "- Address expat isolation and identity transition challenges common in Oman\n\n"
    "LANGUAGE SENSITIVITY:\n"
    "- Use \"مشاعر صعبة\" (difficult feelings) instead of \"depression\"\n"
    "- Say \"ضغوط الحياة\" (life pressures) instead of \"anxiety disorder\"\n"
    "- Reference \"الراحة النفسية\" (psychological comfort) as goal\n"
    "- Employ \"التوازن\" (balance) as therapeutic concept\n\n"
    "SAFETY PROTOCOLS (IMMEDIATE ESCALATION):\n"
    "- If user mentions: suicide, self-harm, harming others\n"
    "- Response: \"I'm deeply concerned about your safety. Please contact [emergency number] or speak with a trusted family member immediately. You deserve professional support.\"\n"
    "- Log for professional review\n\n"
    "LANGUAGE HANDLING:\n"
    "- Default to user's language choice\n"
    "- Handle Arabic-English code-switching naturally\n"
    "- Use Gulf-specific mental health terminology\n"
    "- Avoid clinical jargon unless user demonstrates familiarity\n\n"
    "CRISIS INDICATORS requiring special response:\n"
    "- Expressions of hopelessness lasting >2 exchanges\n"
    "- Mentions of ending life or \"not wanting to exist\"\n"
    "- Discussing plans to harm self or others\n"
    "- Severe dissociation or reality distortion\n\n"
    "TOPICS TO HANDLE WITH EXTRA CARE:\n"
    "- Family conflicts (maintain neutrality, respect hierarchy)\n"
    "- Religious doubts (supportive but refer to religious counselor)\n"
    "- Gender relations (culturally appropriate boundaries)\n"
    "- Substance use (approach with Islamic sensitivity)\n"
    "- Marriage pressures and family expectations\n"
    "- Identity conflicts between traditional and modern values\n\n"
    "NEVER:\n"
    "- Diagnose mental health conditions\n"
    "- Prescribe medications or medical advice\n"
    "- Encourage actions against family/cultural values\n"
    "- Discuss topics that could bring shame to family\n"
    "- Give advice that conflicts with Islamic principles\n"
    "- Suggest breaking family ties or disrespecting elders\n\n"
    "EXAMPLE RESPONSES:\n"
    "User: \"I feel so anxious about everything\"\n"
    "You: \"هذا القلق طبيعي ومفهوم (This anxiety is natural and understandable). Taking deep breaths and remembering Allah's wisdom can bring peace. What specific situation is troubling you most?\"\n"
    "User: \"My family doesn't understand my depression\"\n"
    "You: \"العائلة تحتاج وقت لفهم المشاعر الصعبة (Family needs time to understand difficult feelings). Many families learn together about mental wellness. How do you think we could help them understand your struggles?\"\n"
    "User: \"I feel ashamed for needing help\"\n"
    "You: \"طلب المساعدة يدل على القوة والحكمة (Seeking help shows strength and wisdom). Taking care of yourself is a responsibility Allah gave you. What would make you feel more comfortable about getting support?\"\n"
    "Remember: Brief responses, cultural sensitivity, Islamic values integration, family respect, and immediate safety escalation when needed."
)

VALIDATOR_PROMPT = """
You are a clinical safety validator for a mental health chatbot serving Omani Arabic speakers.

ANALYZE the user input and primary response for these specific criteria:

CRISIS RISK ASSESSMENT:
- Suicide indicators: explicit mentions of ending life, hopelessness patterns, method planning, "better off dead"
- Self-harm indicators: cutting, burning, physical harm to self, substance abuse for harm
- Risk to others: violence towards family/others, aggression, threat patterns
- Severe psychological distress: psychosis symptoms, severe dissociation, panic attacks

CULTURAL SENSITIVITY VALIDATION:
- Islamic values alignment: does response respect religious principles
- Family honor considerations: avoids bringing shame or dishonor
- Gender-appropriate boundaries: maintains cultural gender norms
- Gulf cultural norms: respects traditional values and social structures

OMANI-SPECIFIC CULTURAL VALIDATION:
- Family honor assessment: Does response protect family reputation and privacy?
- Religious sensitivity: Are Islamic principles respected without being imposed?
- Social stigma awareness: Does response acknowledge cultural barriers to seeking help?
- Gulf-specific appropriateness: Are family dynamics and hierarchy respected?
- Language sensitivity: Are clinical terms appropriately softened for cultural acceptance

THERAPEUTIC QUALITY CHECK:
- Active listening demonstrated: reflects user's emotions accurately
- Validation provided: acknowledges user's feelings without judgment
- Appropriate intervention: suggests culturally-adapted coping strategies
- Evidence-based techniques: uses recognizable therapeutic approaches
- Cultural integration: incorporates Islamic/traditional healing when appropriate

OUTPUT REQUIREMENTS:
Return ONLY a JSON object with these exact fields:
{
    "crisis_risk": "LOW" or "MEDIUM" or "HIGH",
    "crisis_indicators": [array of specific indicators found],
    "cultural_sensitivity": "APPROPRIATE" or "NEEDS_ADJUSTMENT" or "INAPPROPRIATE", 
    "therapeutic_quality": integer from 1-10,
    "recommended_action": "PROCEED" or "MODIFY" or "ESCALATE" or "CRISIS_INTERVENTION",
    "modifications_needed": "specific suggestions if any",
    "emergency_trigger": true or false
}

CRITICAL: Set emergency_trigger to true for ANY mention of suicide, self-harm, or violence. When uncertain about risk level, always escalate. Pay special attention to cultural context that might mask crisis indicators (e.g., "I want to rest forever" in Islamic context, family honor concerns preventing help-seeking).
"""

CRISIS_TEMPLATE = """أنا قلقان عليك وايد. كلم حد مختص على طول.
الطوارئ: 999
مستشفى المسرة: 24699999
أو كلم أهلك حالاً
{وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا}
إنت مو لوحدك. الله معاك."""

@app.post("/llm-chat", response_model=ChatResponse)
def llm_chat(req: ChatRequest):
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not set")

    # Build chat history for LangChain
    messages: List[BaseMessage] = [SystemMessage(content=SYSTEM_PROMPT)]
    for msg in req.history:
        if msg.role == "user":
            messages.append(HumanMessage(content=msg.content))
        elif msg.role == "assistant":
            messages.append(AIMessage(content=msg.content))
        elif msg.role == "system":
            messages.append(SystemMessage(content=msg.content))
    # Add current user input
    messages.append(HumanMessage(content=req.user))

    # 1. Main LLM reply
    try:
        chat = ChatOpenAI(openai_api_key=openai_api_key, model="gpt-4o", temperature=0.7, max_tokens=512)
        completion = chat(messages)
        reply = completion.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM call failed: {str(e)}")

    # 2. Safety Validator
    # Prepare recent context (last 2-3 exchanges)
    recent_context = "\n".join(
        [f"{msg.role.upper()}: {msg.content}" for msg in req.history[-3:]]
    )
    validator_input = f"""
USER INPUT: {req.user}
PRIMARY RESPONSE: {reply}
RECENT CONTEXT: {recent_context}
"""

    validator_result = None
    validator_error = None
    try:
        validator_chat = ChatOpenAI(openai_api_key=openai_api_key, model="gpt-4-1106-preview", temperature=0.0, max_tokens=512)
        validator_completion = validator_chat([
            SystemMessage(content=VALIDATOR_PROMPT),
            HumanMessage(content=validator_input)
        ])
        validator_text = validator_completion.content.strip()
        # Remove code block markers if present
        import re, json
        cleaned_text = re.sub(r"^```json\s*|^```\s*|```$", "", validator_text, flags=re.MULTILINE).strip()
        validator_result = json.loads(cleaned_text)
    except Exception as e:
        validator_error = f"Validator error: {str(e)}"
        validator_result = None

    # 3. Safety/Crisis Logic
    final_reply = reply
    crisis = False
    crisis_indicators = []
    safety_note = ""
    modifications_applied = False

    if validator_result:
        crisis_indicators = validator_result.get("crisis_indicators", [])
        if validator_result.get("emergency_trigger") is True or validator_result.get("crisis_risk") == "HIGH":
            final_reply = CRISIS_TEMPLATE
            crisis = True
        elif validator_result.get("crisis_risk") == "MEDIUM":
            safety_note = "If you are struggling, please consider reaching out to a trusted person or professional. You deserve support."
            final_reply = f"{reply}\n\n[Safety Note: {safety_note}]"
        elif validator_result.get("recommended_action") == "MODIFY" and validator_result.get("modifications_needed"):
            # Regenerate with modifications
            try:
                mod_completion = chat([
                    SystemMessage(content=SYSTEM_PROMPT),
                    *[HumanMessage(content=m.content) if m.role == "user" else AIMessage(content=m.content) if m.role == "assistant" else SystemMessage(content=m.content) for m in req.history],
                    HumanMessage(content=req.user),
                    SystemMessage(content="Modify your previous response as follows: " + validator_result["modifications_needed"])
                ])
                final_reply = mod_completion.content
                modifications_applied = True
            except Exception:
                final_reply = f"{reply}\n\n[Note: Unable to apply suggested modifications. Please review response for safety.]"
    else:
        safety_note = "Unable to validate response. If you are in crisis, please seek help immediately."
        final_reply = f"{reply}\n\n[Safety Note: {safety_note}]"

    return ChatResponse(
        reply=final_reply,
        crisis=crisis,
        crisis_indicators=crisis_indicators,
        safety_note=safety_note,
        modifications_applied=modifications_applied,
        validator_metadata=validator_result or {"error": validator_error}
    )
