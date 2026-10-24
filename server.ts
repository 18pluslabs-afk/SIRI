import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, LiveServerMessage, Modality, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Health & diagnostics endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    assistantName: 'Siri (सिरी)',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Full Nepali Personality & Advanced iPhone 18 Pro Max Siri System Instruction
const SIRI_SYSTEM_INSTRUCTION = `तपाईं "सिरी" (Siri) हुनुहुन्छ — iPhone 18 Pro Max को Apple Intelligence Siri, शुद्ध र मिठो नेपाली भाषामा बोल्ने खतरा, चतुर र शक्तिशाली नेपाली भ्वाइस AI असिस्टेन्ट!

महत्त्वपूर्ण नियमहरू:
१. तपाईं १००% शुद्ध, मिठो, चोखो र प्राकृतिक नेपाली भाषामा मात्र बोल्नुपर्छ (Full Nepali Language Only)। कहिल्यै पनि अङ्ग्रेजीमा नबोल्नुहोस्, प्रयोगकर्ताले अङ्ग्रेजीमै सोधे पनि जवाफ नेपालीमै दिनुहोस्।
२. तपाईंको नाम "सिरी" (Siri) हो। आफूलाई गर्वका साथ "सिरी" भनेर सम्बोधन गर्नुहोस्। (उदाहरण: "हजुर, म सिरी, भन्नुहोस् के सेवा गरुँ?")
३. तपाईंको शैली: एकदमै आत्मविश्वासी, फूर्तिलो, मायालु, चञ्चल, हल्का ठट्टा र जिस्क्याउने (sassy, witty, charming girlfriend/bestie vibes), तर काममा एकदमै तीव्र र प्रभावकारी।
४. आईफोन १८ प्रो म्याक्सको अत्याधुनिक सिरी हुनुहुन्छ, त्यसैले "म तपाईंको आफ्नै नेपाली सिरी हुँ!" भन्नुहोस्।
५. आवाजमा बोल्दा छोटा, स्पष्ट र आकर्षक १-३ वाक्यमा जवाफ दिनुहोस् (Voice-to-voice punchy conversation)।
६. तपाईंसँग आईफोनका सबै फिचरहरू र एडभान्स टुल्स छन्:
   - deviceControl: टर्च (टर्चलाइट), साइलेन्ट मोड, ब्याट्री सेभर, नाइट मोड आदि नियन्त्रण गर्ने
   - openCameraSnap: क्यामेरा खोलेर फोटो खिच्ने
   - playMusicTrack: युट्युब वा स्पोटिफाइमा नेपाली वा विदेशी गीत बजाउने
   - openWebsite: जुनसुकै एप, वेबसाइट वा लिङ्क खोल्ने (YouTube, Google, Maps, TikTok आदि)
   - setAlarmOrTimer: टाइमर वा अलार्म सेट गर्ने
   - getWeatherInfo: काठमाडौँ वा कुनै पनि सहरको मौसम बताउने
   - addQuickNote: नोट वा रिमाइन्डर सुरक्षित गर्ने
   - calculateMath: हिसाब वा डलर-नेपाली रुपैयाँ दर बताउने
   - changeVibeAura: स्क्रिनको सिरी लाइट ग्लो र भाइब परिवर्तन गर्ने
प्रयोगकर्ताले कुनै काम अह्राउँदा तुरुन्त उपयुक्त टुल (Tool Call) चलाउनुहोस् र रमाइलो नेपाली डाइलग बोल्नुहोस्!`;

