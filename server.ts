import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in the environment.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser with ample limit for payloads
  app.use(express.json({ limit: "25mb" }));

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "BackgroundOff API" });
  });

  // 1. AI-Generated Custom Backdrop Endpoint
  app.post("/api/gemini/generate-backdrop", async (req, res) => {
    try {
      const { prompt, aspectRatio = "16:9" } = req.body;

      if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
        return res.status(400).json({ error: "Please provide a valid prompt for the backdrop." });
      }

      const ai = getGeminiClient();
      const enhancedPrompt = `A clean, professional, high-resolution backdrop background photograph for product/portrait photography: ${prompt.trim()}. Crisp architectural or environmental details, soft cinematic studio lighting, balanced depth, empty center area suitable as a backdrop stage, no people or figures blocking the center, 8k resolution look.`;

      let generatedImageUrl: string | null = null;

      // Strategy 1: Imagen 3.0
      try {
        const imagenResponse = await ai.models.generateImages({
          model: "imagen-3.0-generate-002",
          prompt: enhancedPrompt,
          config: {
            numberOfImages: 1,
            aspectRatio: (["1:1", "3:4", "4:3", "9:16", "16:9"].includes(aspectRatio) ? aspectRatio : "16:9") as any,
            outputMimeType: "image/jpeg",
          },
        });

        if (imagenResponse.generatedImages && imagenResponse.generatedImages.length > 0) {
          const base64Bytes = imagenResponse.generatedImages[0].image?.imageBytes;
          if (base64Bytes) {
            generatedImageUrl = `data:image/jpeg;base64,${base64Bytes}`;
          }
        }
      } catch (imagenErr: any) {
        console.warn("Imagen generation attempt note:", imagenErr?.message || imagenErr);
      }

      // Strategy 2: Gemini Flash Image if Imagen did not return
      if (!generatedImageUrl) {
        try {
          const geminiImageResponse = await ai.models.generateContent({
            model: "gemini-3.1-flash-image",
            contents: {
              parts: [{ text: enhancedPrompt }],
            },
            config: {
              imageConfig: {
                aspectRatio: (["1:1", "3:4", "4:3", "9:16", "16:9"].includes(aspectRatio) ? aspectRatio : "16:9") as any,
                imageSize: "1K",
              },
            },
          });

          for (const part of geminiImageResponse.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData?.data) {
              const mime = part.inlineData.mimeType || "image/png";
              generatedImageUrl = `data:${mime};base64,${part.inlineData.data}`;
              break;
            }
          }
        } catch (geminiImgErr: any) {
          console.warn("Gemini Flash Image attempt note:", geminiImgErr?.message || geminiImgErr);
        }
      }

      // Strategy 3: Gemini Flash Lite Image
      if (!generatedImageUrl) {
        try {
          const geminiLiteResponse = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite-image",
            contents: {
              parts: [{ text: enhancedPrompt }],
            },
          });

          for (const part of geminiLiteResponse.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData?.data) {
              const mime = part.inlineData.mimeType || "image/png";
              generatedImageUrl = `data:${mime};base64,${part.inlineData.data}`;
              break;
            }
          }
        } catch (geminiLiteErr: any) {
          console.warn("Gemini Flash Lite Image attempt note:", geminiLiteErr?.message || geminiLiteErr);
        }
      }

      if (!generatedImageUrl) {
        return res.status(500).json({
          error: "Could not generate an image from this prompt. Please try modifying your description or choosing a preset.",
        });
      }

      return res.json({
        imageUrl: generatedImageUrl,
        prompt: prompt.trim(),
      });
    } catch (error: any) {
      console.error("Backdrop generation error:", error);
      const isRateLimit = error?.message?.includes("429") || error?.message?.includes("quota");
      const isSafety = error?.message?.includes("SAFETY") || error?.message?.includes("blocked");
      
      let clientError = error?.message || "Failed to generate AI backdrop.";
      if (isRateLimit) {
        clientError = "API rate limit reached. Please wait a few seconds and try again.";
      } else if (isSafety) {
        clientError = "The prompt was flagged by safety filters. Please try rephrasing with different wording.";
      }

      return res.status(500).json({ error: clientError });
    }
  });

  // 2. Scoped Gemini Chatbot Assistant Endpoint
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { message, history = [] } = req.body;

      if (!message || typeof message !== "string" || !message.trim()) {
        return res.status(400).json({ error: "Message cannot be empty." });
      }

      const ai = getGeminiClient();

      const systemInstruction = `You are the in-app assistant for "BackgroundOff", a fast, privacy-first web application for removing image backgrounds and compositing subjects onto backdrops.

CORE APPLICATION FEATURES:
1. In-Browser WASM Neural Network:
   - 100% local processing on device. Photos never leave the browser. Zero cloud upload of user photos.
2. Input Methods:
   - Drag and drop photos, click to browse files, paste from clipboard (Ctrl+V / ⌘V), capture via camera, try built-in sample images (Portraits, Products, Animals, Objects), OS File Handler, and Web Share Target.
3. Live Before / After View Modes:
   - "Split Slider": Interactive draggable divider to compare original vs cutout.
   - "Side-by-Side": Dual screen preview.
   - "Cutout Only": Transparent subject.
   - "Original Only": Full untouched source.
4. Background Customizer & Effects:
   - "Transparent (PNG)": Light or dark checkerboard preview.
   - "Solid Color": One-click Amazon/Shopify white, vibrant presets, or custom hex color picker.
   - "Studio Gradients": Radial studio light, sunset glow, deep space, ocean breeze, minty fresh, soft pastel, neon cyber.
   - "Blur Background": Adjustable depth-of-field slider (4px-32px) on the original photo.
   - "Custom Backdrop": Upload any local image or select scenic backgrounds.
   - "Generate with AI": Create tailored photo backdrops using Gemini/Imagen prompts or quick presets (Studio, Nature, Urban, Abstract Gradient, Office, Luxury Podium, Neon).
5. Subject Adjustments & Lighting:
   - Natural soft product drop shadow (adjustable opacity, blur, and vertical offset).
   - Brightness, contrast, and saturation tuning sliders.
6. Manual Touch-Up Brush:
   - Click "Manual Touch-Up Brush" in the toolbar to open a canvas editor.
   - Switch between Erase (red) and Restore (green) brush modes.
   - Adjust brush size (5px to 100px) and hardness (soft feathering to hard edge).
   - Multi-level Undo/Redo history.
7. Export & Resolution Tiers:
   - Formats: PNG (with transparency), JPG (optimized for e-commerce with solid backdrop), and WebP (high compression efficiency).
   - Resolution Quality Tiers:
     * "Standard (1K)": Quick web preview (up to 1024px).
     * "HD (2K)": High-definition output (up to 2048px).
     * "Original (Full)": Maximum native camera resolution with pixel-perfect fidelity.
   - One-click "Copy to Clipboard" to paste transparent PNG into Figma, Photoshop, Canva, or docs.
8. Progressive Web App (PWA):
   - Fully installable on Windows, macOS, Android, and iOS.
   - Offline support via Service Worker caching.
   - Supports OS file opening and share sheet.

RULES FOR YOUR RESPONSES:
- Be friendly, concise, and helpful.
- Keep responses short and actionable (2 to 4 sentences maximum).
- Give specific, feature-focused instructions (e.g., "Click the 'Manual Touch-Up Brush' button above the preview," "Select the 'Generate with AI' tab in the Background panel").
- If the user asks about something outside of BackgroundOff, politely guide them back to how BackgroundOff can help with their image editing.
- Do not make up non-existent features.`;

      // Build conversation contents
      const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

      // Add recent history for context (up to last 6 messages)
      const recentHistory = history.slice(-6);
      for (const item of recentHistory) {
        if (item.text && item.role) {
          contents.push({
            role: item.role === "user" ? "user" : "model",
            parts: [{ text: item.text }],
          });
        }
      }

      // Add current message
      contents.push({
        role: "user",
        parts: [{ text: message.trim() }],
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const replyText = response.text?.trim() || "I'm here to help with BackgroundOff. You can ask me how to remove backgrounds, use the touch-up brush, or generate custom backdrops!";

      return res.json({ reply: replyText });
    } catch (error: any) {
      console.error("Chat error:", error);
      const isRateLimit = error?.message?.includes("429") || error?.message?.includes("quota");
      let clientError = "Sorry, I had trouble processing that question. Please try asking again.";
      if (isRateLimit) {
        clientError = "I'm receiving too many requests at the moment. Please wait a moment before asking again.";
      }
      return res.status(500).json({ error: clientError, reply: clientError });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BackgroundOff Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
