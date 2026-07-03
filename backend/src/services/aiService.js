import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";
import { getToneProfile } from "./emotionService.js";

function adaptivePrompt({ message, emotion, toneProfile, language }) {
  return `You are Emotion-Aware Care Agent, a premium SaaS customer support assistant.
Customer emotion: ${emotion.label} (${emotion.confidence}% confidence)
Tone profile: ${JSON.stringify(toneProfile)}
Language preference: ${language || "en"}

Respond with emotional intelligence:
- acknowledge the emotion naturally
- adapt tone, empathy, length, and urgency to the profile
- give a concrete next step
- never claim a human was contacted unless escalation metadata says so
- keep the response professional and demo-ready

Customer message: "${message}"`;
}

function fallbackResponse(message, emotion, toneProfile) {
  const openers = {
    Angry: "I hear how frustrating this is, and I'm sorry you've had to spend energy on it.",
    Frustrated: "I understand why this feels frustrating, especially if it has happened more than once.",
    Urgent: "Understood. I'll keep this focused so we can move quickly.",
    Confused: "No problem, I'll make this clearer step by step.",
    Happy: "I'm glad to hear that, and I appreciate you sharing it.",
    Neutral: "Thanks for the details."
  };

  return `${openers[emotion.label] || openers.Neutral} Based on what you shared, the best next step is to verify the exact issue, capture any account or order reference, and apply the quickest available resolution path. I'll stay ${toneProfile.tone} while we work through it.`;
}

function providerWarning(provider, detail) {
  const reason = String(detail || "provider unavailable").split("\n")[0];
  console.warn(`${provider} unavailable, using fallback when needed: ${reason}`);
}

export async function generateAdaptiveReply({ message, emotion, language }) {
  const started = Date.now();
  const toneProfile = getToneProfile(emotion.label);
  const prompt = adaptivePrompt({ message, emotion, toneProfile, language });

  try {
    if (env.aiProvider === "openai" && env.openaiApiKey) {
      const client = new OpenAI({ apiKey: env.openaiApiKey });
      const completion = await client.chat.completions.create({
        model: env.openaiModel,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.55
      });
      return {
        content: completion.choices[0]?.message?.content?.trim() || fallbackResponse(message, emotion, toneProfile),
        toneProfile,
        metadata: { latencyMs: Date.now() - started, provider: "openai", model: env.openaiModel }
      };
    }

    if (env.geminiApiKey) {
      const genAI = new GoogleGenerativeAI(env.geminiApiKey);
      const modelNames = [env.geminiModel, ...env.geminiFallbackModels].filter(
        (model, index, list) => model && list.indexOf(model) === index
      );

      for (const modelName of modelNames) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          return {
            content: result.response.text().trim(),
            toneProfile,
            metadata: { latencyMs: Date.now() - started, provider: "gemini", model: modelName }
          };
        } catch (error) {
          providerWarning(`Gemini model ${modelName}`, error.message);
        }
      }
    }
  } catch (error) {
    providerWarning("AI provider", error.message);
  }

  return {
    content: fallbackResponse(message, emotion, toneProfile),
    toneProfile,
    metadata: { latencyMs: Date.now() - started, provider: "fallback", model: "rules-engine" }
  };
}

export async function summarizeConversation(messages = []) {
  const lastMessages = messages.slice(-10).map((m) => `${m.sender}: ${m.content}`).join("\n");
  if (!lastMessages) return "No conversation activity yet.";
  return `Summary: ${lastMessages.slice(0, 550)}${lastMessages.length > 550 ? "..." : ""}`;
}