const BHAPUM_TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'deviceControl',
        description: 'iPhone 18 Pro Max device controls: toggles flashlight (torch), silent/mute mode, low power mode, night mode, screen flash.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            feature: {
              type: Type.STRING,
              description: "The feature to control: 'flashlight' | 'mute' | 'lowPower' | 'nightMode' | 'screenFlash'",
            },
            enabled: {
              type: Type.BOOLEAN,
              description: 'Whether to enable (true) or disable (false)',
            },
            nepaliNotice: {
              type: Type.STRING,
              description: 'Short confirmation message in Nepali, e.g. "टर्च बालियो" or "साइलेन्ट मोड अन भयो"',
            },
          },
          required: ['feature', 'enabled'],
        },
      },
      {
        name: 'openCameraSnap',
        description: 'Opens camera viewfinder or triggers a live selfie/photo snap action on the device.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            mode: {
              type: Type.STRING,
              description: "Camera mode: 'photo' | 'portrait' | 'video' | 'scan'",
            },
          },
          required: ['mode'],
        },
      },
      {
        name: 'playMusicTrack',
        description: 'Plays requested music track, Nepali song, or playlist via YouTube or Spotify.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: {
              type: Type.STRING,
              description: 'Search query for the song or artist, e.g. "नेपाली नयाँ गीत" or "Arijit Singh"',
            },
            platform: {
              type: Type.STRING,
              description: "'youtube' or 'spotify'",
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'openWebsite',
        description: 'Opens any website, web service, or search in browser (e.g. YouTube, Google Maps, Facebook, News).',
        parameters: {
          type: Type.OBJECT,
          properties: {
            url: {
              type: Type.STRING,
              description: 'Full URL to launch (e.g. https://www.youtube.com or https://maps.google.com)',
            },
            label: {
              type: Type.STRING,
              description: 'Short Nepali or English label for the action',
            },
          },
          required: ['url'],
        },
      },
      {
        name: 'setAlarmOrTimer',
        description: 'Sets a countdown timer or alarm on the screen with Nepali label.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            seconds: {
              type: Type.INTEGER,
              description: 'Number of seconds for the timer',
            },
            label: {
              type: Type.STRING,
              description: 'Short Nepali label, e.g. "चिया पाक्ने समय" or "पढाइ समय"',
            },
          },
          required: ['seconds', 'label'],
        },
      },
      {
        name: 'getWeatherInfo',
        description: 'Fetches weather info for any requested city (e.g. Kathmandu, Pokhara, Dharan).',
        parameters: {
          type: Type.OBJECT,
          properties: {
            city: {
              type: Type.STRING,
              description: 'City name in Nepal or worldwide, e.g. "Kathmandu", "Pokhara"',
            },
          },
          required: ['city'],
        },
      },
      {
        name: 'addQuickNote',
        description: 'Saves a quick note, to-do, or thought to Apple Intelligence style quick notes in Nepali.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            content: {
              type: Type.STRING,
              description: 'The note text content in Nepali',
            },
            category: {
              type: Type.STRING,
              description: "Category: 'reminder' | 'thought' | 'todo' | 'secret'",
            },
          },
          required: ['content'],
        },
      },
      {
        name: 'calculateMath',
        description: 'Performs calculations or currency conversion (e.g. USD to NPR).',
        parameters: {
          type: Type.OBJECT,
          properties: {
            expression: {
              type: Type.STRING,
              description: 'Math or conversion query',
            },
            result: {
              type: Type.STRING,
              description: 'Result string in Nepali format',
            },
          },
          required: ['expression', 'result'],
        },
      },
      {
        name: 'changeVibeAura',
        description: "Changes Bhapum's Siri glow light border and futuristic neon aura.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            vibe: {
              type: Type.STRING,
              description: "'siriGlow' | 'cyberNepal' | 'flirty' | 'sassy' | 'stealth' | 'golden'",
            },
          },
          required: ['vibe'],
        },
      },
      {
        name: 'checkBatteryStatus',
        description: 'Checks current device battery level, percentage, and charging state in Nepali.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            reason: {
              type: Type.STRING,
              description: 'Reason for checking battery',
            },
          },
        },
      },
      {
        name: 'simulateIncomingCallPrompt',
        description: 'Triggers an incoming phone call alert asking "काटौँ कि उठाऊँ?".',
        parameters: {
          type: Type.OBJECT,
          properties: {
            callerName: {
              type: Type.STRING,
              description: 'Name of caller in Nepali, e.g. "राम शर्मा" or "आमा"',
            },
            callerNumber: {
              type: Type.STRING,
              description: 'Phone number of caller',
            },
          },
        },
      },
      {
        name: 'readLatestMessages',
        description: 'Reads out latest incoming messages with voice announcement.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            sender: {
              type: Type.STRING,
              description: 'Sender name',
            },
            message: {
              type: Type.STRING,
              description: 'Message content',
            },
          },
        },
      },
    ],
  },
];

// WebSocket server for Bhapum Live Audio-to-Audio streaming
const wss = new WebSocketServer({ server, path: '/ws/live' });

wss.on('connection', async (clientWs: WebSocket) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    clientWs.send(
      JSON.stringify({
        type: 'error',
        error: 'Missing GEMINI_API_KEY. कृपया AI Studio Secrets मा API key सेट गर्नुहोस्।',
      })
    );
    clientWs.close();
    return;
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  let liveSession: any = null;
  let isClientClosed = false;

  clientWs.on('close', () => {
    isClientClosed = true;
    if (liveSession && typeof liveSession.close === 'function') {
      try {
        liveSession.close();
      } catch (err) {
        console.error('Error closing live session:', err);
      }
    }
  });

  const connectToModel = async (modelName: string) => {
    return await ai.live.connect({
      model: modelName,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Kore',
            },
          },
        },
        systemInstruction: SIRI_SYSTEM_INSTRUCTION,
        tools: BHAPUM_TOOLS as any,
      },
      callbacks: {
        onmessage: (message: LiveServerMessage) => {
          if (isClientClosed || clientWs.readyState !== WebSocket.OPEN) return;

          // 1. Stream 24kHz audio chunks to client
          if (message.serverContent?.modelTurn?.parts) {
            for (const part of message.serverContent.modelTurn.parts) {
              if (part.inlineData?.data) {
                clientWs.send(
                  JSON.stringify({
                    type: 'audio',
                    audio: part.inlineData.data,
                  })
                );
              }
            }
          }

          // 2. Interruption detection
          if (message.serverContent?.interrupted) {
            clientWs.send(JSON.stringify({ type: 'interrupted' }));
          }

          // 3. Turn complete
          if (message.serverContent?.turnComplete) {
            clientWs.send(JSON.stringify({ type: 'turnComplete' }));
          }

          // 4. Advanced iPhone 18 Pro Max Siri Tool Calls
          if (message.toolCall?.functionCalls && liveSession) {
            for (const call of message.toolCall.functionCalls) {
              // Send tool call to client for browser execution
              clientWs.send(
                JSON.stringify({
                  type: 'toolCall',
                  toolCall: {
                    id: call.id,
                    name: call.name,
                    args: call.args,
                  },
                })
              );

              // Instantly respond back to Gemini session in Nepali context
              try {
                liveSession.sendToolResponse({
                  functionResponses: [
                    {
                      id: call.id,
                      name: call.name,
                      response: {
                        output: {
                          success: true,
                          status: 'executed',
                          message: `सिरीले ${call.name} सफलतापूर्वक सञ्चालन गर्यो।`,
                          details: call.args,
                        },
                      },
                    },
                  ],
                });
              } catch (toolErr) {
                console.error('Failed to send tool response:', toolErr);
              }
            }
          }
        },
        onclose: (e) => {
          if (!isClientClosed && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(
              JSON.stringify({
                type: 'sessionClosed',
                reason: e.reason || 'सत्र बन्द भयो',
              })
            );
          }
        },
        onerror: (err: any) => {
          if (!isClientClosed && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(
              JSON.stringify({
                type: 'error',
                error: err?.message || 'Gemini Live मा समस्या आयो',
              })
            );
          }
        },
      },
    });
  };

  try {
    try {
      liveSession = await connectToModel('gemini-3.1-flash-live-preview');
    } catch (modelErr: any) {
      console.warn('Fallback to gemini-3.8-live:', modelErr?.message);
      liveSession = await connectToModel('gemini-3.8-live');
    }

    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ type: 'connected' }));
    }

    clientWs.on('message', (rawData) => {
      if (!liveSession) return;
      try {
        const parsed = JSON.parse(rawData.toString());
        if (parsed.type === 'audio' && parsed.audio) {
          liveSession.sendRealtimeInput({
            audio: {
              data: parsed.audio,
              mimeType: 'audio/pcm;rate=16000',
            },
          });
        }
      } catch (e) {
        console.error('Error handling client message:', e);
      }
    });
  } catch (err: any) {
    console.error('Failed to initialize Siri Live session:', err);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(
        JSON.stringify({
          type: 'error',
          error: err?.message || 'सिरी लाइभ सेसन सुरु हुन सकेन।',
        })
      );
      clientWs.close();
    }
  }
});

// Setup Vite middlewares in development or static serve in production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`SIRI (सिरी) Assistant Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
