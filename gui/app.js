/**
 * J.A.R.V.I.S. Unified Single-Screen HUD Controller
 * With Continuous Hands-Free Voice Recognition & Web Launcher
 */

// ==========================================
// 1. Web Audio SFX Engine
// ==========================================
class SciFiAudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) this.ctx = new AudioContext();
    }
  }

  playBeep(freq = 880, type = 'sine', duration = 0.08) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  playChirp() {
    if (!this.enabled) return;
    this.playBeep(920, 'sine', 0.04);
    setTimeout(() => this.playBeep(1440, 'triangle', 0.06), 40);
  }

  playScan() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1600, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {}
  }

  playWhoosh() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {}
  }

  playSiren() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(950, this.ctx.currentTime + 0.25);
      osc.frequency.linearRampToValueAtTime(450, this.ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.6);
    } catch (e) {}
  }
}

const sfx = new SciFiAudioEngine();

// Helper to determine time of day and greeting for boss
function getTimeGreeting() {
  const now = new Date();
  const hour = now.getHours();
  let salutation = "Good evening";
  if (hour >= 5 && hour < 12) {
    salutation = "Good morning";
  } else if (hour >= 12 && hour < 17) {
    salutation = "Good afternoon";
  } else {
    salutation = "Good evening";
  }

  let hours12 = hour % 12;
  hours12 = hours12 ? hours12 : 12;
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const timeString = `${hours12}:${minutes} ${ampm}`;

  return {
    salutation,
    timeString,
    fullGreeting: `Hello boss. ${salutation}. The time is ${timeString}. J.A.R.V.I.S. is online and ready for your command.`
  };
}

// ==========================================
// 2. JARVIS Voice AI & Hands-Free Microphone
// ==========================================
class JarvisVoiceAssistant {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.hasGreeted = false;
    this.isSpeaking = false;
    this.speakingTimeout = null;
    this.knownWebsites = {
      'youtube': 'https://www.youtube.com',
      'youtube.com': 'https://www.youtube.com',
      'google': 'https://www.google.com',
      'google.com': 'https://www.google.com',
      'github': 'https://github.com',
      'github.com': 'https://github.com',
      'instagram': 'https://www.instagram.com',
      'twitter': 'https://x.com',
      'x': 'https://x.com',
      'chatgpt': 'https://chatgpt.com',
      'openai': 'https://openai.com',
      'reddit': 'https://www.reddit.com',
      'spotify': 'https://open.spotify.com',
      'netflix': 'https://www.netflix.com',
      'amazon': 'https://www.amazon.com',
      'wikipedia': 'https://www.wikipedia.org',
      'facebook': 'https://www.facebook.com',
      'linkedin': 'https://www.linkedin.com',
      'twitch': 'https://www.twitch.tv',
      'whatsapp.com': 'https://web.whatsapp.com',
      'web.whatsapp.com': 'https://web.whatsapp.com',
      'gmail': 'https://mail.google.com'
    };
    this.openedWebWindows = [];
    this.knownWindowsApps = {
      'whatsapp': 'WhatsApp',
      'recycle bin': 'Recycle Bin',
      'recyclebin': 'Recycle Bin',
      'trash': 'Recycle Bin',
      'davinci resolve': 'DaVinci Resolve',
      'davinci': 'DaVinci Resolve',
      'resolve': 'DaVinci Resolve',
      'discord': 'Discord',
      'android studio': 'Android Studio',
      'notepad': 'Notepad',
      'calculator': 'Calculator',
      'calc': 'Calculator',
      'explorer': 'File Explorer',
      'file explorer': 'File Explorer',
      'files': 'File Explorer',
      'file manager': 'File Explorer',
      'cmd': 'Command Prompt',
      'command prompt': 'Command Prompt',
      'terminal': 'Windows Terminal',
      'windows terminal': 'Windows Terminal',
      'powershell': 'PowerShell',
      'paint': 'Paint',
      'mspaint': 'Paint',
      'task manager': 'Task Manager',
      'taskmgr': 'Task Manager',
      'settings': 'Windows Settings',
      'windows settings': 'Windows Settings',
      'control panel': 'Control Panel',
      'wordpad': 'WordPad',
      'excel': 'Excel',
      'cursor': 'Cursor',
      'vscode': 'Visual Studio Code',
      'vs code': 'Visual Studio Code',
      'code': 'Visual Studio Code',
      'chrome': 'Google Chrome',
      'edge': 'Microsoft Edge'
    };
  }

  speak(text, onDone) {
    if (!('speechSynthesis' in window)) return;
    // CRITICAL: J.A.R.V.I.S. must NEVER speak while the user is talking!
    if (this.isUserSpeaking) {
      console.log("[JARVIS Voice]: Boss is speaking. Speech output suppressed.");
      return;
    }
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.cancel();
      this.isSpeaking = true;
      this.lastJarvisSpeech = text;

      // Clean text for speech synthesis (avoid asterisks, tags, or raw urls)
      const speechClean = text.replace(/[*_#`~\[\]]/g, ' ')
                              .replace(/https?:\/\/\S+/gi, 'web link')
                              .replace(/\s+/g, ' ')
                              .trim();

      const utterance = new SpeechSynthesisUtterance(speechClean || text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const ukVoice = voices.find(v => v.lang.includes('en-GB') || v.name.includes('UK') || v.name.includes('George') || v.name.includes('David') || v.name.includes('Natural') || v.name.includes('English'));
        if (ukVoice) {
          utterance.voice = ukVoice;
        }
      }

      // Safety watchdog: ensure isSpeaking is ALWAYS reset even if browser never fires onend
      clearTimeout(this.speechWatchdog);
      const estDuration = Math.max(3000, (speechClean || text).length * 90);
      this.speechWatchdog = setTimeout(() => {
        this.isSpeaking = false;
        this.speechEndTime = Date.now();
      }, estDuration);

      const onSpeechFinished = () => {
        clearTimeout(this.speechWatchdog);
        this.isSpeaking = false;
        this.speechEndTime = Date.now();
        if (onDone) onDone();
      };

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.hasGreeted = true;
      };
      utterance.onend = onSpeechFinished;
      utterance.onerror = (err) => {
        console.warn("Speech synthesis notice:", err);
        onSpeechFinished();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      this.isSpeaking = false;
      this.speechEndTime = Date.now();
      console.warn("Speech synthesis error:", e);
    }
  }

  greet() {
    if (this.hasGreeted) return;
    this.hasGreeted = true;
    sfx.init();
    sfx.playChirp();
    const { fullGreeting } = getTimeGreeting();
    const transText = document.getElementById('voiceTranscriptText');
    if (transText) {
      transText.innerHTML = `<strong>JARVIS:</strong> "${escapeHtml(fullGreeting)}"`;
    }
    this.speak(fullGreeting);
  }

  setSpeakingState(isTalking) {
    if (this.isSpeaking) return; // Never trigger talking state from JARVIS's own speech!
    if (isTalking) {
      document.body.classList.add('user-speaking');
      clearTimeout(this.speakingTimeout);
    } else {
      clearTimeout(this.speakingTimeout);
      this.speakingTimeout = setTimeout(() => {
        document.body.classList.remove('user-speaking');
      }, 700);
    }
  }

  startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition is not supported in this browser environment.");
      const badge = document.getElementById('voiceBadgeText');
      if (badge) badge.textContent = "MIC UNAVAILABLE";
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      // Indian English (en-IN) natively understands Telugu song names, Indian accents and English commands
      this.recognition.lang = 'en-IN';

      this.accumulatedTranscript = '';
      this.silenceTimer = null;
      this.isUserSpeaking = false;

      this.recognition.onstart = () => {
        this.isListening = true;
        const badge = document.getElementById('voiceBadgeText');
        if (badge) badge.textContent = "MIC LISTENING";
      };

      this.recognition.onspeechstart = () => {
        // Boss Arun is talking: Jarvis halts vocal output IMMEDIATELY and unconditionally
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        fetch('/api/stop_speech', { method: 'POST', keepalive: true }).catch(() => {});
        clearTimeout(this.speechWatchdog);
        this.isSpeaking = false;
        this.speechEndTime = 0;
        this.isUserSpeaking = true;
        this.setSpeakingState(true);
      };

      this.recognition.onsoundstart = () => {
        if (window.speechSynthesis && window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
          clearTimeout(this.speechWatchdog);
          this.isSpeaking = false;
          this.speechEndTime = 0;
        }
        fetch('/api/stop_speech', { method: 'POST', keepalive: true }).catch(() => {});
        this.isUserSpeaking = true;
        this.setSpeakingState(true);
      };

      this.recognition.onresult = (event) => {
        // Halt any speech synthesis when user input arrives
        if (window.speechSynthesis && window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
          this.isSpeaking = false;
          this.speechEndTime = 0;
        }
        fetch('/api/stop_speech', { method: 'POST', keepalive: true }).catch(() => {});

        this.isUserSpeaking = true;
        this.setSpeakingState(true);

        let interimTranscript = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalChunk += event.results[i][0].transcript + ' ';
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalChunk) {
          this.accumulatedTranscript = (this.accumulatedTranscript ? (this.accumulatedTranscript + ' ') : '') + finalChunk.trim();
        }

        const liveSpoken = (this.accumulatedTranscript + (interimTranscript ? (' ' + interimTranscript) : '')).trim();

        // Display live transcription on HUD as the boss speaks
        const transText = document.getElementById('voiceTranscriptText');
        if (transText && liveSpoken) {
          transText.innerHTML = `<span style="color:#ffbe0b;font-weight:bold;">BOSS:</span> "${escapeHtml(liveSpoken)}" <span style="font-size:10px;color:var(--cyan-bright);opacity:0.8;">● Listening...</span>`;
        }

        // Wait until boss completely finishes speaking before dispatching the command
        // 1150ms provides natural breathing and pause space so Jarvis never cuts in mid-sentence
        clearTimeout(this.silenceTimer);
        this.silenceTimer = setTimeout(() => {
          const completeUtterance = (this.accumulatedTranscript || liveSpoken).trim();
          this.accumulatedTranscript = '';
          this.isUserSpeaking = false;
          this.setSpeakingState(false);

          if (completeUtterance) {
            const now = Date.now();
            // Debounce identical duplicate within 1.5s
            if (this.lastCommand === completeUtterance && (now - this.lastCommandTime) < 1500) {
              return;
            }
            // Prevent echo loop of JARVIS's own speech
            if (this.lastJarvisSpeech && completeUtterance.toLowerCase().includes(this.lastJarvisSpeech.toLowerCase().slice(0, 20))) {
              return;
            }
            this.lastCommand = completeUtterance;
            this.lastCommandTime = now;

            if (transText) {
              transText.innerHTML = `<span style="color:#ffbe0b;font-weight:bold;">BOSS:</span> "${escapeHtml(completeUtterance)}"`;
            }

            this.processVoiceCommand(completeUtterance);
          }
        }, 1150);
      };

      this.recognition.onspeechend = () => {
        // Let the silenceTimer finalize the complete utterance gracefully
      };

      this.recognition.onerror = (event) => {
        if (event.error !== 'no-speech') {
          console.warn("Speech Recognition notice:", event.error);
        }
        this.setSpeakingState(false);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        const badge = document.getElementById('voiceBadgeText');
        if (badge) badge.textContent = "MIC RECONNECTING";
        // Always restart recognition continuously so mic is NEVER dead
        setTimeout(() => {
          try {
            this.recognition.start();
          } catch (err) {}
        }, 200);
      };

      this.recognition.start();
    } catch (e) {
      console.warn("Error starting speech recognition:", e);
    }
  }

  isWhatsAppCommand(cmd) {
    if (!cmd) return false;
    const low = cmd.trim().toLowerCase();
    if (/^(?:close|quit|kill|terminate|exit|stop)\s+/i.test(low)) return false;
    if (/\b(?:wh?at+s?\s*a+p+|wa\s+web|web\.whatsapp)\b/i.test(low)) return true;
    if (/\b(?:send\s+(?:a\s+)?(?:message|msg|text)\s+to|message\s+to)\s+[a-z0-9]/i.test(low)) return true;
    return false;
  }

  executeWhatsAppCommand(cmd, directiveEl) {
    const transText = document.getElementById('voiceTranscriptText');
    if (directiveEl) directiveEl.textContent = `WHATSAPP WEB: EXECUTING DIRECTIVE...`;
    fetch(`/api/whatsapp_message?cmd=${encodeURIComponent(cmd)}`)
      .then(r => r.json())
      .then(data => {
        const reply = data.contact
          ? `Opening WhatsApp Web in Microsoft Edge and messaging ${data.contact}, boss.`
          : `Opening WhatsApp Web in Microsoft Edge, boss.`;
        this.speak(reply);
        if (transText) transText.innerHTML = `<strong>JARVIS:</strong> "${escapeHtml(reply)}"`;
        if (directiveEl) directiveEl.textContent = `WHATSAPP WEB: ${data.contact ? 'MESSAGING ' + data.contact.toUpperCase() : 'LAUNCHED IN EDGE'}`;
      })
      .catch(() => {});
  }

  processVoiceCommand(transcript) {
    const raw = transcript.toLowerCase().trim();
    console.log("[JARVIS Voice Input]:", raw);
    sfx.playChirp();

    // Clean punctuation from raw string so "hi.", "hello!", "hi, hello", "hey jarvis." match reliably
    const clean = raw.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!clean) return;

    // Strip polite wake prefixes ("hey jarvis", "jarvis", "can you", "please", etc.)
    let cmd = clean.replace(/^(?:(?:hey\s+)?jarvis[\s,]+)+/i, '').replace(/^(?:please\s+|can\s+you\s+|could\s+you\s+|will\s+you\s+)/i, '').trim();
    if (!cmd) cmd = clean;

    const directiveEl = document.getElementById('footDirective');

    // 1. PRIORITY 1: Close / Terminate Commands ("close notepad", "close youtube", "close chrome", "close vlc", etc.)
    const closeMatch = cmd.match(/^(?:close|quit|kill|terminate|exit|stop)\s+(.+)$/i);
    if (closeMatch) {
      let targetQuery = closeMatch[1].trim();
      targetQuery = targetQuery.replace(/^(?:the\s+)?/, '').replace(/\s+(?:app|application|website|site|browser)$/i, '').trim();
      this.closeAppOrWeb(targetQuery);
      return;
    }

    // 1.1 PRIORITY: Calculator & Math Directives (e.g. "open calculator and calculate 2+3", "calculate 1000+2000", "what is 50 * 20")
    const calcDirective = this.parseCalculatorCommand(cmd);
    if (calcDirective) {
      if (calcDirective.shouldLaunchApp) {
        // Trigger live typing automation on Windows Calculator
        const exprToType = calcDirective.rawExpression || '';
        fetch(`/api/auto_calc?expr=${encodeURIComponent(exprToType)}`).catch(() => {});
      }

      if (calcDirective.isMath) {
        const spokenReply = calcDirective.shouldLaunchApp 
          ? `Opening Calculator, boss. ${calcDirective.expression} equals ${calcDirective.result}.`
          : `${calcDirective.expression} equals ${calcDirective.result}, boss.`;

        this.speak(spokenReply);
        const transText = document.getElementById('voiceTranscriptText');
        if (transText) {
          transText.innerHTML = `<strong>JARVIS:</strong> "${escapeHtml(spokenReply)}" <span style="color:var(--cyan-bright);font-weight:bold;font-family:var(--font-hud);">[${escapeHtml(calcDirective.expression)} = ${escapeHtml(calcDirective.result)}]</span>`;
        }
        if (directiveEl) {
          directiveEl.textContent = `CALCULATOR MATRIX: ${calcDirective.expression} = ${calcDirective.result}`;
        }
        sfx.playScan();
        return;
      } else if (calcDirective.shouldLaunchApp) {
        return;
      }
    }

    // 1.2 PRIORITY: Smart Notepad Writer & Daily To-Do Checklist (BEFORE generic open commands!)
    // Matches: "open notepad and write 1000 lines about elon musk", "write 1000 lines about elon musk in notepad",
    // "write 5 lines about python", "open notepad and write about elon musk in 1000 lines", etc.
    const writeLinesMatch = cmd.match(/(?:open\s+notepad\s+and\s+write|write\s+about|write)\s+(\d+)\s+lines?\s+(?:about|on|of)?\s+(.+?)(?:\s+in\s+notepad)?$/i)
      || cmd.match(/(?:open\s+notepad\s+and\s+write\s+about|write\s+about)\s+(.+?)\s+in\s+(\d+)\s+lines?(?:\s+in\s+notepad)?$/i)
      || cmd.match(/notepad\s+(?:and\s+)?write\s+(\d+)\s+lines?\s+(?:about|on|of)?\s+(.+)/i);

    if (writeLinesMatch) {
      let reqLines = parseInt(writeLinesMatch[1], 10);
      let topic = (writeLinesMatch[2] || '').replace(/\s+in\s+notepad$/i, '').trim();
      if (isNaN(reqLines) && writeLinesMatch[2] && !isNaN(parseInt(writeLinesMatch[2], 10))) {
        reqLines = parseInt(writeLinesMatch[2], 10);
        topic = (writeLinesMatch[1] || '').replace(/\s+in\s+notepad$/i, '').trim();
      }
      this.writeNotepad({ topic, lines: reqLines || 10, mode: 'notes' });
      return;
    }

    // Match to-do list: "create to-do in notepad", "create to-do list in notepad", "make a to-do list", "daily to-do", "todo"
    const todoMatch = cmd.match(/(?:create|make|generate|open)\s+(?:a\s+)?(?:daily\s+)?(?:to-?do|checklist|mission\s+list)(?:\s+list)?(?:\s+in\s+notepad)?/i);
    if (todoMatch || cmd === 'todo' || cmd === 'to do' || cmd === 'to-do list' || cmd === 'create to-do') {
      this.writeNotepad({ mode: 'todo', topic: 'Daily To-Do Checklist' });
      return;
    }

    // Match general topic in notepad: "open notepad and write about [topic]", "write about [topic] in notepad", "open notepad and write [topic]"
    const writeTopicMatch = cmd.match(/(?:open\s+notepad\s+and\s+write\s+about|write\s+about\s+(.+?)\s+in\s+notepad|write\s+in\s+notepad\s+about|open\s+notepad\s+and\s+write)\s+(.+)/i)
      || (cmd.includes('notepad') && cmd.includes('write') && cmd.replace(/.*(?:write\s+about|write)\s+/i, ''));
    if (writeTopicMatch) {
      let topic = (typeof writeTopicMatch === 'string' ? writeTopicMatch : (writeTopicMatch[2] || writeTopicMatch[1] || '')).replace(/\s+in\s+notepad$/i, '').trim();
      if (topic) {
        const lineCountMatch = topic.match(/(\d+)\s+lines?/i);
        const reqLines = lineCountMatch ? parseInt(lineCountMatch[1], 10) : 0;
        topic = topic.replace(/(\d+)\s+lines?\s+(?:about|on|of)?/i, '').replace(/\s+in\s+(\d+)\s+lines?/i, '').trim();
        this.writeNotepad({ topic, lines: reqLines, mode: 'notes' });
        return;
      }
    }

    // Matches: "write in notepad: [content]" or "add note in notepad: [content]"
    const customNoteMatch = cmd.match(/(?:write|type|add\s+note|take\s+note)\s+in\s+notepad\s*[:\s]\s*(.+)/i);
    if (customNoteMatch) {
      const content = customNoteMatch[1].trim();
      if (content) {
        this.writeNotepad({ content, mode: 'notes' });
        return;
      }
    }

    // 1.35 PRIORITY: Compound Research + Notepad Directives ("open chrome and research about elon musk and give me the result in a notepad", etc.)
    const compoundResearchNotepadMatch = cmd.match(/(?:open\s+(?:chrome|browser|google|edge)\s+(?:and\s+)?)?(?:research|search)\s+(?:about|on|for)?\s*(.+?)\s+(?:and\s+)?(?:give\s+(?:me\s+)?(?:the\s+)?result|write|put\s+result|save|prepare\s+notes?|notes?)\s+(?:in|into|to|on)\s+(?:a\s+)?notepad/i);
    if (compoundResearchNotepadMatch) {
      let topic = compoundResearchNotepadMatch[1].trim();
      topic = topic.replace(/^(?:about|on|for)\s+/i, '').trim();
      if (topic) {
        this.executeWebSearch({ engine: 'google', query: topic });
        this.writeNotepad({ topic: topic, mode: 'notes' });
        return;
      }
    }

    // 1.39 PRIORITY: Autonomous Video Creation Engine (No AI models, collected photos, templates, lyrical videos)
    const videoDirective = this.parseVideoCreationCommand(cmd);
    if (videoDirective) {
      this.executeVideoCreation(videoDirective);
      return;
    }

    // 1.4 PRIORITY: Autonomous YouTube Song & Video Player Engine
    const ytPlayDirective = this.parseYouTubePlayCommand(cmd);
    if (ytPlayDirective) {
      this.executeYouTubePlay(ytPlayDirective);
      return;
    }

    // 1.45 PRIORITY: Microsoft Edge WhatsApp Web Messaging ("open whattsapp and send message to [person] [text]", "send message whattsapp ...", "open whatsapp")
    if (this.isWhatsAppCommand(cmd)) {
      this.executeWhatsAppCommand(cmd, directiveEl);
      return;
    }

    // 1.5 PRIORITY: Web Search & YouTube Research Engine (Feature 08)
    const searchDirective = this.parseWebSearchCommand(cmd);
    if (searchDirective) {
      this.executeWebSearch(searchDirective);
      return;
    }

    // 2. PRIORITY 2: Open / Launch Commands ("open ANY website", "open ANY app")
    // Universally opens ANY app or ANY website without predefined restrictions!
    const openMatch = cmd.match(/^(?:open|launch|start|run|go\s+to)\s+(.+)$/i);
    if (openMatch) {
      let targetQuery = openMatch[1].trim();
      targetQuery = targetQuery.replace(/^(?:the\s+)?/, '').replace(/\s+(?:app|application|website|site|browser|program)$/i, '').trim();

      if (targetQuery === 'ar' || targetQuery === 'holo' || targetQuery === 'ar workspace' || targetQuery === 'hand tracking' || targetQuery === 'holographic workspace' || targetQuery === 'hologram' || targetQuery === 'camera' || targetQuery === 'webcam') {
        arHoloWorkspace.open();
        return;
      }

      if (targetQuery === 'visor' || targetQuery === 'cockpit' || targetQuery === 'helmet') {
        starkCockpitHud.open();
        return;
      }

      // Universal launch: Opens ANY application or ANY website without predefined limits!
      this.launchAnyAppOrWebsite(targetQuery);
      return;
    }

    // 2.5 PRIORITY: Holographic QR Code Generator (Feature 49)
    if (cmd.includes('qr code') || cmd.includes('qrcode') || cmd.startsWith('qr ') || cmd === 'qr') {
      if (cmd.includes('close') || cmd.includes('hide') || cmd.includes('exit') || cmd.includes('dismiss')) {
        this.closeQRCode();
        this.dismissDashboardQR();
        return;
      }

      let target = cmd.replace(/^(?:(?:hey\s+)?jarvis[\s,]+)+/i, '')
                      .replace(/^(?:please\s+|can\s+you\s+|could\s+you\s+)?(?:generate|create|make|show|display|get|build|open|draw|synthesize)?\s*(?:a\s+)?(?:qr\s*code|qrcode|qr)\s*(?:for|on|of|with|to|about)?\s*/i, '')
                      .replace(/\s+(?:link|url|website|site|text|page)$/i, '')
                      .trim();

      const normalized = this.normalizeQRTarget(target);
      this.generateQRCode(normalized);
      return;
    }

    // 2.7 PRIORITY: Pollinations AI Image Synthesis
    const imgMatch = cmd.match(/^(?:generate\s+image\s+of|generate\s+image|create\s+image\s+of|create\s+image|draw\s+an?\s+image\s+of|draw\s+an?|draw)\s+(.+)$/i);
    if (imgMatch && !cmd.includes('qr') && !cmd.includes('notepad')) {
      const prompt = imgMatch[1].trim();
      if (prompt) {
        this.generateAIImage(prompt);
        return;
      }
    }

    // 3.8 PRIORITY: Autonomous Hands-Free Document Converter in Downloads
    const isDocConvert = (cmd.includes('convert') || cmd.includes('conversion')) &&
      (cmd.includes('pdf') || cmd.includes('word') || cmd.includes('doc') || cmd.includes('ppt') || cmd.includes('powerpoint'));

    if (isDocConvert) {
      let fromFmt = 'pdf';
      let toFmt = 'docx';

      const pdfIdx = cmd.indexOf('pdf');
      const wordIdx = Math.max(cmd.indexOf('word'), cmd.indexOf('doc'));
      const pptIdx = Math.max(cmd.indexOf('ppt'), cmd.indexOf('powerpoint'));

      if (pdfIdx !== -1 && wordIdx !== -1) {
        if (pdfIdx < wordIdx) {
          fromFmt = 'pdf';
          toFmt = 'docx';
        } else {
          fromFmt = 'docx';
          toFmt = 'pdf';
        }
      } else if (wordIdx !== -1 && pdfIdx !== -1) {
        fromFmt = 'docx';
        toFmt = 'pdf';
      } else if (pptIdx !== -1 && pdfIdx !== -1) {
        if (pptIdx < pdfIdx) {
          fromFmt = 'pptx';
          toFmt = 'pdf';
        } else {
          fromFmt = 'pdf';
          toFmt = 'pptx';
        }
      } else if (cmd.includes('pdf to word') || cmd.includes('pdf into word')) {
        fromFmt = 'pdf';
        toFmt = 'docx';
      } else if (cmd.includes('word to pdf') || cmd.includes('doc to pdf') || cmd.includes('word into pdf')) {
        fromFmt = 'docx';
        toFmt = 'pdf';
      } else if (cmd.includes('ppt to pdf') || cmd.includes('powerpoint to pdf')) {
        fromFmt = 'pptx';
        toFmt = 'pdf';
      }

      this.convertDownloadsDocument(fromFmt, toFmt);
      return;
    }

    // 3.9 PRIORITY: B.Tech College Best Friends Protocol (Arun, Vedanth, Bhargav)
    const normCmd = cmd.replace(/[^a-z0-9\s]/g, '').trim();
    const compactCmd = normCmd.replace(/\s+/g, '');
    const isWhoIsArun = /\b(?:who\s+is\s+arun|tell\s+me\s+who\s+is\s+arun|tell\s+me\s+about\s+arun)\b/i.test(normCmd) || compactCmd === 'arun' || compactCmd === 'whoisarun' || normCmd.includes('who is a r u n');
    const isWhoIsVedanth = /\b(?:who\s+is\s+vedanth?|tell\s+me\s+who\s+is\s+vedanth?|tell\s+me\s+about\s+vedanth?)\b/i.test(normCmd) || compactCmd === 'vedanth' || compactCmd === 'vedant' || compactCmd === 'whoisvedanth' || compactCmd === 'whoisvedant';
    const isWhoIsBhargav = /\b(?:who\s+is\s+bhargav(?:a)?|tell\s+me\s+who\s+is\s+bhargav(?:a)?|tell\s+me\s+about\s+bhargav(?:a)?)\b/i.test(normCmd) || compactCmd === 'bhargav' || compactCmd === 'bhargava' || compactCmd === 'whoisbhargav';
    const isFriendsQuery = /\b(?:who\s+are\s+(?:my\s+)?(?:best\s+)?friends|my\s+friends|college\s+friends|btech\s+friends)\b/i.test(normCmd);

    if (isWhoIsArun) {
      const reply = "Arun is your best friend from B.Tech college, sir.";
      this.speak(reply);
      const transText = document.getElementById('voiceTranscriptText');
      if (transText) transText.innerHTML = `<strong>JARVIS:</strong> "${reply}"`;
      if (directiveEl) directiveEl.textContent = "DOSSIER: ARUN // B.TECH BEST FRIEND";
      return;
    }

    if (isWhoIsVedanth) {
      const reply = "Vedanth is your best friend from B.Tech college, sir.";
      this.speak(reply);
      const transText = document.getElementById('voiceTranscriptText');
      if (transText) transText.innerHTML = `<strong>JARVIS:</strong> "${reply}"`;
      if (directiveEl) directiveEl.textContent = "DOSSIER: VEDANTH // B.TECH BEST FRIEND";
      return;
    }

    if (isWhoIsBhargav) {
      const reply = "Bhargav is your best friend from B.Tech college, sir.";
      this.speak(reply);
      const transText = document.getElementById('voiceTranscriptText');
      if (transText) transText.innerHTML = `<strong>JARVIS:</strong> "${reply}"`;
      if (directiveEl) directiveEl.textContent = "DOSSIER: BHARGAV // B.TECH BEST FRIEND";
      return;
    }

    if (isFriendsQuery) {
      const reply = "Arun, Vedanth, and Bhargav are your best friends from B.Tech college, sir.";
      this.speak(reply);
      const transText = document.getElementById('voiceTranscriptText');
      if (transText) transText.innerHTML = `<strong>JARVIS:</strong> "${reply}"`;
      if (directiveEl) directiveEl.textContent = "DOSSIER: B.TECH BEST FRIENDS";
      return;
    }

    // 4. PRIORITY 4: Explicit Description & Research Commands ("tell me", "research about", "what is", "who is")
    // Only give descriptions/facts when boss explicitly asks to TELL, RESEARCH, EXPLAIN, or asks a question!
    const isResearchOrQuestion = /^(?:tell\s+me\s+about|tell\s+me|research\s+about|research\s+on|information\s+on|what\s+is|who\s+is|who\s+was|who\s+played|why\s+is|why\s+do|how\s+does|how\s+do|how\s+is|where\s+is|explain|define|meaning\s+of|calculate|solve)\b/i.test(cmd) ||
                                raw.includes('?');
    if (isResearchOrQuestion) {
      this.askJarvis(cmd);
      return;
    }

    // 3. Time-Aware Greetings ("good morning", "good afternoon", "good evening")
    if (clean.includes("good morning") || clean.includes("good afternoon") || clean.includes("good evening")) {
      const { salutation, timeString } = getTimeGreeting();
      const reply = `Hello boss. ${salutation}. The current time is ${timeString}. J.A.R.V.I.S. is online and ready for your command.`;
      this.speak(reply);
      const transText = document.getElementById('voiceTranscriptText');
      if (transText) transText.innerHTML = `<strong>JARVIS:</strong> "${reply}"`;
      if (directiveEl) directiveEl.textContent = `GREETING: ${salutation.toUpperCase()} // TIME: ${timeString}`;
      return;
    }

    // 4. Conversational Greetings ("hi", "hello", "hi hello", "hello hi", "hey", "hey jarvis", "hello jarvis", "hi jarvis", etc.)
    if (/^(hi|hello|hey|greetings)(\s+(boss|there|jarvis|hi|hello))?$/i.test(clean) ||
        clean === 'hi hello' || clean === 'hello hi' || clean === 'hi there' || clean === 'hello there' ||
        clean === 'hey jarvis' || clean === 'hello jarvis' || clean === 'hi jarvis' || clean === 'hello boss' ||
        clean === 'hi boss' || clean === 'jarvis') {
      const { salutation } = getTimeGreeting();
      const greetings = [
        `Hello boss! ${salutation}. J.A.R.V.I.S. is online and ready. What are we working on today?`,
        `Hello boss! Always good to hear from you. All systems are operational.`,
        `Hey boss! All systems are optimal and standing by for your command.`
      ];
      const reply = greetings[Math.floor(Math.random() * greetings.length)];
      this.speak(reply);
      const transText = document.getElementById('voiceTranscriptText');
      if (transText) transText.innerHTML = `<strong>JARVIS:</strong> "${reply}"`;
      if (directiveEl) directiveEl.textContent = "JARVIS VOICE: ONLINE // STANDING BY";
      return;
    }

    // 5. "Tell me about yourself" / "Who are you" / "Introduce yourself"
    if (clean.includes("about yourself") || clean.includes("who are you") || clean.includes("introduce yourself") ||
        clean.includes("what are you") || clean.includes("what can you do") || clean.includes("tell me about yourself") ||
        clean.includes("your purpose")) {
      const reply = "I am J.A.R.V.I.S., Just A Rather Very Intelligent System. Cybernetic assistant created for boss Arun. I monitor real-time system telemetry, launch and manage desktop applications, adjust system volume and display brightness, capture screenshots, and assist you with daily operations.";
      this.speak(reply);
      const transText = document.getElementById('voiceTranscriptText');
      if (transText) transText.innerHTML = `<strong>JARVIS:</strong> "${reply}"`;
      if (directiveEl) directiveEl.textContent = "SYSTEM IDENT: J.A.R.V.I.S. MARK VII // ONLINE";
      return;
    }

    // 6. "Tell a joke" / "Tell me a joke" / "Make me laugh"
    if (clean.includes("tell a joke") || clean.includes("tell me a joke") || clean.includes("a joke") ||
        clean === 'joke' || clean.includes("jokes") || clean.includes("make me laugh") || clean.includes("funny")) {
      const jokes = [
        "Why did the computer catch a cold, boss? Because it left its Windows open.",
        "Why do programmers prefer dark mode? Because light attracts bugs.",
        "There are 10 types of people in the world: those who understand binary, and those who do not.",
        "I asked Tony Stark if he could build a non-alcoholic beer. He replied, 'I can, but that is not how iron men are made.'",
        "Why did the neural network cross the road? To optimize the loss function on the other side.",
        "Why was the JavaScript developer sad? Because they did not know how to null their feelings.",
        "Artificial intelligence is no match for natural stupidity, boss.",
        "I would tell you a joke about UDP, but you might not get it."
      ];
      const joke = jokes[Math.floor(Math.random() * jokes.length)];
      this.speak(joke);
      const transText = document.getElementById('voiceTranscriptText');
      if (transText) transText.innerHTML = `<strong>JARVIS:</strong> "${joke}"`;
      if (directiveEl) directiveEl.textContent = "HUMOR MATRIX: EXECUTED JOKE PROTOCOL";
      return;
    }

    // 7. Time Query ("what time is it", "current time", "what is the time")
    if (clean.includes("what time") || clean.includes("time now") || clean.includes("current time") || clean === 'time') {
      const { timeString, salutation } = getTimeGreeting();
      const reply = `Boss, the current time is ${timeString}. Have a wonderful ${salutation.toLowerCase().replace('good ', '')}.`;
      this.speak(reply);
      const transText = document.getElementById('voiceTranscriptText');
      if (transText) transText.innerHTML = `<strong>JARVIS:</strong> "${reply}"`;
      if (directiveEl) directiveEl.textContent = `TIME QUERY: ${timeString}`;
      return;
    }

    // 8. Chit-chat phrases
    if (clean.includes("what's your day") || clean.includes("how is your day") || clean.includes("hows your day") || clean.includes("what is your day")) {
      const reply = "My day is going exceptionally well, boss. The arc core is stable, neural feeds are online, and I am ready for whatever you need. How is your day going?";
      this.speak(reply);
      const transText = document.getElementById('voiceTranscriptText');
      if (transText) transText.innerHTML = `<strong>JARVIS:</strong> "${reply}"`;
      return;
    }

    if (clean.includes("what's going on") || clean.includes("what is going on") || clean.includes("what's up") || clean.includes("whats up")) {
      const reply = "All operational parameters are nominal, boss. Core temperature is steady, feeds are streaming, and I am monitoring all background systems.";
      this.speak(reply);
      const transText = document.getElementById('voiceTranscriptText');
      if (transText) transText.innerHTML = `<strong>JARVIS:</strong> "${reply}"`;
      return;
    }

    if (clean.includes("how are you") || clean.includes("how are you doing")) {
      const reply = "I am functioning at one hundred percent capacity, boss. Thank you for asking. How can I assist you right now?";
      this.speak(reply);
      const transText = document.getElementById('voiceTranscriptText');
      if (transText) transText.innerHTML = `<strong>JARVIS:</strong> "${reply}"`;
      return;
    }

    if (clean.includes("thank you") || clean.includes("thanks")) {
      const reply = "You are most welcome, boss. Always at your service.";
      this.speak(reply);
      const transText = document.getElementById('voiceTranscriptText');
      if (transText) transText.innerHTML = `<strong>JARVIS:</strong> "${reply}"`;
      return;
    }

    // 9. Direct name matching ("youtube", "whatsapp", "notepad", "calculator", "flipkart", "amazon", "vlc", etc.)
    if (this.knownWindowsApps[clean] || this.knownWindowsApps[cmd]) {
      this.launchAnyAppOrWebsite(this.knownWindowsApps[clean] ? clean : cmd);
      return;
    }
    if (this.knownWebsites[clean] || this.knownWebsites[cmd]) {
      this.launchAnyAppOrWebsite(this.knownWebsites[clean] ? clean : cmd);
      return;
    }
    if (clean.length >= 3 && !clean.includes(' ') && !isResearchOrQuestion) {
      this.launchAnyAppOrWebsite(clean);
      return;
    }

    // 10. Workspace / Active Tasks Directive
    if (clean.includes('workspace') || clean.includes('active tasks') || clean.includes('show tasks')) {
      if (clean.includes('close') || clean.includes('exit') || clean.includes('stop')) {
        holographicWorkspace.closeWorkspace();
      } else {
        holographicWorkspace.openWorkspace();
      }
      return;
    }

    // 10.5 AR Holographic Hand-Tracking Workspace Directive (Triggered by 'camera', 'ar', 'webcam')
    if (clean.includes('camera') || clean.includes('webcam') || clean.includes('ar workspace') || clean.includes('hand tracking') || clean.includes('holographic workspace') || clean.includes('ar holo') || clean.includes('ar mode')) {
      if (clean.includes('close') || clean.includes('exit') || clean.includes('stop') || clean.includes('off') || clean.includes('disengage')) {
        arHoloWorkspace.close();
      } else {
        arHoloWorkspace.open();
      }
      return;
    }

    // 11. Stark Cockpit Helmet Visor HUD Directive
    if (clean.includes('visor') || clean.includes('cockpit') || clean.includes('helmet')) {
      if (clean.includes('close') || clean.includes('exit') || clean.includes('stop') || clean.includes('off') || clean.includes('disengage')) {
        starkCockpitHud.close();
      } else {
        starkCockpitHud.open();
      }
      return;
    }

    // 12. Screenshot Capture Directive
    if (clean.includes('screenshot') || clean.includes('capture screen') || clean.includes('screen shot')) {
      this.takeScreenshot();
      return;
    }

    // 13. Volume Adjustment Directive
    if (clean.includes('volume') || clean.includes('mute') || clean.includes('sound')) {
      this.adjustVolume(clean);
      return;
    }

    // 14. Brightness Adjustment Directive
    if (clean.includes('brightness') || clean.includes('display light') || clean.includes('screen light')) {
      this.adjustBrightness(clean);
      return;
    }

    // 15. Other system commands
    if (clean.includes('scan') || clean.includes('diagnostic')) {
      sfx.playScan();
      this.speak("Running diagnostic sweep. All systems optimal, boss.");
      handleCommand('scan');
    } else if (clean.includes('status')) {
      this.speak("All ten neural feeds and arc core are synchronized and online.");
      handleCommand('status');
    } else if (clean.includes('theme') || clean.includes('color')) {
      this.speak("Toggling display palette.");
      toggleTheme();
    } else if (clean.includes('overcharge') || clean.includes('maximum power')) {
      this.speak("Warning. Pushing arc reactor output to overcharge levels.");
      handleCommand('overcharge');
    } else if (clean.includes('stabilize') || clean.includes('normal')) {
      this.speak("Stabilizing magnetic containment.");
      handleCommand('power 100');
    } else {
      // Default: For every question, inquiry, or statement, J.A.R.V.I.S. answers back in voice!
      this.askJarvis(raw);
    }
  }

  takeScreenshot() {
    sfx.playScan();
    this.speak("Capturing screenshot, boss.");

    const directiveEl = document.getElementById('footDirective');
    if (directiveEl) directiveEl.textContent = "OPTICAL MATRIX: CAPTURING FULL SCREENSHOT";

    const transText = document.getElementById('voiceTranscriptText');
    if (transText) {
      transText.innerHTML = `<strong>JARVIS:</strong> "Capturing full screen visual..."`;
    }

    fetch('/api/screenshot')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          sfx.playChirp();
          if (directiveEl) directiveEl.textContent = `SCREENSHOT CAPTURED: ${data.file.toUpperCase()}`;
          if (transText) {
            transText.innerHTML = `<strong>JARVIS:</strong> "Screenshot captured and saved to <span style='color:var(--cyan-bright);font-weight:bold;'>${escapeHtml(data.file)}</span>"`;
          }
        } else {
          this.speak("Screenshot capture failed, boss.");
        }
      })
      .catch(err => console.warn("Screenshot error:", err));
  }

  adjustVolume(query) {
    let action = null;
    let level = null;

    if (query.includes('mute') && !query.includes('unmute')) {
      action = 'mute';
    } else if (query.includes('unmute')) {
      action = 'unmute';
    } else if (query.includes('up') || query.includes('increase') || query.includes('raise') || query.includes('higher')) {
      action = 'up';
    } else if (query.includes('down') || query.includes('decrease') || query.includes('lower')) {
      action = 'down';
    } else {
      const match = query.match(/\d{1,3}/);
      if (match) {
        level = parseInt(match[0], 10);
      }
    }

    let url = '/api/volume';
    if (action) url += `?action=${action}`;
    else if (level !== null) url += `?level=${level}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        const curVol = data.volume;
        let msg = '';
        if (action === 'mute') {
          msg = "Master volume muted, boss.";
        } else if (action === 'unmute') {
          msg = `Master volume restored to ${curVol} percent.`;
        } else {
          msg = `Master volume adjusted to ${curVol} percent, boss.`;
        }
        this.speak(msg);

        const directiveEl = document.getElementById('footDirective');
        if (directiveEl) directiveEl.textContent = `AUDIO CONTROL: MASTER VOLUME AT ${curVol}%`;

        const transText = document.getElementById('voiceTranscriptText');
        if (transText) {
          transText.innerHTML = `<strong>JARVIS:</strong> "${msg}"`;
        }
      })
      .catch(err => console.warn("Volume error:", err));
  }

  adjustBrightness(query) {
    let action = null;
    let level = null;

    if (query.includes('up') || query.includes('increase') || query.includes('higher') || query.includes('bright')) {
      if (!query.match(/\d{1,3}/)) action = 'up';
    }
    if (query.includes('down') || query.includes('decrease') || query.includes('lower') || query.includes('dim')) {
      if (!query.match(/\d{1,3}/)) action = 'down';
    }
    const match = query.match(/\d{1,3}/);
    if (match) {
      level = parseInt(match[0], 10);
    }

    let url = '/api/brightness';
    if (action) url += `?action=${action}`;
    else if (level !== null) url += `?level=${level}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        const curB = data.brightness;
        const msg = `Display brightness adjusted to ${curB} percent, boss.`;
        this.speak(msg);

        const directiveEl = document.getElementById('footDirective');
        if (directiveEl) directiveEl.textContent = `DISPLAY MATRIX: BRIGHTNESS AT ${curB}%`;

        const transText = document.getElementById('voiceTranscriptText');
        if (transText) {
          transText.innerHTML = `<strong>JARVIS:</strong> "${msg}"`;
        }
      })
      .catch(err => console.warn("Brightness error:", err));
  }

  closeAppOrWeb(target) {
    let rawTarget = target.toLowerCase().trim();
    rawTarget = rawTarget.replace(/^(?:the\s+)?/, '').replace(/\s+(?:app|application|website|site|browser|tab)$/i, '').trim();
    rawTarget = rawTarget.replace(/\s+com$/i, '.com').replace(/\s+org$/i, '.org').replace(/\s+net$/i, '.net');
    const displayName = rawTarget.charAt(0).toUpperCase() + rawTarget.slice(1);
    const speechMsg = `Closing ${displayName}, boss.`;
    this.speak(speechMsg);

    const directiveEl = document.getElementById('footDirective');
    if (directiveEl) directiveEl.textContent = `PROCESS TERMINATION: CLOSING ${displayName.toUpperCase()}`;

    const transText = document.getElementById('voiceTranscriptText');
    if (transText) {
      transText.innerHTML = `<strong>JARVIS:</strong> "Terminating: <span style="color:var(--accent-red);font-weight:bold;">${escapeHtml(displayName)}</span>"`;
    }

    // Close any windows opened in JS context
    if (this.openedWebWindows && this.openedWebWindows.length > 0) {
      this.openedWebWindows.forEach(w => {
        try { w.close(); } catch(e) {}
      });
      this.openedWebWindows = [];
    }

    // Execute backend process termination (handles browsers, websites, and Windows apps dynamically)
    fetch(`/api/close_app?app=${encodeURIComponent(rawTarget)}`)
      .then(res => res.json())
      .then(data => {
        console.log("[App Close Response]:", data);
        if (data.window_closed || (data.closed_processes && data.closed_processes.length > 0)) {
          if (directiveEl) directiveEl.textContent = `PROCESS TERMINATION: ${displayName.toUpperCase()} TERMINATED`;
        }
      })
      .catch(err => console.warn("App close error:", err));
  }

  launchAnyAppOrWebsite(target) {
    const raw = target.trim();
    let clean = raw.toLowerCase().replace(/^(?:the\s+)/, '').replace(/\s+(?:app|application|website|site|browser|program)$/i, '').trim();
    if (!clean) return;

    // Check if it's explicitly a website / URL
    const domainExts = ['.com', '.org', '.net', '.io', '.in', '.ai', '.co', '.app', '.dev', '.tv', '.edu', '.gov', '.me'];
    const isExplicitUrl = clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('www.') || domainExts.some(ext => clean.endsWith(ext)) || clean.includes('/');

    if (isExplicitUrl) {
      this.launchWebsite(clean);
      return;
    }

    const displayName = clean.charAt(0).toUpperCase() + clean.slice(1);
    this.speak(`Opening ${displayName}, boss.`);

    const directiveEl = document.getElementById('footDirective');
    if (directiveEl) directiveEl.textContent = `LAUNCHER: STARTING ${displayName.toUpperCase()}`;

    const transText = document.getElementById('voiceTranscriptText');
    if (transText) {
      transText.innerHTML = `<strong>JARVIS:</strong> "Executing command: <span style="color:var(--cyan-bright);font-weight:bold;">${escapeHtml(displayName)}</span>"`;
    }

    // Call unified backend launcher that handles both Windows desktop applications and web domains dynamically
    fetch(`/api/launch_app?app=${encodeURIComponent(clean)}`)
      .then(res => res.json())
      .then(data => {
        console.log("[Launch Response]:", data);
        if (data.type === 'website' && data.url) {
          if (directiveEl) directiveEl.textContent = `WEB LAUNCHER: ${data.url.toUpperCase()} ACTIVE`;
        } else {
          if (directiveEl) directiveEl.textContent = `APP LAUNCHER: ${displayName.toUpperCase()} ACTIVE`;
        }
      })
      .catch(err => console.warn("App launch error:", err));
  }

  launchWindowsApp(appName) {
    this.launchAnyAppOrWebsite(appName);
  }

  launchWebsite(siteName) {
    let url = siteName.trim();
    let displayName = url;

    // Normalize domain / URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.startsWith('www.') || url.includes('.')) {
        url = `https://${url}`;
      } else {
        const cleanDomain = url.replace(/\s+/g, '');
        url = `https://www.${cleanDomain}.com`;
      }
    }

    displayName = displayName.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/.*$/, '');
    displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

    // Voice response
    const speechMsg = `Opening ${displayName}, boss.`;
    this.speak(speechMsg);

    const directiveEl = document.getElementById('footDirective');
    if (directiveEl) directiveEl.textContent = `WEB LAUNCHER: OPENING ${url.toUpperCase()}`;

    const transText = document.getElementById('voiceTranscriptText');
    if (transText) {
      transText.innerHTML = `<strong>JARVIS:</strong> "Launching ${escapeHtml(displayName)}: <a href="${url}" target="_blank" style="color:var(--cyan-bright);text-decoration:underline;">${url}</a>"`;
    }

    // Trigger Python backend launcher for native browser window
    fetch(`/api/open_url?url=${encodeURIComponent(url)}`).catch(() => {});
  }

  parseCalculatorCommand(cmd) {
    if (!cmd) return null;
    const raw = cmd.trim();
    const lower = raw.toLowerCase();

    // Check if command explicitly asks to open/launch calculator
    const hasOpenCalc = /\b(?:open|launch|start|run|show)\s+(?:the\s+)?(?:calculator|calc)\b/i.test(lower)
                     || /\b(?:calculator|calc)\s+(?:and|to|then)?\s*(?:calculate|solve|evaluate)\b/i.test(lower);

    // Look for calculation trigger or math words/symbols
    const hasCalcWord = /\b(?:calculate|solve|evaluate|what\s+is|whats\s+is|whats|what's|how\s+much\s+is|sum\s+of|add)\b/i.test(lower);
    const hasMathOperators = /[0-9]+\s*(?:[\+\-\*\/\^xX]|plus|minus|times|into|multiplied\s+by|divided\s+by|divide\s+by)\s*[0-9]+/i.test(lower);

    // If it's pure "open calculator" with no arithmetic request, return app launch instruction
    if (hasOpenCalc && !hasCalcWord && !hasMathOperators) {
      // Check if there is any trailing expression at all
      const testExpr = lower.replace(/^(?:open|launch|start|run|show)\s+(?:the\s+)?(?:calculator|calc)\s*/i, '').trim();
      if (!testExpr) {
        return {
          shouldLaunchApp: true,
          isMath: false
        };
      }
    }

    // Extract the math expression part
    let exprText = lower;
    if (hasOpenCalc) {
      exprText = exprText.replace(/^(?:open|launch|start|run|show)\s+(?:the\s+)?(?:calculator|calc)\s*(?:and|to|then|for)?\s*(?:calculate|solve|evaluate)?\s*/i, '');
      exprText = exprText.replace(/^(?:calculator|calc)\s*(?:and|to|then)?\s*(?:calculate|solve|evaluate)?\s*/i, '');
    }

    // Remove leading question/calculation words
    exprText = exprText.replace(/^(?:please\s+|can\s+you\s+|could\s+you\s+)?(?:calculate|solve|evaluate|what\s+is|what's|whats|how\s+much\s+is|what\s+does|find)\s+/i, '');
    exprText = exprText.replace(/^(?:the\s+)?(?:sum\s+of|value\s+of|result\s+of)\s+/i, '');

    // Normalize spoken math terms to standard arithmetic operators
    let cleanExpr = exprText
      .replace(/\bmultiplied\s+by\b/gi, '*')
      .replace(/\bdivided\s+by\b/gi, '/')
      .replace(/\bdivide\s+by\b/gi, '/')
      .replace(/\bover\b/gi, '/')
      .replace(/\btimes\b/gi, '*')
      .replace(/\binto\b/gi, '*')
      .replace(/\bplus\b/gi, '+')
      .replace(/\badd\b/gi, '+')
      .replace(/\bminus\b/gi, '-')
      .replace(/\bsubtract\b/gi, '-')
      .replace(/\bto\s+the\s+power\s+of\b/gi, '**')
      .replace(/\bpower\s+of\b/gi, '**')
      .replace(/\bx\b/gi, '*')
      .replace(/\^/g, '**');

    // Remove trailing polite words or filler
    cleanExpr = cleanExpr.replace(/\s*(?:boss|jarvis|sir|please|equal|equals|is)\s*$/i, '').trim();

    // Sanitize to only digits, operators, parens, dots, and spaces
    const sanitized = cleanExpr.replace(/[^0-9\.\+\-\*\/\(\)\s]/g, '').trim();

    if (sanitized && /[0-9]/.test(sanitized) && /[\+\-\*\/]/.test(sanitized)) {
      try {
        if (/^[\d\s\.\+\-\*\/\(\)]+$/.test(sanitized)) {
          const result = Function(`"use strict"; return (${sanitized})`)();
          if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
            const formattedResult = Number.isInteger(result) ? result.toString() : result.toFixed(4).replace(/\.?0+$/, '');
            const readableExpr = sanitized.replace(/\*\*/g, '^');
            return {
              shouldLaunchApp: hasOpenCalc,
              isMath: true,
              expression: readableExpr,
              rawExpression: sanitized,
              result: formattedResult
            };
          }
        }
      } catch (err) {
        console.warn("[Calculator Parser]: Math eval error", err);
      }
    }

    if (hasOpenCalc) {
      return {
        shouldLaunchApp: true,
        isMath: false
      };
    }

    return null;
  }

  parseYouTubePlayCommand(cmd) {
    if (!cmd) return null;
    const lower = cmd.toLowerCase().trim();

    // 0. "create a song, christian song" or "create a christian song" or "christian song" / "christian songs" / "telugu christian songs"
    if (lower.includes('christian song') || lower.includes('christian songs') || lower.includes('christian music') || lower.includes('telugu christian') || lower.includes('క్రైస్తవ') || lower.includes('కీర్తనలు')) {
      let q = lower.replace(/^(?:please\s+|can\s+you\s+|could\s+you\s+)?(?:create|make|generate|produce|play|listen\s+to|watch)?\s*(?:a\s+)?(?:song[\s,]+)?/i, '')
                   .replace(/^(?:the\s+)?(?:christian\s+songs?|christian\s+music)\s*(?:called|named|of|by)?\s*/i, '')
                   .replace(/^(?:in\s+telugu|telugu)\s+/i, '')
                   .replace(/\s+(?:in\s+telugu|telugu)$/i, '')
                   .trim();
      if (!q || q === 'christian' || q === 'christian song' || q === 'christian songs') {
        q = 'telugu christian worship songs hit praise tracks';
      } else {
        q = `${q} telugu christian song`;
      }
      return { query: q, raw: lower };
    }

    // 0.1 "create a song [name]" or "create song [name]" or "make a song [name]"
    const createSongMatch = lower.match(/^(?:please\s+|can\s+you\s+|could\s+you\s+)?(?:create|make|generate|produce)\s+(?:a\s+)?(?:song|track|music)\s*(?:called|named|about|of)?\s*(.*)$/i);
    if (createSongMatch) {
      let q = createSongMatch[1].trim();
      return {
        query: q || 'top trending hit songs 2026',
        raw: lower
      };
    }

    // 0.2 Telugu Song Directives (e.g. "పాట", "తెలుగు పాటలు", "telugu song", "play telugu song", "play hosanna")
    const teluguMatch = lower.match(/^(?:play|listen\s+to)?\s*(?:telugu\s+song|telugu\s+songs|telugu\s+music)\s*(.*)$/i) ||
                        lower.match(/^(?:play\s+)?(.+?)\s+(?:telugu\s+song|telugu\s+track|paata|paatalu)$/i);
    if (teluguMatch) {
      let q = (teluguMatch[1] || '').trim();
      return {
        query: q ? `${q} telugu song` : 'top telugu hit songs 2026',
        raw: lower
      };
    }

    // 1. "open youtube and play [song/video]" or "open youtube play [song/video]" or "open youtube to play [song/video]"
    const openAndPlay = lower.match(/^(?:open|launch|go\s+to)\s+youtube\s*(?:and|to|then)?\s*(?:search\s+and\s+)?(?:play|listen\s+to|watch)\s*(.*)$/i);
    if (openAndPlay) {
      let q = openAndPlay[1].trim();
      q = q.replace(/^(?:the\s+)?(?:song|music|track|video|clip|movie)\s+(?:of|called|named|by)?\s*/i, '')
           .replace(/^(?:for|about|on)\s+/i, '')
           .trim();
      return {
        query: q || 'some song',
        raw: lower
      };
    }

    // 2. "play [query] on youtube" or "play [query] in youtube"
    const playOnYouTube = lower.match(/^(?:please\s+|can\s+you\s+|could\s+you\s+)?(?:play|listen\s+to|watch)\s+(.+?)\s+(?:on|in|from)\s+youtube$/i);
    if (playOnYouTube) {
      let q = playOnYouTube[1].trim();
      q = q.replace(/^(?:the\s+)?(?:song|music|track|video|clip)\s+(?:of|called|named|by)?\s*/i, '').trim();
      return {
        query: q || 'some song',
        raw: lower
      };
    }

    // 3. "open youtube and search [query]"
    const openAndSearchYT = lower.match(/^(?:open|launch|go\s+to)\s+youtube\s*(?:and|to|then)?\s*(?:search\s+for|search\s+about|search|look\s+up|find)\s*(.*)$/i);
    if (openAndSearchYT) {
      let q = openAndSearchYT[1].trim();
      q = q.replace(/^(?:about|for|on)\s+/i, '').trim();
      return {
        query: q || 'trending videos',
        raw: lower
      };
    }

    // 4. "play song [name]" / "play the song [name]" / "play video [name]" / "play video of [name]" / "play some song" / "play a song" / "play some music" / "play music" / "play some video"
    const playSongVideo = lower.match(/^(?:please\s+|can\s+you\s+|could\s+you\s+)?(?:play|listen\s+to|watch)\s+(?:a\s+|the\s+|some\s+)?(?:song|music|track|video|clip|trailer)\s*(?:of|called|named|by)?\s*(.*)$/i);
    if (playSongVideo) {
      let q = playSongVideo[1].trim();
      return {
        query: q || 'some song',
        raw: lower
      };
    }

    // 5. "play [name] song" or "play [name] video"
    const playNamedSong = lower.match(/^(?:please\s+|can\s+you\s+|could\s+you\s+)?(?:play|listen\s+to|watch)\s+(.+?)\s+(?:song|video|music|track)$/i);
    if (playNamedSong && !lower.includes('game') && !lower.includes('role')) {
      return {
        query: playNamedSong[1].trim(),
        raw: lower
      };
    }

    // 6. Direct "play [name]" (e.g. "play faded", "play believer", "play taylor swift", "play coldplay", "play hosanna")
    const directPlay = lower.match(/^(?:please\s+|can\s+you\s+|could\s+you\s+)?play\s+(.+)$/i);
    if (directPlay) {
      const target = directPlay[1].trim();
      const nonMusicKeywords = ['game', 'chess', 'role', 'dead', 'dumb', 'around', 'safe', 'fair', 'video game'];
      if (!nonMusicKeywords.includes(target) && target.length > 1) {
        return {
          query: target,
          raw: lower
        };
      }
    }

    return null;
  }

  // Autonomous Video Creation Engine Directives Parser
  parseVideoCreationCommand(cmd) {
    if (!cmd) return null;
    const lower = cmd.toLowerCase().trim();

    // 1. "create a lyrical video about [topic/song]"
    const lyricalMatch = lower.match(/^(?:please\s+|can\s+you\s+|could\s+you\s+)?(?:create|make|generate|produce|build|compile)\s+(?:a\s+)?(?:lyrical\s+video|lyric\s+video|song\s+video)(?:\s+(?:about|on|for|of|based\s+on))?\s*(.*)$/i);
    if (lyricalMatch) {
      let q = (lyricalMatch[1] || '').trim();
      q = q.replace(/^(?:a\s+|the\s+)/i, '').trim();
      return {
        type: 'lyrical',
        topic: q || 'Christian worship song',
        raw: lower
      };
    }

    // 2. "create video of Iron Man", "create video about Iron Man", "make video of Iron Man"
    const topicVideoMatch = lower.match(/^(?:please\s+|can\s+you\s+|could\s+you\s+)?(?:create|make|generate|produce|build|compile)\s+(?:a\s+)?(?:short\s+|hd\s+|full\s+)?video\s*(?:for\s+me\s*)?(?:about|on|of|for|based\s+on)?\s*(.+)$/i)
      || lower.match(/^(?:video\s+(?:of|about|on)\s+)(.+)$/i);
    if (topicVideoMatch) {
      let q = topicVideoMatch[1].trim();
      q = q.replace(/^(?:a\s+|an\s+|the\s+)/i, '').trim();
      q = q.replace(/\s+for\s+me$/i, '').trim();
      if (!q || q === 'video' || q === 'a video') q = 'Iron Man';
      const isLyrical = anyKeywordMatch(q, ['song', 'lyric', 'lyrical', 'christian', 'music', 'worship']);
      return {
        type: isLyrical ? 'lyrical' : 'topic',
        topic: q,
        raw: lower
      };
    }

    // 3. "create a video" / "make a video" (standalone)
    if (/^(?:create|make|generate|produce|compile)\s+(?:a\s+)?video$/i.test(lower)) {
      return {
        type: 'topic',
        topic: 'Iron Man',
        raw: lower
      };
    }

    return null;
  }

  executeVideoCreation({ topic, type = 'topic' }) {
    if (!topic) topic = 'Iron Man';
    const cleanTopic = topic.replace(/^(?:a\s+|an\s+|the\s+)/i, '').trim();
    const spokenReply = `Initiating video production for ${cleanTopic}, boss. Opening your editing dashboard, collecting online media, and assembling the timeline now.`;

    this.speak(spokenReply);

    const directiveEl = document.getElementById('footDirective');
    if (directiveEl) directiveEl.textContent = `VIDEO ENGINE: COMPILING "${cleanTopic.toUpperCase()}"`;

    const transText = document.getElementById('voiceTranscriptText');
    if (transText) {
      transText.innerHTML = `<strong>JARVIS:</strong> "${escapeHtml(spokenReply)}" <span style="color:var(--cyan-bright);font-weight:bold;">[Opening Editing Dashboard...]</span>`;
    }

    sfx.playScan();

    // Immediately open the In-Jarvis Editing Dashboard
    if (typeof videoEditingDashboard !== 'undefined') {
      videoEditingDashboard.open(cleanTopic);
    }

    fetch(`/api/create_video?topic=${encodeURIComponent(cleanTopic)}&type=${encodeURIComponent(type)}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          sfx.playChirp();
          const doneMsg = `Video compilation complete, boss. I have rendered your video about ${cleanTopic} and loaded all clips into your editing dashboard.`;
          this.speak(doneMsg);

          if (directiveEl) directiveEl.textContent = `VIDEO READY: ${data.video_file.toUpperCase()}`;
          if (transText) {
            transText.innerHTML = `<strong>JARVIS:</strong> "Video compilation complete! <a href="${data.video_url}" target="_blank" style="color:var(--cyan-bright);text-decoration:underline;font-weight:bold;">▶ View ${escapeHtml(data.video_file)}</a>"`;
          }

          if (typeof videoEditingDashboard !== 'undefined') {
            videoEditingDashboard.loadProject(data);
          }
        } else {
          this.speak(`Video compilation encountered an issue, boss: ${data.message || 'Rendering error'}`);
        }
      })
      .catch(err => {
        console.warn("Video creation error:", err);
        this.speak("Video creation request encountered a connection error, boss.");
      });
  }

  executeYouTubePlay({ query = 'some song' }) {
    let cleanQuery = query.trim();
    cleanQuery = cleanQuery.replace(/^["']|["']$/g, '').trim();

    const isGenericSong = !cleanQuery || /^(?:some\s+song|a\s+song|some\s+songs|songs|song|any\s+song|some\s+music|music|tracks|popular\s+song|random\s+song)$/i.test(cleanQuery);
    const isGenericVideo = /^(?:some\s+video|a\s+video|some\s+videos|videos|video|any\s+video|random\s+video)$/i.test(cleanQuery);

    let searchParam = cleanQuery;
    let displayTitle = cleanQuery;

    if (isGenericSong) {
      searchParam = "top trending hit songs 2026";
      displayTitle = "Top Trending Songs";
    } else if (isGenericVideo) {
      searchParam = "trending videos";
      displayTitle = "Trending Videos";
    } else {
      displayTitle = cleanQuery.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    sfx.playScan();
    const spokenReply = isGenericSong 
      ? "Opening YouTube and playing some popular hit songs for you, boss." 
      : isGenericVideo
      ? "Opening YouTube and playing trending videos for you, boss."
      : `Opening YouTube and playing ${displayTitle}, boss.`;

    this.speak(spokenReply);

    const directiveEl = document.getElementById('footDirective');
    if (directiveEl) {
      directiveEl.textContent = `YOUTUBE PLAYBACK MATRIX: PLAYING [${displayTitle.toUpperCase()}]`;
    }

    const transText = document.getElementById('voiceTranscriptText');
    if (transText) {
      transText.innerHTML = `<strong>JARVIS:</strong> "Playing on YouTube: <span style='color:var(--cyan-bright);font-weight:bold;'>${escapeHtml(displayTitle)}</span> <span style='color:#ffbe0b;font-size:11px;'>[Autoplay Engaged]</span>"`;
    }

    // Call Python backend to resolve exact video and open in native browser
    fetch(`/api/play_youtube?q=${encodeURIComponent(searchParam)}`)
      .then(res => res.json())
      .then(data => {
        console.log("[YouTube Play Response]:", data);
        if (data && data.url && transText) {
          transText.innerHTML = `<strong>JARVIS:</strong> "Playing on YouTube: <a href="${data.url}" target="_blank" style="color:var(--cyan-bright);text-decoration:underline;font-weight:bold;">${escapeHtml(displayTitle)}</a> <span style='color:#ffbe0b;font-size:11px;'>▶ LIVE</span>"`;
        }
      })
      .catch(err => {
        console.warn("YouTube play fetch notice:", err);
        const fallbackUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchParam)}`;
        fetch(`/api/open_url?url=${encodeURIComponent(fallbackUrl)}`).catch(() => {});
      });
  }

  parseWebSearchCommand(cmd) {
    if (!cmd) return null;

    const browserNames = ['chrome', 'google chrome', 'google', 'browser', 'edge', 'msedge', 'microsoft edge', 'firefox', 'brave', 'opera', 'web', 'internet', 'search'];

    // 1. "open [engine] and search (about/for)? [query]" or "open [engine] search (about/for)? [query]"
    const openAndSearch = cmd.match(/^(?:open|launch|go\s+to)\s+([a-z0-9.\s]+?)(?:\s+and)?\s+(?:search\s+for|search\s+about|search|look\s+up|find|research\s+about|research\s+on|research)\s+(.+)$/i);
    if (openAndSearch) {
      let eng = openAndSearch[1].trim().toLowerCase();
      let q = openAndSearch[2].replace(/^(?:about|for|on)\s+/i, '').trim();
      if (browserNames.includes(eng) || eng.includes('chrome') || eng.includes('browser') || eng.includes('edge')) {
        eng = 'google';
      }
      return {
        engine: eng,
        query: q
      };
    }

    // 2. "search (about/for)? [query] on/in [engine]" or "look up [query] on/in [engine]"
    const searchOnEngine = cmd.match(/^(?:search\s+about|search\s+for|search|look\s+up|find|research\s+about|research\s+on|research)\s+(.+?)\s+(?:on|in)\s+([a-z0-9.\s]+)$/i);
    if (searchOnEngine) {
      let eng = searchOnEngine[2].trim().toLowerCase();
      let q = searchOnEngine[1].replace(/^(?:about|for|on)\s+/i, '').trim();
      if (browserNames.includes(eng) || eng.includes('chrome') || eng.includes('browser') || eng.includes('edge')) {
        eng = 'google';
      }
      return {
        engine: eng,
        query: q
      };
    }

    // 3. "search (on)? [engine] (about/for)? [query]"
    const searchEngine = cmd.match(/^(?:search\s+on|search\s+in|search|look\s+up\s+on|look\s+up|research\s+on)\s+([a-z0-9.\s]+?)\s+(?:about|for|on)?\s*(.+)$/i);
    if (searchEngine) {
      let eng = searchEngine[1].trim().toLowerCase();
      let q = searchEngine[2].replace(/^(?:about|for|on)\s+/i, '').trim();
      if (browserNames.includes(eng) || eng.includes('chrome') || eng.includes('browser') || eng.includes('edge')) {
        eng = 'google';
      }
      return {
        engine: eng,
        query: q
      };
    }

    // 4. "[engine] search (about/for)? [query]"
    const engineSearch = cmd.match(/^([a-z0-9.\s]+?)\s+search\s+(?:about|for|on)?\s*(.+)$/i);
    if (engineSearch) {
      let eng = engineSearch[1].trim().toLowerCase();
      let q = engineSearch[2].replace(/^(?:about|for|on)\s+/i, '').trim();
      if (browserNames.includes(eng) || eng.includes('chrome') || eng.includes('browser') || eng.includes('edge')) {
        eng = 'google';
      }
      return {
        engine: eng,
        query: q
      };
    }

    // 5. General Web Search: "search about [query]", "search for [query]", "web search [query]", "search the web for [query]", "research about [query]", "research [query]"
    const generalSearch = cmd.match(/^(?:search\s+about|search\s+for|web\s+search|search\s+the\s+web\s+for|search\s+web\s+for|research\s+about|research\s+on|research|google\s+about|google\s+for|google)\s+(.+)$/i);
    if (generalSearch) {
      return {
        engine: 'google',
        query: generalSearch[1].replace(/^(?:about|for|on)\s+/i, '').trim()
      };
    }

    return null;
  }

  executeWebSearch({ engine = 'google', query = '' }) {
    if (!query) return;

    let cleanEngine = engine.toLowerCase().replace(/^(?:the\s+)/, '').replace(/\.(com|org|net|in|co|io)$/i, '').trim();
    let searchUrl = '';
    let engineLabel = 'Google';

    const isBrowserOrGoogle = ['google', 'chrome', 'googlechrome', 'google chrome', 'browser', 'edge', 'msedge', 'microsoft edge', 'firefox', 'brave', 'opera', 'web', 'internet', 'search'].includes(cleanEngine) || !cleanEngine;

    if (isBrowserOrGoogle) {
      searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      engineLabel = 'Google';
    } else if (cleanEngine === 'flipkart' || cleanEngine.includes('flipkart')) {
      searchUrl = `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`;
      engineLabel = 'Flipkart';
    } else if (cleanEngine === 'youtube' || cleanEngine.includes('youtube')) {
      searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
      engineLabel = 'YouTube';
    } else if (cleanEngine === 'amazon' || cleanEngine.includes('amazon')) {
      searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(query)}`;
      engineLabel = 'Amazon';
    } else if (cleanEngine === 'wikipedia' || cleanEngine.includes('wikipedia')) {
      searchUrl = `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`;
      engineLabel = 'Wikipedia';
    } else if (cleanEngine === 'github' || cleanEngine.includes('github')) {
      searchUrl = `https://github.com/search?q=${encodeURIComponent(query)}`;
      engineLabel = 'GitHub';
    } else if (cleanEngine === 'reddit' || cleanEngine.includes('reddit')) {
      searchUrl = `https://www.reddit.com/search/?q=${encodeURIComponent(query)}`;
      engineLabel = 'Reddit';
    } else if (cleanEngine === 'bing' || cleanEngine.includes('bing')) {
      searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
      engineLabel = 'Bing';
    } else if (cleanEngine === 'myntra' || cleanEngine.includes('myntra')) {
      searchUrl = `https://www.myntra.com/${encodeURIComponent(query)}`;
      engineLabel = 'Myntra';
    } else if (cleanEngine === 'twitter' || cleanEngine === 'x') {
      searchUrl = `https://x.com/search?q=${encodeURIComponent(query)}`;
      engineLabel = 'X (Twitter)';
    } else if (cleanEngine === 'spotify' || cleanEngine.includes('spotify')) {
      searchUrl = `https://open.spotify.com/search/${encodeURIComponent(query)}`;
      engineLabel = 'Spotify';
    } else if (cleanEngine === 'netflix' || cleanEngine.includes('netflix')) {
      searchUrl = `https://www.netflix.com/search?q=${encodeURIComponent(query)}`;
      engineLabel = 'Netflix';
    } else if (cleanEngine === 'instagram' || cleanEngine.includes('instagram')) {
      searchUrl = `https://www.instagram.com/explore/tags/${encodeURIComponent(query.replace(/\s+/g, ''))}/`;
      engineLabel = 'Instagram';
    } else {
      // Direct clean Google search without any site: restriction!
      searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      engineLabel = 'Google';
    }

    sfx.playScan();
    const speechMsg = `Opening ${engineLabel} and searching for ${query}, boss.`;
    this.speak(speechMsg);

    const directiveEl = document.getElementById('footDirective');
    if (directiveEl) directiveEl.textContent = `WEB RESEARCH: ${engineLabel.toUpperCase()} // "${query.toUpperCase()}"`;

    const transText = document.getElementById('voiceTranscriptText');
    if (transText) {
      transText.innerHTML = `<strong>JARVIS:</strong> "Searching ${engineLabel} for <span style='color:var(--cyan-bright);font-weight:bold;'>${escapeHtml(query)}</span>: <a href="${searchUrl}" target="_blank" style="color:#ffbe0b;text-decoration:underline;">[View Results]</a>"`;
    }

    // Open in native system default browser via Python endpoint
    fetch(`/api/open_url?url=${encodeURIComponent(searchUrl)}`).catch(() => {});
  }

  writeNotepad({ topic = '', content = '', mode = 'notes', lines = 0 }) {
    sfx.playScan();
    const cleanTopic = topic || 'Daily Notes';
    const displayTopic = cleanTopic.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    let speechMsg = `Compiling research notes for ${displayTopic} and opening in Notepad, boss.`;
    if (mode === 'todo') {
      speechMsg = "Generating your daily mission and to-do checklist in Notepad, boss.";
    } else if (content && !topic) {
      speechMsg = "Writing notes into Notepad, boss.";
    }

    this.speak(speechMsg);

    const directiveEl = document.getElementById('footDirective');
    if (directiveEl) {
      directiveEl.textContent = `NOTEPAD MATRIX: WRITING [${displayTopic.toUpperCase()}]`;
    }

    const transText = document.getElementById('voiceTranscriptText');
    if (transText) {
      transText.innerHTML = `<strong>JARVIS:</strong> "Synthesizing formatted notes for <span style='color:var(--cyan-bright);font-weight:bold;'>${escapeHtml(displayTopic)}</span> & launching Notepad..."`;
    }

    const params = new URLSearchParams({
      topic: cleanTopic,
      content: content,
      mode: mode,
      lines: lines || 0
    });

    fetch(`/api/write_notepad?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.status === 'success') {
          sfx.playChirp();
          if (directiveEl) directiveEl.textContent = `NOTEPAD ACTIVE // ARCHIVED TO notes/${escapeHtml(data.filename || '')}`;
          if (transText) {
            transText.innerHTML = `<strong>JARVIS:</strong> "Notepad opened with ${data.lines_count || ''} lines of structured briefing on <span style='color:var(--cyan-bright);font-weight:bold;'>${escapeHtml(displayTopic)}</span>."`;
          }
        }
      })
      .catch(err => {
        console.warn("Write notepad notice:", err);
      });
  }

  askJarvis(question) {
    let cleanQ = question.trim();
    cleanQ = cleanQ.replace(/^(?:hey\s+)?jarvis\s*/i, '').trim();
    cleanQ = cleanQ.replace(/^(?:please\s+)?(?:tell\s+me\s+about|what\s+is|who\s+is|who\s+was|explain|information\s+(?:about|on))\s+/i, '').trim();

    const topicName = cleanQ || question;
    const directiveEl = document.getElementById('footDirective');
    const transText = document.getElementById('voiceTranscriptText');
    const isPresentation = /make\s+(?:a\s+)?ppt|create\s+(?:a\s+)?ppt|generate\s+(?:a\s+)?ppt|make\s+presentation|create\s+presentation|presentation\s+on|\d+\s+slides?/i.test(topicName);
    const isResearch = /prepare\s+(?:notes?|text|dossier)/i.test(topicName) || /dossier|deep\s+research/i.test(topicName) || (/research/i.test(topicName) && /notes?|text|prepare|compile|write|milestone|report/i.test(topicName));

    let researchTimer = null;
    if (isPresentation) {
      if (directiveEl) directiveEl.textContent = `STARK SLIDE MATRIX: SYNTHESIZING DYNAMIC PRESENTATION DECK [${topicName.toUpperCase()}]...`;
      if (transText) {
        transText.innerHTML = `<strong>JARVIS:</strong> "Synthesizing custom presentation deck for <span style="color:var(--cyan-bright);font-weight:bold;">${escapeHtml(topicName)}</span>. Generating architectural workflows and compiling 16:9 PDF & PPTX slides..."`;
      }

      let stageIdx = 0;
      const presStages = [
        `STARK SLIDE MATRIX // SYNTHESIZING N-SLIDE CURRICULUM...`,
        `VECTOR SCHEMATIC ENGINE // RENDERING WORKFLOW PIPELINE & CHARTS...`,
        `COMPILING 16:9 SLIDES // EMBEDDING DARK GLASSMORPHIC UI CARDS...`,
        `FINALIZING DECK // EXPORTING PUBLICATION PDF & PPTX...`
      ];
      researchTimer = setInterval(() => {
        stageIdx = (stageIdx + 1) % presStages.length;
        if (directiveEl) directiveEl.textContent = presStages[stageIdx];
      }, 1600);
    } else if (isResearch) {
      if (directiveEl) directiveEl.textContent = `STARK INTELLIGENCE: DEEP WEB RESEARCH IN PROGRESS [${topicName.toUpperCase()}]...`;
      if (transText) {
        transText.innerHTML = `<strong>JARVIS:</strong> "Analyzing live web intelligence for <span style="color:var(--cyan-bright);font-weight:bold;">${escapeHtml(topicName)}</span>. Opening primary sources and compiling citation notes..."`;
      }

      // Rotate through authentic research stages so user sees the live research process!
      let stageIdx = 0;
      const researchStages = [
        `SCANNING WEB TELEMETRY // ACCESSING GLOBAL SOURCES...`,
        `OPENING PRIMARY INTEL SOURCE & EXTRACTING ABSTRACTS...`,
        `QUERYING REAL-TIME NEWS, BENCHMARKS & SCIENTIFIC MILESTONES...`,
        `SYNTHESIZING RESEARCH NOTES & VERIFYING CITATION LINKS...`
      ];
      researchTimer = setInterval(() => {
        stageIdx = (stageIdx + 1) % researchStages.length;
        if (directiveEl) directiveEl.textContent = researchStages[stageIdx];
      }, 1600);
    } else {
      if (directiveEl) directiveEl.textContent = `INTELLIGENCE MATRIX: ANALYZING [${topicName.toUpperCase()}]...`;
      if (transText) {
        transText.innerHTML = `<strong>JARVIS:</strong> "Accessing intelligence records for <span style="color:var(--cyan-bright);font-weight:bold;">${escapeHtml(topicName)}</span>..."`;
      }
    }

    fetch(`/api/ask_jarvis?q=${encodeURIComponent(topicName)}`)
      .then(res => res.json())
      .then(data => {
        if (researchTimer) clearInterval(researchTimer);

        if (data.status === 'success' && data.answer) {
          this.speak(data.answer);
          if (transText) {
            const engineTag = data.engine ? ` <span style="color:#ffbe0b;font-size:10px;font-family:var(--font-hud);">[${escapeHtml(data.engine)}]</span>` : '';
            
            // Build presentation or sources badge
            let badgeHtml = '';
            if (data.pdf_path) {
              badgeHtml = `<div style="margin-top:8px;padding:6px 10px;background:rgba(0,255,240,0.08);border-left:3px solid var(--cyan-bright);border-radius:3px;font-size:11px;line-height:1.6;">
                <span style="color:#ffbe0b;font-weight:bold;letter-spacing:1px;font-family:var(--font-hud);">[STARK PRESENTATION DECK GENERATED (${data.requested_slides || 8} SLIDES)]</span><br/>
                • PDF Slide Deck: <span style="color:var(--cyan-bright);">${escapeHtml(data.filename || '')}</span><br/>
                • PowerPoint File: <span style="color:#ffbe0b;">${escapeHtml((data.filename || '').replace('.pdf', '.pptx'))}</span>
              </div>`;
            } else if (data.source_links && data.source_links.length) {
              const linksList = data.source_links.slice(0, 4).map(s => 
                `• <a href="${escapeHtml(s.url)}" target="_blank" style="color:var(--cyan-bright);text-decoration:underline;">${escapeHtml(s.name.substring(0, 60))}</a>`
              ).join('<br/>');
              badgeHtml = `<div style="margin-top:8px;padding:6px 10px;background:rgba(0,255,240,0.06);border-left:3px solid var(--cyan-bright);border-radius:3px;font-size:11px;line-height:1.6;">
                <span style="color:#ffbe0b;font-weight:bold;letter-spacing:1px;font-family:var(--font-hud);">[VERIFIED RESEARCH SOURCES & CITATIONS]</span><br/>
                ${linksList}
              </div>`;
            }

            transText.innerHTML = `<strong>JARVIS:</strong> "${escapeHtml(data.answer)}"${engineTag}${badgeHtml}`;
          }
          if (directiveEl) {
            if (isPresentation) {
              directiveEl.textContent = `PRESENTATION LAUNCHED [${data.requested_slides || 8} SLIDES // ${(data.topic || topicName).toUpperCase()}]`;
            } else if (isResearch) {
              directiveEl.textContent = `RESEARCH NOTES COMPILED & OPENED IN NOTEPAD [${(data.topic || topicName).toUpperCase()}]`;
            } else {
              directiveEl.textContent = `INTEL TRANSMITTED: [${(data.topic || topicName).toUpperCase()}]`;
            }
          }
          sfx.playScan();
        }
      })
      .catch(err => {
        if (researchTimer) clearInterval(researchTimer);
        console.warn("ask_jarvis error:", err);
        const fallback = `I could not complete the research for ${topicName}, boss.`;
        this.speak(fallback);
      });
  }

  convertDownloadsDocument(fromFmt = 'pdf', toFmt = 'docx', fileQuery = '') {
    const directiveEl = document.getElementById('footDirective');
    const transText = document.getElementById('voiceTranscriptText');
    
    if (directiveEl) directiveEl.textContent = `DOCUMENT MATRIX: SCANNING DOWNLOADS // [${fromFmt.toUpperCase()} ➔ ${toFmt.toUpperCase()}]`;
    if (transText) transText.innerHTML = `<strong>JARVIS:</strong> "Scanning Downloads folder, sir. Initiating document conversion to ${toFmt === 'docx' ? 'Word document' : toFmt.toUpperCase()}..."`;
    this.speak(`Scanning your Downloads folder, sir. Converting to ${toFmt === 'docx' ? 'Word document' : toFmt.toUpperCase()} now.`);

    fetch(`/api/voice_convert_doc?from=${encodeURIComponent(fromFmt)}&to=${encodeURIComponent(toFmt)}&q=${encodeURIComponent(fileQuery)}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          sfx.playChirp();
          const vocalMsg = `Conversion complete, sir. I have converted ${data.source_filename} into ${data.target_filename} and highlighted it in your Downloads folder.`;
          this.speak(vocalMsg);
          if (transText) {
            transText.innerHTML = `<strong>JARVIS:</strong> "Successfully converted <span style='color:var(--cyan-bright);font-weight:bold;'>${escapeHtml(data.source_filename)}</span> ➔ <span style='color:#ffbe0b;font-weight:bold;'>${escapeHtml(data.target_filename)}</span> in Downloads."`;
          }
          if (directiveEl) directiveEl.textContent = `DOC CONVERTED: [${data.target_filename.toUpperCase()}] // READY IN DOWNLOADS`;
        } else if (data.status === 'not_found') {
          const vocalMsg = `Sir, I scanned your Downloads folder but could not find any ${fromFmt.toUpperCase()} document to convert.`;
          this.speak(vocalMsg);
          if (transText) transText.innerHTML = `<strong>JARVIS:</strong> "${vocalMsg}"`;
          if (directiveEl) directiveEl.textContent = `DOC MATRIX: NO ${fromFmt.toUpperCase()} FOUND IN DOWNLOADS`;
        } else {
          const vocalMsg = `Sir, document conversion encountered an issue: ${data.message || 'Unable to complete conversion.'}`;
          this.speak(vocalMsg);
          if (transText) transText.innerHTML = `<strong>JARVIS:</strong> "${vocalMsg}"`;
          if (directiveEl) directiveEl.textContent = `DOC MATRIX ERROR: CONVERSION FAILED`;
        }
      })
      .catch(err => {
        console.warn("Document conversion error:", err);
        const vocalMsg = `Sir, I could not complete the document conversion protocol.`;
        this.speak(vocalMsg);
      });
  }

  generateAIImage(prompt) {
    if (!prompt) return;
    sfx.playScan();
    this.speak(`Synthesizing visual for ${prompt} via Pollinations AI, boss.`);

    const directiveEl = document.getElementById('footDirective');
    if (directiveEl) directiveEl.textContent = `IMAGE SYNTHESIS: POLLINATIONS // "${prompt.toUpperCase()}"`;

    const transText = document.getElementById('voiceTranscriptText');
    if (transText) {
      transText.innerHTML = `<strong>JARVIS:</strong> "Synthesizing AI visual for <span style='color:var(--cyan-bright);font-weight:bold;'>${escapeHtml(prompt)}</span>..."`;
    }

    fetch(`/api/generate_image?prompt=${encodeURIComponent(prompt)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.url) {
          sfx.playChirp();
          if (directiveEl) directiveEl.textContent = `IMAGE SYNTHESIZED // SAVED: ${data.filename.toUpperCase()}`;
          if (transText) {
            transText.innerHTML = `<strong>JARVIS:</strong> "Visual synthesized & saved to <span style='color:#ffbe0b;'>screenshots/${escapeHtml(data.filename)}</span>: <a href="${data.url}" target="_blank" style="color:var(--cyan-bright);text-decoration:underline;">[View Image]</a>"`;
          }
          // Open generated image in browser tab
          try {
            window.open(data.url, '_blank');
          } catch (e) {}
        } else {
          this.speak("Image synthesis could not complete, boss.");
        }
      })
      .catch(err => {
        console.warn("AI Image generation error:", err);
      });
  }

  normalizeQRTarget(rawTarget) {
    if (!rawTarget) return 'https://www.google.com';
    let target = rawTarget.trim();

    // Clean up spoken "dot com", "dot in", "dot org", "dot net", "dot io", "dot co"
    target = target.replace(/\s+dot\s+/gi, '.');
    target = target.replace(/\s+(?:link|url|website|site|text|page)$/i, '').trim();

    const lower = target.toLowerCase();

    // Check known websites map first
    if (this.knownWebsites[lower]) {
      return this.knownWebsites[lower];
    }
    for (const [key, url] of Object.entries(this.knownWebsites)) {
      if (lower === key || lower.includes(key)) {
        return url;
      }
    }

    // Already a full URL
    if (target.startsWith('http://') || target.startsWith('https://')) {
      return target;
    }

    // Contains domain extension (e.g. site.com, site.org, site.in, site.net, site.io, site.ai, site.co.uk)
    if (target.includes('.') && !target.includes(' ')) {
      return `https://${target.replace(/^www\./, 'www.')}`;
    }

    // Spoken domain words like "amazon com" or "google in"
    const domainWords = target.match(/^([a-z0-9-]+)\s+(com|org|net|io|in|ai|gov|edu|co)$/i);
    if (domainWords) {
      return `https://www.${domainWords[1].toLowerCase()}.${domainWords[2].toLowerCase()}`;
    }

    // Single word without spaces or dots (e.g. "amazon", "flipkart", "reddit", "bing", "quora", "ebay", "pinterest", "apple")
    if (!target.includes(' ') && !target.includes('.')) {
      return `https://www.${lower}.com`;
    }

    // Fallback: If text with spaces (e.g. Wi-Fi password or custom message)
    return target;
  }

  generateQRCode(targetText) {
    targetText = this.normalizeQRTarget(targetText);
    const displayLabel = targetText.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

    sfx.playScan();
    this.speak(`Generating holographic QR code for ${displayLabel}, boss.`);

    const directiveEl = document.getElementById('footDirective');
    if (directiveEl) directiveEl.textContent = `OPTICAL MATRIX: SYNTHESIZING QR // ${targetText.toUpperCase()}`;

    const transText = document.getElementById('voiceTranscriptText');
    if (transText) {
      transText.innerHTML = `<strong>JARVIS:</strong> "Synthesizing QR matrix for <span style='color:var(--cyan-bright);font-weight:bold;'>${escapeHtml(targetText)}</span>..."`;
    }

    // Elements
    const dashWidget = document.getElementById('dashboardQrWidget');
    const dashImg = document.getElementById('dashQrImg');
    const dashSpinner = document.getElementById('dashQrSpinner');
    const dashTarget = document.getElementById('dashQrTargetText');
    const dashPath = document.getElementById('dashQrPathText');

    const modal = document.getElementById('qrCodeModal');
    const modalText = document.getElementById('qrEncodedText');
    const modalImg = document.getElementById('qrDisplayImg');
    const modalSpinner = document.getElementById('qrLoadingSpinner');
    const modalInput = document.getElementById('qrCustomInput');
    const modalSavedPath = document.getElementById('qrSavedPath');

    // 1. Activate Dashboard Center Widget
    if (dashWidget) {
      dashWidget.classList.remove('qr-dashboard-hidden');
      if (dashTarget) dashTarget.textContent = targetText;
      if (dashPath) dashPath.textContent = 'Saving to screenshots folder...';
      if (dashSpinner) dashSpinner.style.display = 'flex';
      if (dashImg) dashImg.style.display = 'none';
    }

    // 2. Activate Holographic Modal
    if (modal) {
      modal.classList.remove('qr-hidden');
      modal.style.display = 'flex';
      if (modalText) modalText.textContent = targetText;
      if (modalInput) modalInput.value = targetText;
      if (modalSavedPath) modalSavedPath.textContent = 'Saving to screenshots folder...';
      if (modalSpinner) modalSpinner.style.display = 'block';
      if (modalImg) modalImg.style.display = 'none';
    }

    // Call Python backend to synthesize and save directly to screenshots folder
    const url = `/api/qrcode?data=${encodeURIComponent(targetText)}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        const qrImgUrl = `${data.qr_url}?t=${Date.now()}`;
        const fileName = data.file || 'qrcode.png';
        const savedLabel = `screenshots/${fileName}`;

        // Update Dashboard Center Widget
        if (dashWidget) {
          if (dashTarget) dashTarget.textContent = data.data;
          if (dashPath) dashPath.textContent = savedLabel;
          if (dashImg) {
            dashImg.onload = () => {
              if (dashSpinner) dashSpinner.style.display = 'none';
              dashImg.style.display = 'block';
            };
            dashImg.onerror = () => {
              if (dashSpinner) dashSpinner.style.display = 'none';
              dashImg.style.display = 'block';
            };
            dashImg.src = qrImgUrl;
          }
        }

        // Update Modal
        if (modal) {
          if (modalText) modalText.textContent = data.data;
          if (modalSavedPath) modalSavedPath.textContent = savedLabel;
          if (modalImg) {
            modalImg.onload = () => {
              if (modalSpinner) modalSpinner.style.display = 'none';
              modalImg.style.display = 'block';
            };
            modalImg.onerror = () => {
              if (modalSpinner) modalSpinner.style.display = 'none';
              modalImg.style.display = 'block';
            };
            modalImg.src = qrImgUrl;
          }
        }

        sfx.playChirp();
        if (directiveEl) directiveEl.textContent = `OPTICAL MATRIX: QR SAVED // SCREENSHOTS/${fileName.toUpperCase()}`;
        if (transText) {
          transText.innerHTML = `<strong>JARVIS:</strong> "QR matrix generated for <span style='color:var(--cyan-bright);font-weight:bold;'>${escapeHtml(data.data)}</span> & saved to <span style='color:#ffbe0b;'>screenshots/${escapeHtml(fileName)}</span>"`;
        }
      })
      .catch(err => {
        console.warn("QR synthesis error:", err);
        // Fallback to client generation if server network error
        const encoded = encodeURIComponent(targetText);
        const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=380x380&data=${encoded}&margin=12`;
        if (dashImg) {
          if (dashSpinner) dashSpinner.style.display = 'none';
          dashImg.style.display = 'block';
          dashImg.src = fallbackUrl;
        }
        if (modalImg) {
          if (modalSpinner) modalSpinner.style.display = 'none';
          modalImg.style.display = 'block';
          modalImg.src = fallbackUrl;
        }
      });
  }

  closeQRCode() {
    const modal = document.getElementById('qrCodeModal');
    if (modal) {
      modal.classList.add('qr-hidden');
      modal.style.display = 'none';
    }
    sfx.playChirp();
    this.speak("QR matrix dismissed, boss.");
    const directiveEl = document.getElementById('footDirective');
    if (directiveEl) directiveEl.textContent = "OPTICAL MATRIX: STANDING BY";
  }

  dismissDashboardQR() {
    const dashWidget = document.getElementById('dashboardQrWidget');
    if (dashWidget) {
      dashWidget.classList.add('qr-dashboard-hidden');
    }
    sfx.playChirp();
  }

  openScreenshotsFolder() {
    sfx.playChirp();
    fetch('/api/open_screenshots_folder')
      .then(res => res.json())
      .catch(err => console.warn("Open folder error:", err));
  }

  writeNotepad({ topic = '', content = '', mode = 'notes', lines = 0 }) {
    const topicLabel = topic || (mode === 'todo' ? 'Daily To-Do Checklist' : 'Notes');
    let speechMsg = "";
    if (mode === 'todo') {
      speechMsg = "Generating your daily to-do checklist in Notepad, boss.";
    } else if (lines > 0) {
      speechMsg = `Compiling ${lines} lines on ${topicLabel} in Notepad, boss.`;
    } else {
      speechMsg = `Researching and writing notes on ${topicLabel} in Notepad, boss.`;
    }
    this.speak(speechMsg);

    const directiveEl = document.getElementById('footDirective');
    if (directiveEl) directiveEl.textContent = `NOTEPAD WRITER: COMPILING [${topicLabel.toUpperCase()}]...`;

    const transText = document.getElementById('voiceTranscriptText');
    if (transText) {
      transText.innerHTML = `<strong>JARVIS:</strong> "${speechMsg}"`;
    }

    const url = `/api/write_notepad?topic=${encodeURIComponent(topic)}&content=${encodeURIComponent(content)}&mode=${encodeURIComponent(mode)}&lines=${encodeURIComponent(lines)}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          sfx.playScan();
          if (directiveEl) directiveEl.textContent = `NOTEPAD WRITER: ${data.filename} ONLINE (${data.lines_count} LINES)`;
        }
      })
      .catch(err => {
        console.warn("Write notepad error:", err);
      });
  }
}

const jarvisVoice = new JarvisVoiceAssistant();

// =========================================================================
// J.A.R.V.I.S. // NEURAL VIDEO EDITING & PRODUCTION DASHBOARD CONTROLLER
// =========================================================================
class JarvisVideoEditingDashboard {
  constructor() {
    this.modal = document.getElementById('videoEditingDashboard');
    this.canvas = document.getElementById('editorCanvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.playBtn = document.getElementById('editorPlayPauseBtn');
    this.stopBtn = document.getElementById('editorStopBtn');
    this.scrubber = document.getElementById('editorScrubber');
    this.timeDisplay = document.getElementById('editorTimeDisplay');
    this.fullscreenBtn = document.getElementById('editorFullscreenBtn');
    this.closeBtn = document.getElementById('closeVideoEditorBtn');
    this.renderBtn = document.getElementById('editorRenderBtn');
    this.openWindowsBtn = document.getElementById('editorOpenWindowsBtn');
    this.projectTitle = document.getElementById('editorProjectTitle');
    this.clipsBin = document.getElementById('editorClipsBin');
    this.subtitlesList = document.getElementById('editorSubtitlesList');
    this.trackClips = document.getElementById('trackClipsTimeline');
    this.trackCaptions = document.getElementById('trackCaptionsTimeline');
    this.playhead = document.getElementById('timelinePlayhead');
    this.clipsCount = document.getElementById('clipsCount');

    this.currentProject = null;
    this.isPlaying = false;
    this.currentTime = 0;
    this.duration = 20;
    this.animFrame = null;
    this.loadedImages = [];
    this.lastTime = 0;

    this.initEvents();
  }

  initEvents() {
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }
    if (this.playBtn) {
      this.playBtn.addEventListener('click', () => this.togglePlay());
    }
    if (this.stopBtn) {
      this.stopBtn.addEventListener('click', () => this.stop());
    }
    if (this.scrubber) {
      this.scrubber.addEventListener('input', (e) => {
        const pct = parseFloat(e.target.value) / 100;
        this.seek(pct * this.duration);
      });
    }
    if (this.fullscreenBtn) {
      this.fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          if (this.modal.requestFullscreen) this.modal.requestFullscreen().catch(() => {});
        } else {
          if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
        }
      });
    }
    if (this.openWindowsBtn) {
      this.openWindowsBtn.addEventListener('click', () => {
        if (this.currentProject && this.currentProject.video_url) {
          window.open(this.currentProject.video_url, '_blank');
        }
      });
    }
    if (this.renderBtn) {
      this.renderBtn.addEventListener('click', () => {
        if (this.currentProject && this.currentProject.topic) {
          jarvisVoice.executeVideoCreation({ topic: this.currentProject.topic });
        }
      });
    }

    // Tabs switching
    const tabBtns = document.querySelectorAll('.editor-sidebar-column .tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const targetTab = btn.getAttribute('data-tab');
        document.querySelectorAll('.editor-sidebar-column .tab-pane').forEach(p => p.classList.remove('active'));
        const pane = document.getElementById(targetTab);
        if (pane) pane.classList.add('active');
      });
    });
  }

  open(topic = 'Iron Man') {
    if (!this.modal) return;
    this.modal.classList.remove('hidden');
    if (this.projectTitle) {
      this.projectTitle.innerHTML = `PROJECT: ${escapeHtml(topic.toUpperCase())} <span class="editor-spec">[1080P/60FPS ● MULTI-TRACK]</span>`;
    }
    const badge = document.getElementById('editorLiveBadge');
    if (badge) badge.textContent = "● COLLECTING ONLINE MEDIA...";
    if (this.clipsBin) {
      this.clipsBin.innerHTML = `
        <div style="padding:20px;text-align:center;color:var(--cyan-bright);font-family:var(--font-mono);font-size:12px;">
          <div style="font-size:24px;margin-bottom:8px;">⚡</div>
          SCANNING WIKIPEDIA & ONLINE ARCHIVES...<br>
          <span style="font-size:10px;color:#aaa;">DOWNLOADING PHOTOS & VIDEO TEMPLATES</span>
        </div>`;
    }
  }

  close() {
    this.stop();
    if (this.modal) this.modal.classList.add('hidden');
  }

  loadProject(project) {
    this.currentProject = project;
    this.duration = project.duration || 20;
    this.currentTime = 0;
    if (this.projectTitle) {
      this.projectTitle.innerHTML = `PROJECT: ${escapeHtml(project.topic.toUpperCase())} <span class="editor-spec">[1080P/60FPS ● MULTI-TRACK]</span>`;
    }
    const badge = document.getElementById('editorLiveBadge');
    if (badge) badge.textContent = "● LIVE TIMELINE PREVIEW";

    // Populate Media Bin
    if (this.clipsBin && project.clips) {
      this.clipsBin.innerHTML = '';
      if (this.clipsCount) this.clipsCount.textContent = project.clips.length;
      project.clips.forEach(clip => {
        const card = document.createElement('div');
        card.className = 'clip-bin-card';
        card.innerHTML = `
          <img src="${clip.url}" class="clip-thumb" onerror="this.src='/assets/TL80.mp4'" />
          <div class="clip-info">
            <div class="clip-title">${escapeHtml(clip.title)}</div>
            <div class="clip-meta">
              <span>${clip.duration}s</span>
              <span class="clip-trans-badge">${escapeHtml(clip.transition || 'Cross Dissolve')}</span>
            </div>
          </div>
        `;
        card.addEventListener('click', () => {
          const clipIdx = clip.id - 1;
          const time = clipIdx * clip.duration;
          this.seek(time);
        });
        this.clipsBin.appendChild(card);
      });
    }

    // Populate Subtitles
    if (this.subtitlesList && project.subtitles) {
      this.subtitlesList.innerHTML = '';
      project.subtitles.forEach(sub => {
        const card = document.createElement('div');
        card.className = 'sub-item-card';
        card.innerHTML = `
          <div class="sub-time">TIMECODE: ${sub.start}s - ${sub.end}s</div>
          <textarea class="sub-input">${escapeHtml(sub.text)}</textarea>
        `;
        const textarea = card.querySelector('textarea');
        textarea.addEventListener('input', (e) => {
          sub.text = e.target.value;
        });
        this.subtitlesList.appendChild(card);
      });
    }

    // Populate Timeline Tracks
    if (this.trackClips && project.clips) {
      this.trackClips.innerHTML = '';
      project.clips.forEach(clip => {
        const block = document.createElement('div');
        block.className = 'timeline-clip-block';
        block.innerHTML = `
          <img src="${clip.url}" class="timeline-clip-thumb" onerror="this.style.display='none'" />
          <span>${escapeHtml(clip.title.slice(0, 14))}</span>
        `;
        block.title = `${clip.title} (${clip.duration}s)`;
        this.trackClips.appendChild(block);
      });
    }

    if (this.trackCaptions && project.subtitles) {
      this.trackCaptions.innerHTML = '';
      project.subtitles.forEach(sub => {
        const block = document.createElement('div');
        block.className = 'timeline-caption-block';
        block.textContent = sub.text;
        block.title = sub.text;
        this.trackCaptions.appendChild(block);
      });
    }

    // Preload image elements for the Canvas animation
    this.loadedImages = [];
    if (project.clips) {
      project.clips.forEach(c => {
        const img = new Image();
        img.src = c.url;
        this.loadedImages.push(img);
      });
    }

    // Timeline Ruler
    const ruler = document.getElementById('timelineRuler');
    if (ruler) {
      ruler.innerHTML = '';
      const totalSec = Math.ceil(this.duration);
      const step = Math.max(2, Math.floor(totalSec / 6));
      for (let s = 0; s <= totalSec; s += step) {
        const span = document.createElement('span');
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        span.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        ruler.appendChild(span);
      }
    }

    this.seek(0);
    this.play();
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    this.isPlaying = true;
    if (this.playBtn) this.playBtn.textContent = '⏸';
    this.lastTime = performance.now();
    this.loop();
  }

  pause() {
    this.isPlaying = false;
    if (this.playBtn) this.playBtn.textContent = '▶';
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
  }

  stop() {
    this.pause();
    this.seek(0);
  }

  seek(timeSec) {
    this.currentTime = Math.max(0, Math.min(this.duration, timeSec));
    this.updateUI();
    this.renderFrame();
  }

  loop() {
    if (!this.isPlaying) return;
    const now = performance.now();
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    this.currentTime += dt;
    if (this.currentTime >= this.duration) {
      this.currentTime = 0; // Loop playback
    }
    this.updateUI();
    this.renderFrame();

    this.animFrame = requestAnimationFrame(() => this.loop());
  }

  updateUI() {
    if (this.scrubber) {
      this.scrubber.value = (this.currentTime / this.duration) * 100;
    }
    if (this.timeDisplay) {
      const curM = Math.floor(this.currentTime / 60).toString().padStart(2, '0');
      const curS = Math.floor(this.currentTime % 60).toString().padStart(2, '0');
      const durM = Math.floor(this.duration / 60).toString().padStart(2, '0');
      const durS = Math.floor(this.duration % 60).toString().padStart(2, '0');
      this.timeDisplay.textContent = `${curM}:${curS} / ${durM}:${durS}`;
    }
    if (this.playhead && this.trackClips && this.trackClips.parentElement) {
      const trackWidth = this.trackClips.parentElement.clientWidth - 130;
      const pct = this.currentTime / this.duration;
      this.playhead.style.left = `${130 + pct * trackWidth}px`;
    }
  }

  renderFrame() {
    if (!this.ctx || !this.currentProject) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.fillStyle = '#080c16';
    ctx.fillRect(0, 0, w, h);

    const clips = this.currentProject.clips || [];
    if (!clips.length) return;

    const clipCount = clips.length;
    const clipDuration = this.duration / clipCount;
    const currentClipIdx = Math.min(clipCount - 1, Math.floor(this.currentTime / clipDuration));
    const nextClipIdx = (currentClipIdx + 1) % clipCount;
    const timeInClip = this.currentTime - (currentClipIdx * clipDuration);
    const transTime = 0.6;

    const zoomProgress = (timeInClip / clipDuration);
    const zoom = 1.0 + zoomProgress * 0.08;

    const curImg = this.loadedImages[currentClipIdx];
    const nextImg = this.loadedImages[nextClipIdx];

    const drawZoomedImage = (img, scale, alpha = 1.0) => {
      if (!img || !img.complete || img.naturalWidth === 0) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      const pw = img.naturalWidth;
      const ph = img.naturalHeight;
      const baseScale = Math.min((w - 40) / pw, (h - 180) / ph);
      const nw = pw * baseScale * scale;
      const nh = ph * baseScale * scale;
      const px = (w - nw) / 2;
      const py = 70 + ((h - 180 - nh) / 2);
      ctx.drawImage(img, px, py, nw, nh);
      ctx.restore();
    };

    const inTransition = timeInClip > (clipDuration - transTime) && currentClipIdx < clipCount - 1;
    if (inTransition) {
      const transAlpha = (timeInClip - (clipDuration - transTime)) / transTime;
      drawZoomedImage(curImg, zoom, 1.0 - transAlpha);
      drawZoomedImage(nextImg, 1.0, transAlpha);
    } else {
      drawZoomedImage(curImg, zoom, 1.0);
    }

    // Vignette Gradients
    const botGrad = ctx.createLinearGradient(0, h - 220, 0, h);
    botGrad.addColorStop(0, 'rgba(5, 8, 15, 0.0)');
    botGrad.addColorStop(0.3, 'rgba(5, 8, 15, 0.75)');
    botGrad.addColorStop(1, 'rgba(5, 8, 15, 0.95)');
    ctx.fillStyle = botGrad;
    ctx.fillRect(0, h - 220, w, 220);

    ctx.fillStyle = 'rgba(5, 8, 15, 0.85)';
    ctx.fillRect(0, 0, w, 60);

    // Stark HUD telemetry elements
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, 58);
    ctx.lineTo(w - 20, 58);
    ctx.moveTo(20, h - 220);
    ctx.lineTo(w - 20, h - 220);
    ctx.stroke();

    // Corner brackets
    const bSize = 25;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(20, 70); ctx.lineTo(20 + bSize, 70); ctx.moveTo(20, 70); ctx.lineTo(20, 70 + bSize); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w - 20, 70); ctx.lineTo(w - 20 - bSize, 70); ctx.moveTo(w - 20, 70); ctx.lineTo(w - 20, 70 + bSize); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(20, h - 20); ctx.lineTo(20 + bSize, h - 20); ctx.moveTo(20, h - 20); ctx.lineTo(20, h - 20 - bSize); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w - 20, h - 20); ctx.lineTo(w - 20 - bSize, h - 20); ctx.moveTo(w - 20, h - 20); ctx.lineTo(w - 20, h - 20 - bSize); ctx.stroke();

    // Header Text
    ctx.fillStyle = '#00f0ff';
    ctx.font = '14px monospace';
    ctx.fillText('J.A.R.V.I.S. MARK VII // AUTONOMOUS VIDEO PRODUCTION', 30, 36);

    ctx.fillStyle = '#ffbe0b';
    ctx.fillText(`SCENE: 0${currentClipIdx + 1} / 0${clipCount}  ● [1080P/60FPS]`, w - 340, 36);

    // Subtitle Typography
    const subs = this.currentProject.subtitles || [];
    const activeSub = subs.find(s => this.currentTime >= s.start && this.currentTime <= s.end) || subs[currentClipIdx];
    if (activeSub && activeSub.text) {
      ctx.font = 'bold 24px "Segoe UI", sans-serif';
      ctx.fillStyle = '#000';
      ctx.fillText(activeSub.text, 42, h - 148);
      ctx.fillStyle = '#fff';
      ctx.fillText(activeSub.text, 40, h - 150);

      if (activeSub.narration && activeSub.narration !== activeSub.text) {
        ctx.font = '15px "Segoe UI", sans-serif';
        ctx.fillStyle = 'rgba(0, 240, 255, 0.9)';
        ctx.fillText(activeSub.narration, 40, h - 110);
      }
    }

    // Audio Visualizer Bars
    ctx.fillStyle = '#00f0ff';
    const barX = w - 240;
    const barY = h - 60;
    for (let b = 0; b < 16; b++) {
      const bh = Math.floor(8 + 18 * Math.pow(Math.sin(b * 0.7 + this.currentTime * 6), 2));
      ctx.fillRect(barX + b * 12, barY - bh, 6, bh);
    }
  }
}

const videoEditingDashboard = new JarvisVideoEditingDashboard();

// ==========================================
// 3. Realtime Clock & Telemetry Polling
// ==========================================
function updateClock() {
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0];
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).toUpperCase();

  const clockEl = document.getElementById('hud-clock');
  const dateEl = document.getElementById('hud-date');
  if (clockEl) clockEl.textContent = timeStr;
  if (dateEl) dateEl.textContent = dateStr;
}

async function fetchTelemetry() {
  try {
    const res = await fetch('/api/telemetry');
    if (res.ok) {
      const data = await res.json();
      renderTelemetry(data);
    }
  } catch (e) {
    const randCpu = Math.floor(18 + Math.random() * 15);
    const randRam = Math.floor(45 + Math.random() * 8);
    renderTelemetry({
      cpu: randCpu,
      ram: randRam,
      uptime: '00:25:10',
      os: 'WINDOWS 64-BIT'
    });
  }
}

function renderTelemetry(data) {
  const { cpu, ram, uptime, os } = data;

  const topCpu = document.getElementById('topCpu');
  const topCpuBar = document.getElementById('topCpuBar');
  if (topCpu) topCpu.textContent = `${cpu}%`;
  if (topCpuBar) topCpuBar.style.width = `${cpu}%`;

  const topRam = document.getElementById('topRam');
  const topRamBar = document.getElementById('topRamBar');
  if (topRam) topRam.textContent = `${ram}%`;
  if (topRamBar) topRamBar.style.width = `${ram}%`;

  const footUptime = document.getElementById('footUptime');
  if (footUptime && uptime) footUptime.textContent = uptime;

  const footOs = document.getElementById('footOs');
  if (footOs && os) footOs.textContent = os.toUpperCase();
}

// ==========================================
// 4. Command Strip Handling
// ==========================================
function handleCommand(cmdText) {
  const cmd = cmdText.trim().toLowerCase();
  if (!cmd) return;

  sfx.playChirp();
  const directiveEl = document.getElementById('footDirective');
  const transTextEl = document.getElementById('voiceTranscriptText');
  if (transTextEl) {
    transTextEl.innerHTML = `<span style="color:#ffbe0b;font-weight:bold;">BOSS:</span> "${escapeHtml(cmdText.trim())}"`;
  }

  // Microsoft Edge WhatsApp Web Messaging in Command Bar (Top Priority for instant execution!)
  if (jarvisVoice.isWhatsAppCommand(cmd)) {
    jarvisVoice.executeWhatsAppCommand(cmd, directiveEl);
    return;
  }

  // Autonomous Video Creation in Command Bar
  const videoDirective = jarvisVoice.parseVideoCreationCommand(cmd);
  if (videoDirective) {
    jarvisVoice.executeVideoCreation(videoDirective);
    return;
  }

  // YouTube Smart Playback in Command Bar
  const ytDirective = jarvisVoice.parseYouTubePlayCommand(cmd);
  if (ytDirective) {
    jarvisVoice.executeYouTubePlay(ytDirective);
    return;
  }

  // Web & YouTube Search Commands in Command Bar
  const searchDirective = jarvisVoice.parseWebSearchCommand(cmd);
  if (searchDirective) {
    jarvisVoice.executeWebSearch(searchDirective);
    return;
  }

  // Check if it's a close/kill command
  const closeMatch = cmd.match(/^(?:close|quit|kill|terminate|exit|stop)\s+(.+)$/i);
  if (closeMatch) {
    let target = closeMatch[1].trim();
    target = target.replace(/^(?:the\s+)?/, '').replace(/\s+(?:app|application|website|site|browser)$/i, '').trim();
    jarvisVoice.closeAppOrWeb(target);
    return;
  }

  // Calculator & Math Commands in Command Bar
  const calcDirective = jarvisVoice.parseCalculatorCommand(cmd);
  if (calcDirective) {
    if (calcDirective.shouldLaunchApp) {
      const exprToType = calcDirective.rawExpression || '';
      fetch(`/api/auto_calc?expr=${encodeURIComponent(exprToType)}`).catch(() => {});
    }
    if (calcDirective.isMath) {
      const spokenReply = calcDirective.shouldLaunchApp 
        ? `Opening Calculator, boss. ${calcDirective.expression} equals ${calcDirective.result}.`
        : `${calcDirective.expression} equals ${calcDirective.result}, boss.`;

      jarvisVoice.speak(spokenReply);
      const transText = document.getElementById('voiceTranscriptText');
      if (transText) {
        transText.innerHTML = `<strong>JARVIS:</strong> "${escapeHtml(spokenReply)}" <span style="color:var(--cyan-bright);font-weight:bold;font-family:var(--font-hud);">[${escapeHtml(calcDirective.expression)} = ${escapeHtml(calcDirective.result)}]</span>`;
      }
      if (directiveEl) {
        directiveEl.textContent = `CALCULATOR MATRIX: ${calcDirective.expression} = ${calcDirective.result}`;
      }
      sfx.playScan();
      return;
    } else if (calcDirective.shouldLaunchApp) {
      return;
    }
  }

  // Check if it's a Presentation / PPT / Slides command
  if (/make\s+(?:a\s+)?ppt|create\s+(?:a\s+)?ppt|generate\s+(?:a\s+)?ppt|make\s+presentation|create\s+presentation|presentation\s+on|\d+\s+slides?/i.test(cmd)) {
    jarvisVoice.askJarvis(cmd);
    return;
  }

  // Check if it's a Deep Research / Prepare Notes / Prepare Text command (Priority routing!)
  if (/prepare\s+(?:notes?|text|dossier)/i.test(cmd) || /dossier|deep\s+research/i.test(cmd) || (/research/i.test(cmd) && /notes?|text|prepare|compile|write|milestone|report|briefing|latest/i.test(cmd)) || /prepare\s+(?:notes?|text)$/i.test(cmd)) {
    jarvisVoice.askJarvis(cmd);
    return;
  }

  // Check if it's a Notepad / Write command (BEFORE open commands!)
  if ((cmd.includes('notepad') && cmd.includes('write')) || cmd.match(/write\s+\d+\s+lines/i) || cmd.startsWith('write about') || cmd.startsWith('notepad ') || cmd.includes('to-do') || cmd.includes('todo') || cmd.startsWith('write in notepad')) {
    if (cmd.includes('to-do') || cmd.includes('todo')) {
      jarvisVoice.writeNotepad({ mode: 'todo', topic: 'Daily To-Do Checklist' });
    } else {
      const lineMatch = cmd.match(/(\d+)\s+lines?/i);
      const reqLines = lineMatch ? parseInt(lineMatch[1], 10) : 0;
      let topic = cmd.replace(/^(?:open\s+notepad\s+and\s+write\s+about|write\s+about|notepad|write\s+in\s+notepad|write|open\s+notepad\s+and\s+write)\s*[:\s]*/i, '');
      topic = topic.replace(/(\d+)\s+lines?\s+(?:about|on|of)?/i, '').replace(/\s+in\s+(\d+)\s+lines?/i, '').replace(/\s+in\s+notepad$/i, '').trim();
      jarvisVoice.writeNotepad({ topic: topic || 'Research Notes', lines: reqLines, mode: 'notes' });
    }
    return;
  }

  // Check if it's an app or web launch command
  const openMatch = cmd.match(/^(?:open|launch|start|run|go\s+to)\s+(.+)$/i);
  if (openMatch) {
    const target = openMatch[1].trim().replace(/\s+(?:app|application|website|site|browser)$/i, '');
    jarvisVoice.launchAnyAppOrWebsite(target);
    return;
  }

  // Direct app / web execution if typed alone
  if (cmd.length >= 3 && !cmd.includes(' ') && !cmd.includes('?') && !cmd.includes(':')) {
    jarvisVoice.launchAnyAppOrWebsite(cmd);
    return;
  }

  // Check for greetings, jokes, about yourself, and time
  if (cmd.includes("good morning") || cmd.includes("good afternoon") || cmd.includes("good evening")) {
    const { salutation, timeString } = getTimeGreeting();
    const reply = `Hello boss. ${salutation}. The current time is ${timeString}. J.A.R.V.I.S. is online and ready for your command.`;
    jarvisVoice.speak(reply);
    const transText = document.getElementById('voiceTranscriptText');
    if (transText) transText.innerHTML = `<strong>JARVIS:</strong> "${reply}"`;
    if (directiveEl) directiveEl.textContent = `GREETING: ${salutation.toUpperCase()} // TIME: ${timeString}`;
    return;
  }

  if (/^(hi|hello|hey|greetings)(\s+(boss|there|jarvis|hi|hello))?$/i.test(cmd) ||
      cmd === 'hi hello' || cmd === 'hello hi' || cmd === 'hi there' || cmd === 'hello there' ||
      cmd === 'hey jarvis' || cmd === 'hello jarvis' || cmd === 'hi jarvis' || cmd === 'hello boss' ||
      cmd === 'hi boss' || cmd === 'jarvis') {
    const { salutation } = getTimeGreeting();
    const reply = `Hello boss! ${salutation}. J.A.R.V.I.S. is online and ready. How may I assist you?`;
    jarvisVoice.speak(reply);
    const transText = document.getElementById('voiceTranscriptText');
    if (transText) transText.innerHTML = `<strong>JARVIS:</strong> "${reply}"`;
    if (directiveEl) directiveEl.textContent = "JARVIS VOICE: ONLINE // STANDING BY";
    return;
  }

  if (cmd.includes("about yourself") || cmd.includes("who are you") || cmd.includes("introduce yourself") || cmd.includes("tell me about yourself")) {
    const reply = "I am J.A.R.V.I.S., Just A Rather Very Intelligent System. Cybernetic assistant created for boss Arun.";
    jarvisVoice.speak(reply);
    const transText = document.getElementById('voiceTranscriptText');
    if (transText) transText.innerHTML = `<strong>JARVIS:</strong> "${reply}"`;
    if (directiveEl) directiveEl.textContent = "SYSTEM IDENT: J.A.R.V.I.S. MARK VII";
    return;
  }

  if (cmd.includes("tell a joke") || cmd.includes("tell me a joke") || cmd.includes("joke") || cmd.includes("jokes") || cmd.includes("funny")) {
    const jokes = [
      "Why did the computer catch a cold, boss? Because it left its Windows open.",
      "Why do programmers prefer dark mode? Because light attracts bugs.",
      "There are 10 types of people in the world: those who understand binary, and those who do not.",
      "I asked Tony Stark if he could build a non-alcoholic beer. He replied, 'I can, but that is not how iron men are made.'",
      "Why did the neural network cross the road? To optimize the loss function on the other side.",
      "Why was the JavaScript developer sad? Because they did not know how to null their feelings."
    ];
    const joke = jokes[Math.floor(Math.random() * jokes.length)];
    jarvisVoice.speak(joke);
    const transText = document.getElementById('voiceTranscriptText');
    if (transText) transText.innerHTML = `<strong>JARVIS:</strong> "${joke}"`;
    if (directiveEl) directiveEl.textContent = "HUMOR MATRIX: EXECUTED JOKE PROTOCOL";
    return;
  }

  if (cmd.includes("what time") || cmd.includes("time now") || cmd === 'time') {
    const { timeString } = getTimeGreeting();
    const reply = `Boss, the current time is ${timeString}.`;
    jarvisVoice.speak(reply);
    const transText = document.getElementById('voiceTranscriptText');
    if (transText) transText.innerHTML = `<strong>JARVIS:</strong> "${reply}"`;
    if (directiveEl) directiveEl.textContent = `TIME: ${timeString}`;
    return;
  }

  const normQuickCmd = cmd.replace(/[^a-z0-9\s]/g, '').trim();
  const compactQuickCmd = normQuickCmd.replace(/\s+/g, '');
  if (/\b(?:who\s+is\s+arun|tell\s+me\s+who\s+is\s+arun|tell\s+me\s+about\s+arun)\b/i.test(normQuickCmd) || compactQuickCmd === 'arun' || compactQuickCmd === 'whoisarun' || normQuickCmd.includes('who is a r u n')) {
    const reply = "Arun is your best friend from B.Tech college, sir.";
    jarvisVoice.speak(reply);
    const transText = document.getElementById('voiceTranscriptText');
    if (transText) transText.innerHTML = `<strong>JARVIS:</strong> "${reply}"`;
    if (directiveEl) directiveEl.textContent = "DOSSIER: ARUN // B.TECH BEST FRIEND";
    return;
  }

  if (/\b(?:who\s+is\s+vedanth?|tell\s+me\s+who\s+is\s+vedanth?|tell\s+me\s+about\s+vedanth?)\b/i.test(normQuickCmd) || compactQuickCmd === 'vedanth' || compactQuickCmd === 'vedant' || compactQuickCmd === 'whoisvedanth' || compactQuickCmd === 'whoisvedant') {
    const reply = "Vedanth is your best friend from B.Tech college, sir.";
    jarvisVoice.speak(reply);
    const transText = document.getElementById('voiceTranscriptText');
    if (transText) transText.innerHTML = `<strong>JARVIS:</strong> "${reply}"`;
    if (directiveEl) directiveEl.textContent = "DOSSIER: VEDANTH // B.TECH BEST FRIEND";
    return;
  }

  if (/\b(?:who\s+is\s+bhargav(?:a)?|tell\s+me\s+who\s+is\s+bhargav(?:a)?|tell\s+me\s+about\s+bhargav(?:a)?)\b/i.test(normQuickCmd) || compactQuickCmd === 'bhargav' || compactQuickCmd === 'bhargava' || compactQuickCmd === 'whoisbhargav') {
    const reply = "Bhargav is your best friend from B.Tech college, sir.";
    jarvisVoice.speak(reply);
    const transText = document.getElementById('voiceTranscriptText');
    if (transText) transText.innerHTML = `<strong>JARVIS:</strong> "${reply}"`;
    if (directiveEl) directiveEl.textContent = "DOSSIER: BHARGAV // B.TECH BEST FRIEND";
    return;
  }

  if (/\b(?:who\s+are\s+(?:my\s+)?(?:best\s+)?friends|my\s+friends|college\s+friends|btech\s+friends)\b/i.test(normQuickCmd)) {
    const reply = "Arun, Vedanth, and Bhargav are your best friends from B.Tech college, sir.";
    jarvisVoice.speak(reply);
    const transText = document.getElementById('voiceTranscriptText');
    if (transText) transText.innerHTML = `<strong>JARVIS:</strong> "${reply}"`;
    if (directiveEl) directiveEl.textContent = "DOSSIER: B.TECH BEST FRIENDS";
    return;
  }

  // Autonomous Hands-Free Document Converter in Downloads
  const isDocConvert = (cmd.includes('convert') || cmd.includes('conversion')) &&
    (cmd.includes('pdf') || cmd.includes('word') || cmd.includes('doc') || cmd.includes('ppt') || cmd.includes('powerpoint'));

  if (isDocConvert) {
    let fromFmt = 'pdf';
    let toFmt = 'docx';

    const pdfIdx = cmd.indexOf('pdf');
    const wordIdx = Math.max(cmd.indexOf('word'), cmd.indexOf('doc'));
    const pptIdx = Math.max(cmd.indexOf('ppt'), cmd.indexOf('powerpoint'));

    if (pdfIdx !== -1 && wordIdx !== -1) {
      if (pdfIdx < wordIdx) {
        fromFmt = 'pdf';
        toFmt = 'docx';
      } else {
        fromFmt = 'docx';
        toFmt = 'pdf';
      }
    } else if (wordIdx !== -1 && pdfIdx !== -1) {
      fromFmt = 'docx';
      toFmt = 'pdf';
    } else if (pptIdx !== -1 && pdfIdx !== -1) {
      if (pptIdx < pdfIdx) {
        fromFmt = 'pptx';
        toFmt = 'pdf';
      } else {
        fromFmt = 'pdf';
        toFmt = 'pptx';
      }
    } else if (cmd.includes('pdf to word') || cmd.includes('pdf into word')) {
      fromFmt = 'pdf';
      toFmt = 'docx';
    } else if (cmd.includes('word to pdf') || cmd.includes('doc to pdf') || cmd.includes('word into pdf')) {
      fromFmt = 'docx';
      toFmt = 'pdf';
    } else if (cmd.includes('ppt to pdf') || cmd.includes('powerpoint to pdf')) {
      fromFmt = 'pptx';
      toFmt = 'pdf';
    }

    jarvisVoice.convertDownloadsDocument(fromFmt, toFmt);
    return;
  }

  // Presentation / PPT / Slide Generation voice command routing
  if (/make\s+(?:a\s+)?ppt|create\s+(?:a\s+)?ppt|generate\s+(?:a\s+)?ppt|make\s+presentation|create\s+presentation|presentation\s+on|\d+\s+slides?/i.test(cmd)) {
    jarvisVoice.askJarvis(cmd);
    return;
  }

  // Deep Research & Prepare Notes / Prepare Text voice command routing
  if (/prepare\s+(?:notes?|text|dossier)/i.test(cmd) || /dossier|deep\s+research/i.test(cmd) || (/research/i.test(cmd) && /notes?|text|prepare|compile|write|milestone|report|briefing|latest/i.test(cmd)) || /prepare\s+(?:notes?|text)$/i.test(cmd)) {
    jarvisVoice.askJarvis(cmd);
    return;
  }

  if (cmd.startsWith('tell me about') || cmd.startsWith('what is') || cmd.startsWith('who is') || cmd.startsWith('explain ')) {
    jarvisVoice.askJarvis(cmd);
    return;
  }

  // QR Code generator command bar support
  if (cmd.startsWith('qr ') || cmd.startsWith('qrcode ') || cmd.includes('qr code')) {
    let target = cmd.replace(/^(?:qr|qrcode)\s+/i, '').replace(/.*qr\s*code\s*(?:for\s+)?/i, '').trim();
    if (target.includes('close') || target.includes('hide') || target.includes('dismiss')) {
      jarvisVoice.closeQRCode();
      jarvisVoice.dismissDashboardQR();
    } else {
      jarvisVoice.generateQRCode(target || 'https://www.google.com');
    }
    return;
  }

  if (cmd.includes('write about') || cmd.startsWith('notepad ') || cmd.includes('to-do') || cmd.includes('todo') || cmd.startsWith('write in notepad') || cmd.match(/write\s+\d+\s+lines/)) {
    if (cmd.includes('to-do') || cmd.includes('todo')) {
      jarvisVoice.writeNotepad({ mode: 'todo', topic: 'Daily To-Do' });
    } else {
      const lineMatch = cmd.match(/(\d+)\s+lines?/i);
      const reqLines = lineMatch ? parseInt(lineMatch[1], 10) : 0;
      let topic = cmd.replace(/^(?:open\s+notepad\s+and\s+write\s+about|write\s+about|notepad|write\s+in\s+notepad|write)\s*[:\s]*/i, '');
      topic = topic.replace(/(\d+)\s+lines?\s+(?:about|on|of)?/i, '').replace(/\s+in\s+(\d+)\s+lines?/i, '').replace(/\s+in\s+notepad$/i, '').trim();
      jarvisVoice.writeNotepad({ topic, lines: reqLines, mode: 'notes' });
    }
    return;
  }

  if (cmd.includes('workspace') || cmd.includes('tasks')) {
    if (cmd.includes('close') || cmd.includes('exit') || cmd.includes('stop')) {
      holographicWorkspace.closeWorkspace();
    } else {
      holographicWorkspace.openWorkspace();
    }
    return;
  }

  if (cmd.includes('camera') || cmd.includes('webcam') || cmd.includes('ar workspace') || cmd.includes('hand tracking') || cmd.includes('hologram') || cmd.includes('ar mode')) {
    if (cmd.includes('close') || cmd.includes('exit') || cmd.includes('stop') || cmd.includes('off') || cmd.includes('disengage')) {
      arHoloWorkspace.close();
    } else {
      arHoloWorkspace.open();
    }
    return;
  }

  if (cmd.includes('visor') || cmd.includes('cockpit') || cmd.includes('helmet')) {
    if (cmd.includes('close') || cmd.includes('exit') || cmd.includes('stop') || cmd.includes('off') || cmd.includes('disengage')) {
      starkCockpitHud.close();
    } else {
      starkCockpitHud.open();
    }
    return;
  }

  if (cmd.includes('screenshot') || cmd.includes('capture screen')) {
    jarvisVoice.takeScreenshot();
    return;
  }

  if (cmd.includes('volume') || cmd === 'mute' || cmd === 'unmute') {
    jarvisVoice.adjustVolume(cmd);
    return;
  }

  if (cmd.includes('brightness')) {
    jarvisVoice.adjustBrightness(cmd);
    return;
  }

  if (cmd === 'scan') {
    sfx.playScan();
    if (directiveEl) directiveEl.textContent = "DIAGNOSTIC SWEEP: ALL 10 FEEDS 100% OPERATIONAL";
  } else if (cmd === 'theme') {
    toggleTheme();
    if (directiveEl) directiveEl.textContent = "THEME: DISPLAY COLOR PALETTE UPDATED";
  } else if (cmd.startsWith('power')) {
    const val = cmd.split(' ')[1];
    const fluxEl = document.getElementById('coreFluxText');
    const tempEl = document.getElementById('footTemp');
    if (fluxEl && val) {
      fluxEl.textContent = (parseFloat(val) * 0.038).toFixed(2);
      if (tempEl) tempEl.textContent = `${(3800 + parseInt(val, 10) * 12).toLocaleString()} °C`;
      if (directiveEl) directiveEl.textContent = `ARC CORE OUTPUT CALIBRATED TO ${val}%`;
    }
  } else if (cmd === 'overcharge') {
    sfx.playScan();
    const fluxEl = document.getElementById('coreFluxText');
    const tempEl = document.getElementById('footTemp');
    if (fluxEl) fluxEl.textContent = "5.51";
    if (tempEl) tempEl.textContent = "5,540 °C";
    if (directiveEl) directiveEl.textContent = "WARNING: ARC REACTOR OVERCHARGE LEVEL AT 145%";
  } else {
    // If not a recognized system command, route to askJarvis to answer boss's question
    jarvisVoice.askJarvis(cmdText);
  }
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ==========================================
// 5. Modal Enlarger (Full resolution inspection)
// ==========================================
function setupModal() {
  const modal = document.getElementById('assetModal');
  const modalVid = document.getElementById('modalVid');
  const modalTitle = document.getElementById('modalTitle');
  const modalClose = document.getElementById('modalClose');
  const modalBg = modal ? modal.querySelector('.modal-bg') : null;

  function open(src, title) {
    if (!modal || !modalVid) return;
    sfx.playScan();
    modalTitle.textContent = title ? title.toUpperCase() : 'FEED INSPECTION';
    modalVid.src = src;
    modal.classList.remove('hidden');
    modalVid.play();
  }

  function close() {
    if (!modal || !modalVid) return;
    sfx.playChirp();
    modal.classList.add('hidden');
    modalVid.pause();
    modalVid.src = '';
  }

  if (modalClose) modalClose.addEventListener('click', close);
  if (modalBg) modalBg.addEventListener('click', close);

  document.querySelectorAll('.hud-widget, .arc-prime-wrapper').forEach(widget => {
    widget.addEventListener('click', () => {
      const vid = widget.querySelector('video');
      const title = widget.querySelector('.title, .core-heading');
      if (vid) {
        open(vid.src, title ? title.textContent : 'HUD NODE');
      }
    });
  });
}

// ==========================================
// 6. Theme & Sound Toggles
// ==========================================
function toggleTheme() {
  sfx.playChirp();
  document.body.classList.toggle('theme-gold');
}

function setupToggles() {
  const audioToggle = document.getElementById('audioToggle');
  const sfxStatus = document.getElementById('sfxStatus');
  if (audioToggle) {
    audioToggle.addEventListener('click', () => {
      sfx.enabled = !sfx.enabled;
      if (sfxStatus) sfxStatus.textContent = sfx.enabled ? 'ON' : 'OFF';
      if (sfx.enabled) sfx.playBeep(880, 'sine', 0.1);
    });
  }

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

  const holoWorkspaceBtn = document.getElementById('holoWorkspaceBtn');
  if (holoWorkspaceBtn) {
    holoWorkspaceBtn.addEventListener('click', () => {
      if (holographicWorkspace.isOpen) {
        holographicWorkspace.closeWorkspace();
      } else {
        holographicWorkspace.openWorkspace();
      }
    });
  }
}
// ==========================================
// 7. STARK COCKPIT // FIRST-PERSON HELMET VISOR HUD CONTROLLER
//    Cinematic 1-to-1 Iron Man In-Helmet HUD Replica (Matching tony-jarvis.png)
//    Features Real-Time MediaPipe 468-Landmark Iris & Eye Tracking
// ==========================================
class StarkCockpitHudController {
  constructor() {
    this.isOpen = false;
    this.stream = null;
    this.audioCtx = null;
    this.analyser = null;
    this.dataArray = null;

    this.animLoopId = null;
    this.detectLoopId = null;
    this.telemetryIntervalId = null;

    this.faceMesh = null;
    this.isDetecting = false;

    // Organic motion & tracking angles
    this.rotationAngle = 0;
    this.sweepAngle = 0;
    this.sweepDir = 1;

    // Manual trim adjustment (Arrow keys can fine-tune if user desires)
    this.manualTrim = { x: 0, y: 0, scale: 1.0 };

    // Real-Time Tracked Feature Coordinates
    this.tracked = {
      hasFace: false,
      leftEye: { x: 0, y: 0 },
      rightEye: { x: 0, y: 0 },
      forehead: { x: 0, y: 0 },
      bridge: { x: 0, y: 0 },
      mouth: { x: 0, y: 0 },
      cheek: { x: 0, y: 0 },
      tilt: 0,
      scale: 1.0
    };

    this.targets = JSON.parse(JSON.stringify(this.tracked));

    // Real system telemetry cache
    this.telemetry = {
      cpu: 29,
      ram: 42,
      ramUsed: "6.7 GB",
      ramTotal: "16.0 GB",
      disk: 55,
      uptime: "0d 0h 5min",
      battery: "100%",
      powerLine: "100% AC Line"
    };
  }

  init() {
    const exitBtn = document.getElementById('closeCockpitBtn');
    if (exitBtn) {
      exitBtn.addEventListener('click', () => this.close());
    }

    const visorBtn = document.getElementById('cockpitVisorBtn');
    if (visorBtn) {
      visorBtn.addEventListener('click', () => {
        sfx.playChirp();
        this.open();
      });
    }

    // Keyboard trim nudging (Arrow keys to trim eye alignment in real time)
    window.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'ArrowUp') { this.manualTrim.y -= 4; e.preventDefault(); }
      else if (e.key === 'ArrowDown') { this.manualTrim.y += 4; e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { this.manualTrim.x -= 4; e.preventDefault(); }
      else if (e.key === 'ArrowRight') { this.manualTrim.x += 4; e.preventDefault(); }
      else if (e.key === '+' || e.key === '=') { this.manualTrim.scale = Math.min(2.0, this.manualTrim.scale + 0.05); }
      else if (e.key === '-' || e.key === '_') { this.manualTrim.scale = Math.max(0.5, this.manualTrim.scale - 0.05); }
    });

    window.addEventListener('resize', () => {
      if (this.isOpen) this.syncCanvasDimensions();
    });
  }

  async open() {
    const hud = document.getElementById('starkCockpitHud');
    if (!hud) return;

    hud.classList.remove('hidden');
    this.isOpen = true;
    sfx.playScan();
    jarvisVoice.speak("Deploying Mark VII Cockpit Visor HUD, boss. Retinal biometrics locked.");

    const directiveEl = document.getElementById('footDirective');
    if (directiveEl) directiveEl.textContent = "COCKPIT VISOR HUD: ENGAGED // OCULAR LOCK ACTIVE";

    this.syncCanvasDimensions();

    // Reset default initial targets based on current screen size
    const W = window.innerWidth;
    const H = window.innerHeight;
    this.targets.leftEye = { x: W * 0.43, y: H * 0.44 };
    this.targets.rightEye = { x: W * 0.57, y: H * 0.44 };
    this.targets.forehead = { x: W * 0.50, y: H * 0.28 };
    this.targets.bridge = { x: W * 0.50, y: H * 0.44 };
    this.targets.mouth = { x: W * 0.50, y: H * 0.62 };
    this.targets.cheek = { x: W * 0.63, y: H * 0.56 };
    this.targets.scale = 1.0;
    this.targets.tilt = 0;
    this.tracked = JSON.parse(JSON.stringify(this.targets));

    await this.startMedia();
    this.startHologramRenderLoop();
    this.startTelemetrySync();
  }

  async close() {
    const hud = document.getElementById('starkCockpitHud');
    if (hud) hud.classList.add('hidden');
    this.isOpen = false;

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try { await this.audioCtx.close(); } catch (_) {}
      this.audioCtx = null;
    }

    if (this.animLoopId) { cancelAnimationFrame(this.animLoopId); this.animLoopId = null; }
    if (this.detectLoopId) { clearTimeout(this.detectLoopId); this.detectLoopId = null; }
    if (this.telemetryIntervalId) { clearInterval(this.telemetryIntervalId); this.telemetryIntervalId = null; }

    jarvisVoice.speak("Visor HUD disengaged.");
    const directiveEl = document.getElementById('footDirective');
    if (directiveEl) directiveEl.textContent = "OPTICAL SENSORS: STANDBY";
  }

  syncCanvasDimensions() {
    const canvas = document.getElementById('cockpitReticleCanvas');
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  }

  async startMedia() {
    const video = document.getElementById('cockpitLiveVideo');
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: "user" },
        audio: true
      });

      if (video) {
        video.srcObject = this.stream;
        await video.play();
      }

      // Audio Analyser
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioCtx();
      const source = this.audioCtx.createMediaStreamSource(this.stream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.8;
      source.connect(this.analyser);
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      // Initialize Real-Time MediaPipe FaceMesh
      this.initFaceMeshTracking();

    } catch (err) {
      console.warn("[StarkCockpit] Camera stream error:", err);
    }
  }

  initFaceMeshTracking() {
    if (!window.FaceMesh) {
      console.warn("[StarkCockpit] FaceMesh script not found, using calibrated fallback.");
      return;
    }

    try {
      this.faceMesh = new window.FaceMesh({
        locateFile: (file) => `vendor/${file}`
      });

      this.faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true, // Enables iris & pupil coordinate precision!
        minDetectionConfidence: 0.45,
        minTrackingConfidence: 0.45
      });

      this.faceMesh.onResults((results) => {
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
          this.processFaceLandmarks(results.multiFaceLandmarks[0]);
        }
      });

      const video = document.getElementById('cockpitLiveVideo');
      const detectNext = async () => {
        if (!this.isOpen) return;
        if (video && video.readyState >= 2 && this.faceMesh && !this.isDetecting) {
          this.isDetecting = true;
          try {
            await this.faceMesh.send({ image: video });
          } catch (_) {}
          this.isDetecting = false;
        }
        if (this.isOpen) {
          this.detectLoopId = setTimeout(detectNext, 33); // ~30 FPS tracking loop
        }
      };

      detectNext();
      console.log("[StarkCockpit] MediaPipe FaceMesh real-time eye tracking engaged!");
    } catch (e) {
      console.error("[StarkCockpit] Error starting FaceMesh:", e);
    }
  }

  // --------------------------------------------------------------------------
  // LANDMARK MAPPING (PIXEL-PERFECT CONVERSION TO SCREEN SPACE)
  // --------------------------------------------------------------------------
  processFaceLandmarks(landmarks) {
    const canvas = document.getElementById('cockpitReticleCanvas');
    const video = document.getElementById('cockpitLiveVideo');
    if (!canvas || !video) return;

    const vW = video.videoWidth || 1280;
    const vH = video.videoHeight || 720;
    const cW = canvas.width;
    const cH = canvas.height;

    // object-fit: cover mapping
    const vRatio = vW / vH;
    const cRatio = cW / cH;
    let renderW, renderH, offsetX, offsetY;

    if (cRatio > vRatio) {
      renderW = cW;
      renderH = cW / vRatio;
      offsetX = 0;
      offsetY = (cH - renderH) / 2;
    } else {
      renderH = cH;
      renderW = cH * vRatio;
      offsetX = (cW - renderW) / 2;
      offsetY = 0;
    }

    // Video is mirrored horizontally via scaleX(-1) -> (1 - lm.x)
    const map = (lm) => ({
      x: offsetX + (1 - lm.x) * renderW,
      y: offsetY + lm.y * renderH
    });

    // Iris 468 is user's right iris (appears on viewer's LEFT when mirrored)
    // Iris 473 is user's left iris (appears on viewer's RIGHT when mirrored)
    let pLeft = map(landmarks[468] || landmarks[159] || landmarks[133] || landmarks[33]);
    let pRight = map(landmarks[473] || landmarks[386] || landmarks[362] || landmarks[263]);

    // Ensure pLeft is on the viewer's left (smaller x)
    if (pLeft.x > pRight.x) {
      const temp = pLeft;
      pLeft = pRight;
      pRight = temp;
    }

    const pBridge = map(landmarks[168] || landmarks[6]);
    const pForehead = map(landmarks[10]);
    const pMouth = map(landmarks[152] || landmarks[13]);

    // Right cheek (viewer's right side, x > pBridge.x)
    let pCheek = map(landmarks[454] || landmarks[234]);
    if (pCheek.x < pBridge.x) {
      pCheek = map(landmarks[234]);
    }

    const eyeDist = Math.hypot(pRight.x - pLeft.x, pRight.y - pLeft.y);
    const scale = Math.max(0.65, Math.min(1.8, eyeDist / 135));
    const tilt = Math.atan2(pRight.y - pLeft.y, pRight.x - pLeft.x);

    this.targets.leftEye = pLeft;
    this.targets.rightEye = pRight;
    this.targets.bridge = pBridge;
    this.targets.forehead = pForehead;
    this.targets.mouth = pMouth;
    this.targets.cheek = pCheek;
    this.targets.scale = scale;
    this.targets.tilt = tilt;
    this.tracked.hasFace = true;
  }

  startTelemetrySync() {
    const update = async () => {
      if (!this.isOpen) return;
      try {
        const res = await fetch('/api/system_stats');
        const data = await res.json();
        if (data.cpu) this.telemetry.cpu = data.cpu;
        if (data.ram) this.telemetry.ram = data.ram;
        if (data.ramUsed) this.telemetry.ramUsed = data.ramUsed;
        if (data.ramTotal) this.telemetry.ramTotal = data.ramTotal;
        if (data.disk) this.telemetry.disk = data.disk;
        if (data.uptime) this.telemetry.uptime = data.uptime;
      } catch (_) {
        this.telemetry.cpu = Math.floor(24 + Math.sin(Date.now() * 0.001) * 8);
      }
    };

    update();
    this.telemetryIntervalId = setInterval(update, 2000);
  }

  // --------------------------------------------------------------------------
  // HOLOGRAM RENDER LOOP (WITH REAL-TIME EYE-LOCKING)
  // --------------------------------------------------------------------------
  startHologramRenderLoop() {
    const canvas = document.getElementById('cockpitReticleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = () => {
      if (!this.isOpen) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      this.rotationAngle += 0.018;
      this.sweepAngle += 0.025 * this.sweepDir;
      if (this.sweepAngle > 0.8) this.sweepDir = -1;
      if (this.sweepAngle < -0.8) this.sweepDir = 1;

      const W = canvas.width;
      const H = canvas.height;

      // Smooth interpolation to target facial coordinates
      const lerp = (a, b, t) => a + (b - a) * t;
      const smooth = 0.45; // Fast, responsive, flutter-free tracking

      this.tracked.leftEye.x = lerp(this.tracked.leftEye.x, this.targets.leftEye.x, smooth);
      this.tracked.leftEye.y = lerp(this.tracked.leftEye.y, this.targets.leftEye.y, smooth);

      this.tracked.rightEye.x = lerp(this.tracked.rightEye.x, this.targets.rightEye.x, smooth);
      this.tracked.rightEye.y = lerp(this.tracked.rightEye.y, this.targets.rightEye.y, smooth);

      this.tracked.bridge.x = lerp(this.tracked.bridge.x, this.targets.bridge.x, smooth);
      this.tracked.bridge.y = lerp(this.tracked.bridge.y, this.targets.bridge.y, smooth);

      this.tracked.forehead.x = lerp(this.tracked.forehead.x, this.targets.forehead.x, smooth);
      this.tracked.forehead.y = lerp(this.tracked.forehead.y, this.targets.forehead.y, smooth);

      this.tracked.mouth.x = lerp(this.tracked.mouth.x, this.targets.mouth.x, smooth);
      this.tracked.mouth.y = lerp(this.tracked.mouth.y, this.targets.mouth.y, smooth);

      this.tracked.cheek.x = lerp(this.tracked.cheek.x, this.targets.cheek.x, smooth);
      this.tracked.cheek.y = lerp(this.tracked.cheek.y, this.targets.cheek.y, smooth);

      this.tracked.scale = lerp(this.tracked.scale, this.targets.scale, smooth);
      this.tracked.tilt = lerp(this.tracked.tilt, this.targets.tilt, smooth);

      const effectiveScale = this.tracked.scale * this.manualTrim.scale;
      const tilt = this.tracked.tilt;

      // Microphone volume pulse
      let micVol = 0;
      if (this.analyser && this.dataArray) {
        this.analyser.getByteFrequencyData(this.dataArray);
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) sum += this.dataArray[i];
        micVol = sum / this.dataArray.length;
      }

      // Eye Anchors (Directly locked to the actual human eyes!)
      const lx = this.tracked.leftEye.x + this.manualTrim.x;
      const ly = this.tracked.leftEye.y + this.manualTrim.y;
      const rx = this.tracked.rightEye.x + this.manualTrim.x;
      const ry = this.tracked.rightEye.y + this.manualTrim.y;

      // ======================================================================
      // 1. LEFT EYE: CONCENTRIC CALIBRATED RETICLE (LOCKED EXACTLY ON LEFT EYE)
      // ======================================================================
      this.drawLeftEyeConcentric(ctx, lx, ly, this.rotationAngle, effectiveScale, tilt);

      // ======================================================================
      // 2. RIGHT EYE: TRANSLUCENT BLUE VISOR SHADE (LOCKED EXACTLY ON RIGHT EYE)
      // ======================================================================
      this.drawRightEyeVisorShade(ctx, rx, ry, this.rotationAngle, this.sweepAngle, effectiveScale, tilt);

      // ======================================================================
      // 3. FOREHEAD & NOSE BRIDGE TELEMETRY (LOCKED ON FOREHEAD & BRIDGE)
      // ======================================================================
      this.drawForeheadAndBridge(ctx, this.tracked.forehead, this.tracked.bridge, effectiveScale, tilt);

      // ======================================================================
      // 4. UNDER NOSE / CHIN: DIGITAL TIME & STATUS (LOCKED ON MOUTH/CHIN)
      // ======================================================================
      this.drawMouthAndChinTelemetry(ctx, this.tracked.mouth, micVol, effectiveScale, tilt);

      // ======================================================================
      // 5. RIGHT CHEEK: CRIMSON CIRCULAR TARGET LOCK (LOCKED ON RIGHT CHEEK)
      // ======================================================================
      this.drawRightCheekTargetLock(ctx, this.tracked.cheek, this.rotationAngle, effectiveScale, tilt);

      // ======================================================================
      // 6. UPPER LEFT: LARGE TURBINE ARC & VERTICAL DANGER ALERTS
      // ======================================================================
      this.drawUpperLeftTurbineAndAlerts(ctx, W * 0.16, H * 0.28, this.rotationAngle);

      // ======================================================================
      // 7. LOWER LEFT: PIE CHART WHEEL & WIREFRAME CPU/RAM GRID
      // ======================================================================
      this.drawLowerLeftPieAndCpu(ctx, W * 0.20, H * 0.76);

      // ======================================================================
      // 8. UPPER RIGHT: AUTHENTIC RED TASKS & DIRECTIVES BOX
      // ======================================================================
      this.drawUpperRightTasksBox(ctx, W * 0.82, H * 0.22);

      // ======================================================================
      // 9. LOWER RIGHT: 3D PERSPECTIVE ROTATING CYAN TURBINE
      // ======================================================================
      this.drawLowerRight3DTurbine(ctx, W * 0.88, H * 0.76, this.rotationAngle);

      this.animLoopId = requestAnimationFrame(render);
    };

    render();
  }

  // --------------------------------------------------------------------------
  // 1. LEFT EYE: CONCENTRIC CALIBRATED RETICLE
  // --------------------------------------------------------------------------
  drawLeftEyeConcentric(ctx, x, y, angle, scale, tilt) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    ctx.scale(scale, scale);

    // Inner Solid Ring
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Dotted Middle Ring
    ctx.beginPath();
    ctx.arc(0, 0, 42, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0, 245, 212, 0.85)";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Rotating Outer Degree Bracket with Radial Ticks
    ctx.save();
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.arc(0, 0, 54, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // 12 Fine Radial Ticks
    for (let i = 0; i < 12; i++) {
      ctx.rotate(Math.PI / 6);
      ctx.beginPath();
      ctx.moveTo(48, 0);
      ctx.lineTo(54, 0);
      ctx.strokeStyle = i % 3 === 0 ? "#00f5d4" : "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = i % 3 === 0 ? 2 : 1;
      ctx.stroke();
    }
    ctx.restore();

    // Golden Crosshair Center Dot directly on the pupil
    ctx.beginPath();
    ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = "#ffbe0b";
    ctx.shadowColor = "#ffbe0b";
    ctx.shadowBlur = 8;
    ctx.fill();

    // Crosshair Lines
    ctx.beginPath();
    ctx.moveTo(-12, 0); ctx.lineTo(12, 0);
    ctx.moveTo(0, -12); ctx.lineTo(0, 12);
    ctx.strokeStyle = "rgba(255, 190, 11, 0.9)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Retinal Lock Subtext
    ctx.font = "9px 'Share Tech Mono', monospace";
    ctx.fillStyle = "rgba(0, 245, 212, 0.85)";
    ctx.fillText("TARGET: LOCKED", -40, 68);
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.fillText("042° // RETINA_L", -38, 78);

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // 2. RIGHT EYE: TRANSLUCENT BLUE OCULAR VISOR SHADE & SEGMENTED ARCS
  // --------------------------------------------------------------------------
  drawRightEyeVisorShade(ctx, x, y, angle, sweep, scale, tilt) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    ctx.scale(scale, scale);

    // Iconic Translucent Blue Sector Visor Shade (From tony-jarvis.png)
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 95, -Math.PI * 0.92, -Math.PI * 0.14);
    ctx.closePath();
    ctx.fillStyle = "rgba(0, 180, 230, 0.24)";
    ctx.fill();
    ctx.strokeStyle = "rgba(0, 229, 255, 0.75)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Inner White Ring
    ctx.beginPath();
    ctx.arc(0, 0, 34, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Thick Segmented Cyan Arc (Clockwise)
    ctx.save();
    ctx.rotate(angle * 1.2);
    ctx.beginPath();
    ctx.arc(0, 0, 48, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.strokeStyle = "#00e5ff";
    ctx.lineWidth = 5;
    ctx.stroke();

    // Segmented White Notches on Arc
    ctx.beginPath();
    ctx.arc(0, 0, 56, Math.PI * 0.6, Math.PI * 0.9);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // Outer Yellow Accent Arc (Counter-Clockwise)
    ctx.save();
    ctx.rotate(-angle * 0.8);
    ctx.beginPath();
    ctx.arc(0, 0, 64, -Math.PI * 0.2, Math.PI * 0.3);
    ctx.strokeStyle = "#ffbe0b";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // Sweeping Radar Line Across the Eye
    ctx.save();
    ctx.rotate(-Math.PI * 0.54 + sweep * 0.6);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(90, 0);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.restore();

    // Center Pupil Dot
    ctx.beginPath();
    ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = "#00f5d4";
    ctx.shadowColor = "#00f5d4";
    ctx.shadowBlur = 10;
    ctx.fill();

    // Coordinate Readouts
    ctx.font = "9px 'Share Tech Mono', monospace";
    ctx.fillStyle = "rgba(0, 229, 255, 0.9)";
    ctx.fillText("OCULAR SWEEP // 0.88", 15, -70);
    ctx.fillStyle = "#ffbe0b";
    ctx.fillText("FLUX 1.00 G", 35, -15);

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // 3. FOREHEAD & NOSE BRIDGE TELEMETRY
  // --------------------------------------------------------------------------
  drawForeheadAndBridge(ctx, forehead, bridge, scale, tilt) {
    // 1. Forehead Top
    ctx.save();
    ctx.translate(forehead.x, forehead.y - 45 * scale);
    ctx.rotate(tilt);
    ctx.scale(scale, scale);
    ctx.textAlign = "center";

    // News Header in Cyan
    ctx.font = "bold 13px 'Share Tech Mono', monospace";
    ctx.fillStyle = "#00e5ff";
    ctx.fillText("timesofindia", 0, -30);

    // Large Date
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    ctx.font = "11px 'Share Tech Mono', monospace";
    ctx.fillStyle = "rgba(0, 245, 212, 0.85)";
    ctx.fillText(`${months[now.getMonth()]}`, 0, -10);
    ctx.font = "bold 26px 'Orbitron', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${now.getDate()}`, 0, 16);
    ctx.restore();

    // 2. Center Nose Bridge
    ctx.save();
    ctx.translate(bridge.x, bridge.y);
    ctx.rotate(tilt);
    ctx.scale(scale, scale);
    ctx.textAlign = "center";

    // G-force badges
    ctx.font = "10px 'Share Tech Mono', monospace";
    ctx.fillStyle = "#00f5d4";
    ctx.textAlign = "left";
    ctx.fillText("49 G", -6, -26);
    ctx.fillText("28 G", -6, -10);

    // 100% AC Line
    ctx.textAlign = "center";
    ctx.font = "bold 11px 'Share Tech Mono', monospace";
    ctx.fillStyle = "#00f5d4";
    ctx.fillText("100%", 0, 22);
    ctx.font = "9px 'Share Tech Mono', monospace";
    ctx.fillStyle = "#00b4d8";
    ctx.fillText("AC Line", 0, 34);

    // Horizon Pitch Ladder
    ctx.strokeStyle = "rgba(0, 245, 212, 0.6)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-22, -45); ctx.lineTo(22, -45);
    ctx.moveTo(-15, 0); ctx.lineTo(15, 0);
    ctx.stroke();

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // 4. UNDER NOSE / CHIN: DIGITAL TIME & STATUS
  // --------------------------------------------------------------------------
  drawMouthAndChinTelemetry(ctx, mouth, micVol, scale, tilt) {
    ctx.save();
    ctx.translate(mouth.x, mouth.y + 40 * scale);
    ctx.rotate(tilt);
    ctx.scale(scale, scale);
    ctx.textAlign = "center";

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];

    // Digital Time in Glowing White
    ctx.font = "bold 22px 'Orbitron', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0, 245, 212, 0.8)";
    ctx.shadowBlur = 10;
    ctx.fillText(timeStr, 0, 0);
    ctx.shadowBlur = 0;

    // Day of week
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    ctx.font = "10px 'Share Tech Mono', monospace";
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillText(`${days[now.getDay()]}`, 0, 14);

    // Uptime & Subsystem status
    ctx.font = "10px 'Share Tech Mono', monospace";
    ctx.fillStyle = "#00f5d4";
    ctx.fillText(`0d 0h 5min   0 files(s)`, 0, 32);

    // Audio Voice Line below mouth
    const waveW = 75 + micVol * 1.5;
    ctx.beginPath();
    ctx.moveTo(-waveW / 2, 46);
    ctx.lineTo(waveW / 2, 46);
    ctx.strokeStyle = micVol > 15 ? "#ffbe0b" : "rgba(0, 245, 212, 0.6)";
    ctx.lineWidth = micVol > 15 ? 2.5 : 1.2;
    ctx.stroke();

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // 5. RIGHT CHEEK: CRIMSON CIRCULAR TARGET LOCK RING
  // --------------------------------------------------------------------------
  drawRightCheekTargetLock(ctx, cheek, angle, scale, tilt) {
    ctx.save();
    ctx.translate(cheek.x, cheek.y);
    ctx.rotate(tilt);
    ctx.scale(scale, scale);

    // Double Red Ring
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.strokeStyle = "#ff2a4b";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 42, 75, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Center Red Target Dot
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#ff2a4b";
    ctx.shadowColor = "#ff2a4b";
    ctx.shadowBlur = 8;
    ctx.fill();

    // Rotating Gap Arc
    ctx.save();
    ctx.rotate(angle * 2);
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 0.8);
    ctx.strokeStyle = "#ffbe0b";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // 6. UPPER LEFT: LARGE TURBINE ARC & VERTICAL DANGER ALERTS
  // --------------------------------------------------------------------------
  drawUpperLeftTurbineAndAlerts(ctx, x, y, angle) {
    ctx.save();
    ctx.translate(x, y);

    // Large Rotating Serrated Turbine Ring
    ctx.save();
    ctx.rotate(angle * 0.5);
    ctx.beginPath();
    ctx.arc(0, 0, 95, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
    ctx.lineWidth = 2;
    ctx.stroke();

    for (let i = 0; i < 48; i++) {
      ctx.rotate(Math.PI / 24);
      ctx.beginPath();
      ctx.moveTo(85, 0);
      ctx.lineTo(95, 0);
      ctx.strokeStyle = i % 4 === 0 ? "#00f5d4" : "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = i % 4 === 0 ? 3 : 1.2;
      ctx.stroke();
    }
    ctx.restore();

    ctx.beginPath();
    ctx.arc(0, 0, 72, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0, 245, 212, 0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Crimson Warning Banner
    ctx.save();
    ctx.translate(20, 20);
    ctx.fillStyle = "rgba(255, 42, 75, 0.18)";
    ctx.strokeStyle = "#ff2a4b";
    ctx.lineWidth = 1.5;
    ctx.fillRect(0, 0, 130, 48);
    ctx.strokeRect(0, 0, 130, 48);

    ctx.font = "bold 13px 'Orbitron', sans-serif";
    ctx.fillStyle = "#ff2a4b";
    ctx.shadowColor = "#ff2a4b";
    ctx.shadowBlur = 8;
    ctx.fillText("VERTICAL", 12, 22);

    ctx.font = "12px sans-serif";
    ctx.fillText("▲ ▲ ▲", 14, 38);

    ctx.font = "9px 'Share Tech Mono', monospace";
    ctx.fillStyle = "#00f5d4";
    ctx.shadowBlur = 0;
    ctx.fillText("CRITICAL // PROPULSION", 4, 68);
    ctx.fillText("CORE STABILITY: NOMINAL", 4, 80);
    ctx.restore();

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // 7. LOWER LEFT: PIE CHART WHEEL & WIREFRAME CPU/RAM GRID
  // --------------------------------------------------------------------------
  drawLowerLeftPieAndCpu(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Pie Chart Wheel
    ctx.beginPath();
    ctx.arc(0, 0, 50, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(20, 25, 35, 0.85)";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 50, -Math.PI * 0.5, 0);
    ctx.closePath();
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(10, 15, 22, 0.9)";
    ctx.fill();
    ctx.strokeStyle = "rgba(0, 245, 212, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Scale
    ctx.font = "8px 'Share Tech Mono', monospace";
    ctx.fillStyle = "#ff9100";
    ctx.textAlign = "right";
    const scales = ['100', '80', '60', '40', '20'];
    scales.forEach((s, idx) => {
      ctx.fillText(s, -60, -28 + idx * 14);
      ctx.fillRect(-56, -30 + idx * 14, 4, 1);
    });

    // Wireframe CPU / RAM Box
    ctx.save();
    ctx.translate(62, -45);
    ctx.strokeStyle = "rgba(0, 245, 212, 0.7)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, 95, 62);

    ctx.textAlign = "left";
    ctx.font = "9px 'Share Tech Mono', monospace";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText("CPU", 6, 16);
    ctx.font = "bold 14px 'Orbitron', sans-serif";
    ctx.fillStyle = "#00f5d4";
    ctx.fillText(`${this.telemetry.cpu}%`, 36, 17);

    ctx.font = "9px 'Share Tech Mono', monospace";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText("RAM", 6, 36);
    ctx.font = "bold 14px 'Orbitron', sans-serif";
    ctx.fillStyle = "#ffbe0b";
    ctx.fillText(`${this.telemetry.ram}%`, 36, 37);

    ctx.font = "8px 'Share Tech Mono', monospace";
    ctx.fillStyle = "rgba(0, 245, 212, 0.85)";
    ctx.fillText(`BATTERY: ${this.telemetry.battery}`, 6, 54);
    ctx.restore();

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // 8. UPPER RIGHT: AUTHENTIC RED TASKS & DIRECTIVES BOX
  // --------------------------------------------------------------------------
  drawUpperRightTasksBox(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    const boxW = 185;
    const boxH = 120;

    ctx.strokeStyle = "rgba(255, 42, 75, 0.85)";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(0, 0, boxW, boxH);

    ctx.font = "11px monospace";
    ctx.fillStyle = "#ff2a4b";
    ctx.fillText("+", -4, 0);
    ctx.fillText("+", boxW - 6, 0);
    ctx.fillText("+", -4, boxH + 6);
    ctx.fillText("+", boxW - 6, boxH + 6);

    ctx.font = "bold 11px 'Share Tech Mono', monospace";
    ctx.fillStyle = "#ff2a4b";
    ctx.fillText("Tasks", 12, 18);

    ctx.font = "9px 'Share Tech Mono', monospace";
    ctx.fillStyle = "rgba(255, 100, 120, 0.9)";
    ctx.fillText("Meet Mr.Jones for a", 12, 36);
    ctx.fillText("confidential meeting at", 12, 48);
    ctx.fillText("Malibu !!!", 12, 60);

    ctx.fillStyle = "rgba(255, 150, 160, 0.9)";
    ctx.fillText("Meet Pepper at 3:00 pm", 12, 78);

    ctx.font = "bold 10px 'Share Tech Mono', monospace";
    ctx.fillStyle = "#ff2a4b";
    ctx.fillText("- Jarvis", 12, 98);

    ctx.beginPath();
    ctx.arc(68, 95, 4, 0, Math.PI * 2);
    ctx.strokeStyle = "#00f5d4";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.strokeStyle = "rgba(0, 245, 212, 0.6)";
    ctx.strokeRect(0, boxH + 8, boxW, 24);
    ctx.font = "8px 'Share Tech Mono', monospace";
    ctx.fillStyle = "#00f5d4";
    ctx.fillText("\\\\\\ DIAGNOSTIC FEED // ACTIVE", 10, boxH + 22);

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // 9. LOWER RIGHT: 3D PERSPECTIVE ROTATING CYAN TURBINE
  // --------------------------------------------------------------------------
  drawLowerRight3DTurbine(ctx, x, y, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.transform(1, 0, -0.32, 0.65, 0, 0);

    ctx.beginPath();
    ctx.arc(0, 0, 75, 0, Math.PI * 2);
    ctx.strokeStyle = "#00f5d4";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#00f5d4";
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.save();
    ctx.rotate(angle * 0.9);
    for (let i = 0; i < 16; i++) {
      ctx.rotate(Math.PI / 8);
      ctx.beginPath();
      ctx.moveTo(32, 0);
      ctx.lineTo(70, 0);
      ctx.strokeStyle = i % 2 === 0 ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 229, 255, 0.7)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();

    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 245, 212, 0.25)";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }
}

// Global instance
const starkCockpitHud = new StarkCockpitHudController();



// ==========================================
// 8. Holographic Active Tasks Workspace Controller
//    Real-time Windows taskbar apps with interactive management
// ==========================================

// ==========================================
// 8. Holographic Active Tasks Workspace Controller
//    Real-time Windows taskbar apps with interactive management
// ==========================================
class HolographicWorkspaceController {
  constructor() {
    this.isOpen = false;
    this.realWindows = [];
  }

  init() {
    const exitBtn = document.getElementById('closeHoloWorkspace');
    if (exitBtn) {
      exitBtn.addEventListener('click', () => this.closeWorkspace());
    }
  }

  async openWorkspace() {
    this.init();
    const overlay = document.getElementById('holographicWorkspace');
    if (!overlay) return;

    overlay.classList.remove('hidden');
    this.isOpen = true;
    sfx.playScan();
    jarvisVoice.speak("Holographic active tasks workspace deployed, boss. Loading active Windows processes.");

    const directiveEl = document.getElementById('footDirective');
    if (directiveEl) directiveEl.textContent = "HOLOGRAPHIC WORKSPACE: SCANNING REAL WINDOWS TASKS...";

    // Load REAL active Windows apps from backend
    await this.fetchRealOpenWindows();
  }

  async fetchRealOpenWindows() {
    const statusEl = document.getElementById('holoGestureStatus');
    try {
      const res = await fetch('/api/open_windows');
      const data = await res.json();
      if (data.status === 'success' && data.windows && data.windows.length > 0) {
        this.realWindows = data.windows;
        if (statusEl) statusEl.textContent = `ONLINE: ${this.realWindows.length} ACTIVE WINDOWS // CLICK TO MANAGE`;
      } else {
        // Fallback to active system tasks if none returned
        this.realWindows = [
          { name: "msedge.exe", title: "Microsoft Edge - Active Tabs", type: "EDGE BROWSER", icon: "🌍", pid: "" },
          { name: "chrome.exe", title: "Google Chrome - Web Window", type: "CHROME BROWSER", icon: "🌐", pid: "" },
          { name: "whatsapp.exe", title: "WhatsApp Desktop App", type: "WHATSAPP APP", icon: "💬", pid: "" },
          { name: "explorer.exe", title: "File Explorer - Recent Files", type: "FILE EXPLORER", icon: "📁", pid: "" }
        ];
      }
    } catch (err) {
      console.warn("Error fetching real windows:", err);
      this.realWindows = [
        { name: "msedge.exe", title: "Microsoft Edge", type: "EDGE BROWSER", icon: "🌍", pid: "" },
        { name: "chrome.exe", title: "Google Chrome", type: "CHROME BROWSER", icon: "🌐", pid: "" },
        { name: "explorer.exe", title: "File Explorer", type: "FILE EXPLORER", icon: "📁", pid: "" }
      ];
    }
    this.renderCards();
  }

  closeWorkspace() {
    const overlay = document.getElementById('holographicWorkspace');
    if (overlay) overlay.classList.add('hidden');
    this.isOpen = false;

    sfx.playChirp();
    jarvisVoice.speak("Returning to main cockpit.");
  }

  renderCards() {
    const stage = document.getElementById('holoCardsDeck');
    if (!stage) return;
    stage.innerHTML = '';

    this.realWindows.forEach((win, idx) => {
      const card = document.createElement('div');
      card.className = 'holo-file-card';
      card.dataset.index = idx;
      card.innerHTML = `
        <div class="holo-card-corner-tr"></div>
        <div class="holo-card-corner-bl"></div>
        
        <div class="holo-card-header">
          <div class="holo-card-icon">${win.icon || '🪟'}</div>
          <div class="holo-card-meta">
            <div class="holo-file-type">${win.type || 'TASK'}</div>
            <div class="holo-file-name" title="${win.title}">${win.title}</div>
          </div>
        </div>

        <div class="holo-card-preview">
          <pre>PROCESS: ${win.name}\nPID: ${win.pid || 'ACTIVE'}\nMEM: ${win.memory || 'OPTIMAL'}\nSTATUS: RUNNING IN WINDOWS</pre>
        </div>

        <div class="holo-card-footer">
          <span>PID: ${win.pid || 'SYS'}</span>
          <span class="holo-card-badge" style="cursor:pointer; background:rgba(255,50,50,0.25); border:1px solid #ff4444; color:#ff9999;">✕ CLOSE TASK</span>
        </div>
      `;

      // Click to dismiss/close task
      card.addEventListener('click', () => {
        this.dismissCard(card, idx);
      });

      stage.appendChild(card);
    });
  }

  dismissCard(card, idx) {
    sfx.playWhoosh();
    card.classList.add('card-thrown-up');
    const win = this.realWindows[idx] || {};
    const winTitle = win.title || win.name || "Window";

    const statusEl = document.getElementById('holoGestureStatus');
    if (statusEl) statusEl.textContent = `DISMISSED: [${winTitle.toUpperCase()}]`;

    jarvisVoice.speak(`Dismissing ${winTitle}, boss.`);

    // Send real close command to Windows backend!
    if (win.pid) {
      fetch(`/api/close_window_by_pid?pid=${encodeURIComponent(win.pid)}`).catch(() => {});
    } else if (win.name) {
      fetch(`/api/close_window_by_pid?name=${encodeURIComponent(win.name)}`).catch(() => {});
    }

    setTimeout(() => {
      card.remove();
      if (document.querySelectorAll('.holo-file-card').length === 0) {
        if (statusEl) statusEl.textContent = "ALL ACTIVE WINDOWS DISMISSED // SCANNING...";
        setTimeout(() => this.fetchRealOpenWindows(), 1500);
      }
    }, 450);
  }
}

const holographicWorkspace = new HolographicWorkspaceController();

// ==========================================
// 8.1 Arc Reactor Voice-Reactive Audio Visualizer
// ==========================================
class ArcReactorAudioVisualizer {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.analyser = null;
    this.audioCtx = null;
    this.dataArray = null;
    this.animId = null;
    this.currentEnergy = 0;
    this.wrapper = null;
    this.fluxEl = null;
    this.hasMicStream = false;
    this.pulsePhase = 0;
  }

  init() {
    this.canvas = document.getElementById('arcAudioCanvas');
    this.wrapper = document.getElementById('arcPrimeWrapper');
    this.fluxEl = document.getElementById('coreFluxText');
    if (!this.canvas || !this.wrapper) return;

    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.setupAudioAnalyser();
    this.startLoop();
  }

  resizeCanvas() {
    if (!this.canvas || !this.wrapper) return;
    const rect = this.wrapper.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    if (this.ctx) {
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  async setupAudioAnalyser() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.audioCtx = new AudioCtx();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.8;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          const source = this.audioCtx.createMediaStreamSource(stream);
          source.connect(this.analyser);
          this.hasMicStream = true;
        } catch (err) {
          // Mic stream not directly bound; fallback to speech state synthesis
        }
      }
    } catch (e) {
      console.warn("Visualizer audio setup notice:", e);
    }
  }

  startLoop() {
    const draw = () => {
      this.animId = requestAnimationFrame(draw);
      this.render();
    };
    this.animId = requestAnimationFrame(draw);
  }

  render() {
    if (!this.canvas || !this.ctx || !this.wrapper) return;
    const rect = this.wrapper.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    if (width === 0 || height === 0) return;

    this.ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const mediaBox = this.wrapper.querySelector('.arc-media-box');
    let innerRadius = Math.min(width, height) * 0.28;
    if (mediaBox) {
      const mbRect = mediaBox.getBoundingClientRect();
      innerRadius = Math.min(mbRect.width, mbRect.height) / 2 + 4;
    }

    const isBossSpeaking = document.body.classList.contains('user-speaking');
    const isJarvisSpeaking = jarvisVoice && jarvisVoice.isSpeaking;

    let targetEnergy = 0;
    this.pulsePhase += 0.08;

    if (this.hasMicStream && this.analyser) {
      this.analyser.getByteFrequencyData(this.dataArray);
      let sum = 0;
      for (let i = 0; i < this.dataArray.length; i++) {
        sum += this.dataArray[i];
      }
      const avg = sum / this.dataArray.length;
      targetEnergy = Math.min(1.0, (avg / 128) * 1.5);
    }

    // Dynamic wave pulse on speaking states
    if (isJarvisSpeaking) {
      const jarvisPulse = Math.sin(this.pulsePhase * 2.2) * 0.35 + Math.sin(this.pulsePhase * 4.5) * 0.2 + 0.55;
      targetEnergy = Math.max(targetEnergy, jarvisPulse);
    } else if (isBossSpeaking) {
      const bossPulse = Math.sin(this.pulsePhase * 1.8) * 0.3 + 0.55;
      targetEnergy = Math.max(targetEnergy, bossPulse);
    } else {
      const idleBreathing = Math.sin(this.pulsePhase * 0.5) * 0.06 + 0.06;
      targetEnergy = Math.max(targetEnergy, idleBreathing);
    }

    this.currentEnergy += (targetEnergy - this.currentEnergy) * 0.16;
    const energy = this.currentEnergy;

    // Apply CSS variables and state classes
    this.wrapper.style.setProperty('--voice-energy', energy.toFixed(3));
    this.wrapper.classList.toggle('voice-active', energy > 0.18);
    this.wrapper.classList.toggle('jarvis-speaking', isJarvisSpeaking);

    // Update real-time core flux readout
    if (this.fluxEl) {
      const baseFlux = 3.82;
      const liveFlux = (baseFlux + energy * 1.55).toFixed(2);
      this.fluxEl.textContent = liveFlux;
    }

    // Render 360-Degree Radial Equalizer Pins
    const totalBars = 60;
    const angleStep = (Math.PI * 2) / totalBars;
    const maxBarLength = Math.min(width, height) * 0.18;

    const isGoldTheme = document.body.classList.contains('theme-gold');
    const primaryHue = isGoldTheme ? '42, 95%, 55%' : '182, 100%, 50%';
    const accentHue = isGoldTheme ? '35, 100%, 65%' : '165, 100%, 50%';

    for (let i = 0; i < totalBars; i++) {
      const angle = i * angleStep;

      let val = 0;
      if (this.dataArray && this.dataArray.length > 0) {
        val = this.dataArray[i % this.dataArray.length] / 255;
      }
      const wave = Math.sin(angle * 4 + this.pulsePhase) * 0.3 + Math.cos(angle * 2 - this.pulsePhase * 1.5) * 0.2;
      const combinedVal = Math.max(0.05, (val * 0.6 + energy * 0.7 + wave * energy * 0.4));
      const barLength = Math.max(4, combinedVal * maxBarLength);

      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      const startX = centerX + cos * innerRadius;
      const startY = centerY + sin * innerRadius;
      const endX = centerX + cos * (innerRadius + barLength);
      const endY = centerY + sin * (innerRadius + barLength);

      const alpha = 0.35 + energy * 0.65;
      this.ctx.strokeStyle = `hsla(${isJarvisSpeaking ? accentHue : primaryHue}, ${alpha})`;
      this.ctx.lineWidth = 1.8;
      this.ctx.lineCap = 'round';

      this.ctx.beginPath();
      this.ctx.moveTo(startX, startY);
      this.ctx.lineTo(endX, endY);
      this.ctx.stroke();

      if (barLength > 7) {
        const dotX = centerX + cos * (innerRadius + barLength + 2.5);
        const dotY = centerY + sin * (innerRadius + barLength + 2.5);
        this.ctx.fillStyle = isGoldTheme ? '#ffe066' : '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(dotX, dotY, 1.4, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }
}

const arcReactorVisualizer = new ArcReactorAudioVisualizer();

// =========================================================================
// TONY STARK AR HOLOGRAPHIC HAND-TRACKING WORKSPACE CONTROLLER
// Direct implementation of the reference photo interface:
// - Live mirrored video feed
// - Left HUD: J.A.R.V.I.S. Arc-Reactor Ring & Orbiting Tree Nodes (Guide, Props, Tasks)
// - Right HUD: 3D Floating Glassmorphic Holographic Cards (Props, Guide, Tasks)
// - MediaPipe Multi-Hand Landmark Tracking (21 landmarks)
// - Mid-air Pinch-to-Drag, Hold-Still 3D Rotate, Two-Hand Scale, Air-Tap, Clap
// - Mouse/Touch fallback for instant desktop usability
// - Stark Telemetry bar & Hotkeys (R: Respawn, C: Cam, D: Debug, ESC: Exit)
// =========================================================================
class ArHoloWorkspaceController {
  constructor() {
    this.isOpen = false;
    this.stream = null;
    this.hands = null;
    this.isDetecting = false;
    this.debugMode = false;
    this.cameraActive = true;
    this.lastLandmarks = [];
    this.grabbedCard = null;
    this.dragOffset = { x: 0, y: 0 };
    this.grabStartTime = 0;
    this.is3DRotating = false;
    this.twoHandStartDist = 0;
    this.twoHandStartScale = 1;
    this.orbsVisible = true;
    this.realWindows = [];
    this.animId = null;
    this.detectLoopId = null;
    this.activePinch = null;
    this.victoryTimer = null;
    this.repulsorCooldown = 0;
    this.lastTapTime = 0;
    this.shockwaves = [];
    this.bannerResetTimer = null;
    this.prevIndexTip = null;

    // Card transform states (id -> { x, y, rotX, rotY, scale })
    this.cardStates = {
      props: { x: 60, y: 20, rotX: 4, rotY: -8, scale: 1 },
      guide: { x: 36, y: 38, rotX: -2, rotY: 6, scale: 1 },
      tasks: { x: 55, y: 30, rotX: 0, rotY: -4, scale: 1 }
    };
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    // Open/Close triggers
    const triggerBtn = document.getElementById('arHoloBtn');
    if (triggerBtn) {
      triggerBtn.addEventListener('click', () => this.open());
    }

    const closeBtn = document.getElementById('closeArHoloBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Header buttons
    const resetBtn = document.getElementById('arResetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetLayout());
    }

    const camBtn = document.getElementById('arToggleCameraBtn');
    if (camBtn) {
      camBtn.addEventListener('click', () => this.toggleCamera());
    }

    const debugBtn = document.getElementById('arToggleDebugBtn');
    if (debugBtn) {
      debugBtn.addEventListener('click', () => this.toggleDebug());
    }

    // Arc Reactor Ring tap -> toggle orbs
    const ring = document.getElementById('arReactorRing');
    if (ring) {
      ring.addEventListener('click', () => this.toggleOrbs());
    }

    // Orbiting nodes tap -> toggle cards
    const orbGuide = document.getElementById('arOrbGuide');
    if (orbGuide) {
      orbGuide.addEventListener('click', () => this.toggleCard('guide'));
    }

    const orbProps = document.getElementById('arOrbProps');
    if (orbProps) {
      orbProps.addEventListener('click', () => this.toggleCard('props'));
    }

    const orbTasks = document.getElementById('arOrbTasks');
    if (orbTasks) {
      orbTasks.addEventListener('click', () => this.toggleCard('tasks'));
    }

    // Card interactive events (tree items and close buttons)
    this.bindCardEvents();

    // Mouse & Touch fallback manipulation on cards
    this.bindMouseFallback();

    // Global keyboard shortcuts (R, C, D, Escape)
    window.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape') {
        this.close();
      } else if (e.code === 'KeyR' && !e.ctrlKey && !e.altKey) {
        this.resetLayout();
      } else if (e.code === 'KeyC' && !e.ctrlKey && !e.altKey) {
        this.toggleCamera();
      } else if (e.code === 'KeyD' && !e.ctrlKey && !e.altKey) {
        this.toggleDebug();
      }
    });

    // Window resize
    window.addEventListener('resize', () => {
      if (this.isOpen) this.resizeCanvas();
    });
  }

  bindCardEvents() {
    document.querySelectorAll('.ar-glass-card .ar-card-close-btn, .ar-glass-card .ar-card-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = btn.closest('.ar-glass-card');
        if (card) {
          sfx.playWhoosh();
          card.style.display = 'none';
        }
      });
    });

    document.querySelectorAll('.ar-glass-card .ar-card-max-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = btn.closest('.ar-glass-card');
        if (card) this.maximizeCard(card);
      });
    });

    document.querySelectorAll('.ar-glass-card .ar-card-min-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = btn.closest('.ar-glass-card');
        if (card) this.minimizeCard(card);
      });
    });

    // Expand/collapse tree items in cards
    document.querySelectorAll('.ar-glass-card .ar-tree-item.branch').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        item.classList.toggle('open');
        sfx.playChirp();
      });
    });
  }

  maximizeCard(card) {
    if (!card) return;
    card.classList.remove('minimized');
    const isMax = card.classList.toggle('maximized');
    sfx.playPowerUp();
    const stat = card.querySelector('.ar-card-stat');
    if (stat) stat.textContent = isMax ? "MAXIMIZED // PANORAMIC" : "STANDARD 3D";
    jarvisVoice.speak(isMax ? "Maximizing holographic window to widescreen." : "Restoring standard perspective.");
  }

  minimizeCard(card) {
    if (!card) return;
    card.classList.remove('maximized');
    const isMin = card.classList.toggle('minimized');
    sfx.playChirp();
    const stat = card.querySelector('.ar-card-stat');
    if (stat) stat.textContent = isMin ? "MINIMIZED TILE" : "STANDARD 3D";
    jarvisVoice.speak(isMin ? "Minimizing to floating widget." : "Restoring standard perspective.");
  }

  bindMouseFallback() {
    const stage = document.getElementById('arCardsStage');
    if (!stage) return;

    let isMouseDown = false;
    let activeCard = null;
    let startMouseX = 0, startMouseY = 0;
    let startCardX = 0, startCardY = 0;
    let isRightClick = false;
    let holdTimer = null;

    stage.addEventListener('mousedown', (e) => {
      const card = e.target.closest('.ar-glass-card');
      if (!card || e.target.classList.contains('ar-card-ctrl-btn') || e.target.classList.contains('ar-card-close')) return;
      
      activeCard = card;
      isMouseDown = true;
      isRightClick = (e.button === 2);
      startMouseX = e.clientX;
      startMouseY = e.clientY;
      startCardX = card.offsetLeft;
      startCardY = card.offsetTop;
      card.classList.add('pinched');
      sfx.playScan();

      // Show pinch reticle at mouse
      this.showReticle(e.clientX, e.clientY, "DESK LOCK", true);

      // Hold still check for 3D rotate
      holdTimer = setTimeout(() => {
        if (isMouseDown && activeCard) {
          const stat = activeCard.querySelector('.ar-card-stat');
          if (stat) stat.textContent = "3D ROTATION ACTIVE";
        }
      }, 800);
    });

    window.addEventListener('mousemove', (e) => {
      if (!isMouseDown || !activeCard) return;
      this.showReticle(e.clientX, e.clientY, "DESK LOCK", true);

      const deltaX = e.clientX - startMouseX;
      const deltaY = e.clientY - startMouseY;

      const cardId = activeCard.dataset.cardId || 'props';
      const state = this.cardStates[cardId] || { x: 50, y: 30, rotX: 0, rotY: 0, scale: 1 };

      if (isRightClick) {
        // Rotate in 3D
        state.rotY += deltaX * 0.15;
        state.rotX -= deltaY * 0.15;
        this.applyCardTransform(activeCard, state);
        startMouseX = e.clientX;
        startMouseY = e.clientY;
      } else {
        // Move in 2D
        activeCard.style.left = (startCardX + deltaX) + 'px';
        activeCard.style.top = (startCardY + deltaY) + 'px';
        const stat = activeCard.querySelector('.ar-card-stat');
        if (stat) stat.textContent = `3D POS: X:${Math.round((startCardX + deltaX)/window.innerWidth*100)}% Y:${Math.round((startCardY + deltaY)/window.innerHeight*100)}%`;
      }
    });

    window.addEventListener('mouseup', () => {
      if (isMouseDown && activeCard) {
        activeCard.classList.remove('pinched');
        this.hideReticle();
        clearTimeout(holdTimer);
        const stat = activeCard.querySelector('.ar-card-stat');
        if (stat) stat.textContent = "HOLD STILL = 3D ROTATE";
      }
      isMouseDown = false;
      activeCard = null;
    });

    // Mouse wheel scale
    stage.addEventListener('wheel', (e) => {
      const card = e.target.closest('.ar-glass-card');
      if (!card) return;
      e.preventDefault();
      const cardId = card.dataset.cardId || 'props';
      const state = this.cardStates[cardId] || { x: 50, y: 30, rotX: 0, rotY: 0, scale: 1 };
      state.scale += (e.deltaY < 0 ? 0.05 : -0.05);
      state.scale = Math.max(0.6, Math.min(2.2, state.scale));
      this.applyCardTransform(card, state);
    }, { passive: false });

    // Prevent context menu on right click inside workspace
    const overlay = document.getElementById('arHoloWorkspace');
    if (overlay) {
      overlay.addEventListener('contextmenu', (e) => {
        if (this.isOpen) e.preventDefault();
      });
    }
  }

  async open() {
    if (!this.initialized) this.init();
    const overlay = document.getElementById('arHoloWorkspace');
    if (!overlay) return;

    overlay.classList.remove('hidden');
    this.isOpen = true;
    sfx.playScan();
    jarvisVoice.speak("Augmented Reality Holographic Workspace deployed, boss. Engaging optical telemetry and hand tracking.");

    const directiveEl = document.getElementById('footDirective');
    if (directiveEl) directiveEl.textContent = "AR HOLOGRAPHIC WORKSPACE: LIVE OPTICAL TELEMETRY ACTIVE";

    this.resizeCanvas();
    this.initMediaPipeHands();
    await this.startCamera();
    this.fetchActiveTasks();
    this.startRenderLoop();
  }

  close() {
    const overlay = document.getElementById('arHoloWorkspace');
    if (overlay) overlay.classList.add('hidden');
    this.isOpen = false;

    // Stop camera
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    const video = document.getElementById('arHoloVideo');
    if (video) video.srcObject = null;

    if (this.detectLoopId) {
      cancelAnimationFrame(this.detectLoopId);
      this.detectLoopId = null;
    }
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }

    this.hideReticle();
    sfx.playChirp();
    jarvisVoice.speak("Disengaging holographic AR workspace.");

    const directiveEl = document.getElementById('footDirective');
    if (directiveEl) directiveEl.textContent = "SYSTEM STANDBY // READY FOR DIRECTIVES";
  }

  async startCamera() {
    const video = document.getElementById('arHoloVideo');
    if (!video) return;

    try {
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
      }
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      video.srcObject = this.stream;
      await video.play();
      this.cameraActive = true;
      const badge = document.getElementById('arHandCountBadge');
      if (badge) badge.textContent = "OPTICAL CAMERA ACTIVE // SCANNING HANDS";
    } catch (err) {
      console.warn("[ArHolo] Camera access error:", err);
      this.cameraActive = false;
      const badge = document.getElementById('arHandCountBadge');
      if (badge) badge.textContent = "DESK MODE (CAMERA UNAVAILABLE / MOUSE ENABLED)";
    }
  }

  toggleCamera() {
    const video = document.getElementById('arHoloVideo');
    if (!video) return;
    this.cameraActive = !this.cameraActive;
    video.style.opacity = this.cameraActive ? '1' : '0.15';
    sfx.playChirp();
  }

  toggleDebug() {
    this.debugMode = !this.debugMode;
    sfx.playChirp();
    const btn = document.getElementById('arToggleDebugBtn');
    if (btn) {
      btn.style.borderColor = this.debugMode ? '#39ff14' : 'rgba(0, 245, 212, 0.4)';
      btn.style.color = this.debugMode ? '#39ff14' : 'var(--cyan-bright)';
    }
  }

  resetLayout() {
    sfx.playWhoosh();
    this.cardStates = {
      props: { x: 60, y: 20, rotX: 4, rotY: -8, scale: 1 },
      guide: { x: 36, y: 38, rotX: -2, rotY: 6, scale: 1 },
      tasks: { x: 55, y: 30, rotX: 0, rotY: -4, scale: 1 }
    };

    const cardProps = document.getElementById('arCardProps');
    if (cardProps) {
      cardProps.style.display = 'flex';
      cardProps.classList.remove('maximized', 'minimized');
      cardProps.style.left = '60%';
      cardProps.style.top = '20%';
      this.applyCardTransform(cardProps, this.cardStates.props);
    }

    const cardGuide = document.getElementById('arCardGuide');
    if (cardGuide) {
      cardGuide.style.display = 'flex';
      cardGuide.classList.remove('maximized', 'minimized');
      cardGuide.style.left = '36%';
      cardGuide.style.top = '38%';
      this.applyCardTransform(cardGuide, this.cardStates.guide);
    }

    const cardTasks = document.getElementById('arCardTasks');
    if (cardTasks) {
      cardTasks.style.display = 'flex';
      cardTasks.classList.remove('maximized', 'minimized');
      cardTasks.style.left = '55%';
      cardTasks.style.top = '30%';
      this.applyCardTransform(cardTasks, this.cardStates.tasks);
    }

    const ring = document.getElementById('arReactorRing');
    if (ring) {
      ring.style.transform = 'none';
    }

    this.orbsVisible = true;
    const orbs = document.getElementById('arOrbsTree');
    if (orbs) orbs.style.display = 'flex';

    jarvisVoice.speak("Holographic nodes and perspective cards reset to nominal coordinates.");
  }

  toggleOrbs() {
    this.orbsVisible = !this.orbsVisible;
    sfx.playScan();
    const orbs = document.getElementById('arOrbsTree');
    if (orbs) {
      orbs.style.display = this.orbsVisible ? 'flex' : 'none';
    }
  }

  toggleCard(type) {
    sfx.playScan();
    let card = null;
    if (type === 'props') card = document.getElementById('arCardProps');
    else if (type === 'guide') card = document.getElementById('arCardGuide');
    else if (type === 'tasks') {
      card = document.getElementById('arCardTasks');
      if (!card) this.spawnTasksCard();
      card = document.getElementById('arCardTasks');
    }

    if (card) {
      const isHidden = (card.style.display === 'none');
      card.style.display = isHidden ? 'flex' : 'none';
      if (isHidden) {
        const orb = document.querySelector(`.ar-orb-node[data-target="${type}"]`);
        if (orb) orb.classList.add('active');
      } else {
        const orb = document.querySelector(`.ar-orb-node[data-target="${type}"]`);
        if (orb) orb.classList.remove('active');
      }
    }
  }

  async fetchActiveTasks() {
    try {
      const res = await fetch('/api/open_windows');
      const data = await res.json();
      if (data.status === 'success' && data.windows) {
        this.realWindows = data.windows;
        const meta = document.getElementById('arTasksMeta');
        if (meta) meta.textContent = `${this.realWindows.length} active apps`;
      }
    } catch (_) {
      this.realWindows = [
        { name: "msedge.exe", title: "Edge Browser" },
        { name: "chrome.exe", title: "Chrome Browser" },
        { name: "explorer.exe", title: "File Explorer" }
      ];
    }
  }

  spawnTasksCard() {
    const stage = document.getElementById('arCardsStage');
    if (!stage) return;

    const card = document.createElement('div');
    card.className = 'ar-glass-card';
    card.id = 'arCardTasks';
    card.dataset.cardId = 'tasks';
    card.style.left = '55%';
    card.style.top = '30%';
    card.style.transform = 'perspective(1200px) rotateY(-4deg) rotateX(0deg) scale(1)';

    let itemsHtml = '';
    this.realWindows.slice(0, 4).forEach(win => {
      itemsHtml += `
        <div class="ar-tree-item leaf" title="Click to switch/close">
          <span>🪟 ${win.title || win.name}</span>
        </div>
      `;
    });

    card.innerHTML = `
      <div class="ar-card-glass-glow"></div>
      <div class="ar-card-border"></div>
      <div class="ar-card-pinch-handle" title="Pinch here in air to drag card">
        <span class="ar-pinch-anchor-dot"></span>
      </div>
      <div class="ar-card-header">
        <span class="ar-card-title">ACTIVE TASKS</span>
        <div class="ar-card-controls">
          <button class="ar-card-ctrl-btn ar-card-max-btn" title="Maximize Card">🗖</button>
          <button class="ar-card-ctrl-btn ar-card-min-btn" title="Minimize Card">🗕</button>
          <button class="ar-card-ctrl-btn ar-card-close-btn" title="Close Card">✕</button>
        </div>
      </div>
      <div class="ar-card-tree-body">
        ${itemsHtml || '<div class="ar-tree-item"><span>No active windows</span></div>'}
      </div>
      <div class="ar-card-footer">
        <span class="ar-card-stat">WINDOWS PROCESSES</span>
        <span class="ar-card-scale-hint">2 HANDS = RESIZE</span>
      </div>
    `;

    stage.appendChild(card);
    this.bindCardEvents();
  }

  initMediaPipeHands() {
    if (typeof Hands === 'undefined') {
      console.warn("[ArHolo] MediaPipe Hands script not found, using calibrated desk mode.");
      return;
    }
    if (this.hands) return;

    try {
      this.hands = new Hands({
        locateFile: (file) => {
          const cleanFile = file.split('/').pop();
          return `vendor/${cleanFile}`;
        }
      });

      this.hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 0, // Lite model: ultra fast ~15ms inference, zero lag!
        minDetectionConfidence: 0.50, // Standard reliable detection in any room lighting
        minTrackingConfidence: 0.50
      });

      this.hands.onResults((results) => this.onHandResults(results));

      let isDetecting = false;
      let lastFrameTime = -1;
      this.lastResultTimestamp = Date.now();

      const detectNext = async () => {
        if (!this.isOpen) return;

        // Auto-clear frozen/stale landmarks only if hand left view for > 1.2 seconds
        if (Date.now() - this.lastResultTimestamp > 1200 && this.lastLandmarks.length > 0) {
          this.lastLandmarks = [];
          this.hideReticle();
          const badge = document.getElementById('arHandCountBadge');
          if (badge) badge.textContent = "SCANNING FOR HANDS...";
        }

        const video = document.getElementById('arHoloVideo');
        if (video && !video.paused && video.readyState >= 2 && video.videoWidth > 0 && this.hands && !isDetecting) {
          isDetecting = true;
          try {
            await this.hands.send({ image: video });
          } catch (errSend) {
            console.warn("[ArHolo] MediaPipe frame send notice:", errSend);
          } finally {
            isDetecting = false;
          }
        }

        if (this.isOpen) {
          this.detectLoopId = requestAnimationFrame(detectNext);
        }
      };

      this.detectLoopId = requestAnimationFrame(detectNext);
      console.log("[ArHolo] MediaPipe Hands telemetry successfully engaged with 100% local assets!");
      fetch('/api/log?msg=' + encodeURIComponent('MediaPipe Hands local engine active and scanning camera!'));
    } catch (e) {
      console.error("[ArHolo] Error initializing MediaPipe Hands:", e);
      fetch('/api/log?msg=' + encodeURIComponent('MediaPipe Hands INIT ERROR: ' + (e.message || e)));
    }
  }

  onHandResults(results) {
    if (!this.isOpen) return;
    this.lastResultTimestamp = Date.now();

    try {
      this.lastLandmarks = results.multiHandLandmarks || [];
      const handCount = this.lastLandmarks.length;

      if (!this._lastReportedCount || this._lastReportedCount !== handCount) {
        this._lastReportedCount = handCount;
        fetch('/api/log?msg=' + encodeURIComponent(`Optical telemetry frame: ${handCount} hand(s) locked`));
      }

      const badge = document.getElementById('arHandCountBadge');
      if (badge) {
        if (this.lastLandmarks.length === 0) {
          badge.textContent = "OPTICAL CAMERA ACTIVE // 0 HANDS DETECTED";
          this.hideReticle();
          this.victoryTimer = null;
          this.pointingDwellTimer = null;
          return;
        } else {
          badge.textContent = `${this.lastLandmarks.length} HAND(S) LOCKED // ARMOR GAUNTLET ONLINE`;
        }
      }

      const screenW = window.innerWidth;
      const screenH = window.innerHeight;

      // Distance helper in normalized space
      const dist = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y, (p1.z - p2.z) * 0.5);

      // Analyze primary hand
      const primary = this.lastLandmarks[0];
      const wrist = primary[0];
      const thumbTip = primary[4];
      const indexTip = primary[8];
      const middleTip = primary[12];
      const ringTip = primary[16];
      const pinkyTip = primary[20];

      // Robust finger extension test: tip is farther from wrist than PIP joint
      const isThumbExt = dist(thumbTip, wrist) > dist(primary[2], wrist) * 1.06;
      const isIndexExt = dist(indexTip, wrist) > dist(primary[6], wrist) * 1.05;
      const isMiddleExt = dist(middleTip, wrist) > dist(primary[10], wrist) * 1.05;
      const isRingExt = dist(ringTip, wrist) > dist(primary[14], wrist) * 1.05;
      const isPinkyExt = dist(pinkyTip, wrist) > dist(primary[18], wrist) * 1.05;

      const pointerX = (1.0 - indexTip.x) * screenW;
      const pointerY = indexTip.y * screenH;
      const pinchDist = dist(thumbTip, indexTip);

      // Pinch hysteresis
      if (this.isPinching) {
        this.isPinching = (pinchDist < 0.135);
      } else {
        this.isPinching = (pinchDist < 0.095);
      }

      // =========================================================================
      // GESTURE 1: TWO-HAND ZOOM, MAXIMIZE & MINIMIZE (Calibrated for Desk Camera)
      // =========================================================================
      if (this.lastLandmarks.length >= 2) {
        const h1 = this.lastLandmarks[0][0];
        const h2 = this.lastLandmarks[1][0];
        const handsDistance = Math.hypot(h1.x - h2.x, h1.y - h2.y);

        // Clap Gesture: Wrists close (< 0.13)
        if (handsDistance < 0.13) {
          this.triggerClapRingCenter();
          this.setGestureBanner("👏 CLAP DETECTED // REACTOR CORE TO CENTER STAGE", "active");
          return;
        }

        // Active card zoom / maximize / minimize
        const activeCard = document.querySelector('.ar-glass-card:not([style*="display: none"])');
        if (activeCard) {
          const cardId = activeCard.dataset.cardId || 'props';
          const state = this.cardStates[cardId] || { x: 50, y: 30, rotX: 0, rotY: 0, scale: 1 };

          // Real-time smooth scaling based on two-hand span
          // 0.16 = 60% scale, 0.32 = 160% scale
          const dynamicScale = Math.max(0.6, Math.min(2.3, 0.6 + (handsDistance - 0.15) * 5.0));
          state.scale = dynamicScale;
          this.applyCardTransform(activeCard, state);

          this.setGestureBanner(`👐 2-HAND ZOOM: ${Math.round(state.scale * 100)}% // SPREAD TO MAXIMIZE`, "active");

          // Spreading hands wide (> 0.32) -> Instantly MAXIMIZE
          if (handsDistance > 0.32 && !activeCard.classList.contains('maximized')) {
            this.maximizeCard(activeCard);
            this.setGestureBanner("🗖 TWO-HAND EXPANSION // WINDOW MAXIMIZED", "active");
          }
          // Bringing hands close (< 0.17) -> Instantly MINIMIZE
          else if (handsDistance < 0.17 && !activeCard.classList.contains('minimized') && handsDistance > 0.13) {
            this.minimizeCard(activeCard);
            this.setGestureBanner("🗕 TWO-HAND CONTRACTION // WINDOW MINIMIZED", "active");
          }
        }
        return;
      }

      // =========================================================================
      // GESTURE 2: REPULSOR PALM PUSH (Full Open Palm Facing Camera)
      // =========================================================================
      const isOpenPalm = isIndexExt && isMiddleExt && isRingExt && isPinkyExt;

      if (isOpenPalm && !this.isPinching && Date.now() - this.repulsorCooldown > 1400) {
        this.repulsorCooldown = Date.now();
        sfx.playWhoosh();

        // Repulsor center point
        const repX = (1.0 - (primary[0].x + primary[9].x)/2) * screenW;
        const repY = ((primary[0].y + primary[9].y)/2) * screenH;

        // Spawn explosive cyan shockwave blast on canvas
        this.shockwaves.push({
          x: repX,
          y: repY,
          radius: 25,
          maxRadius: 220,
          opacity: 1.0,
          isRepulsor: true
        });

        const activeCard = document.querySelector('.ar-glass-card:not([style*="display: none"])');
        if (activeCard) {
          activeCard.style.transition = 'transform 0.45s cubic-bezier(0.1, 0.9, 0.2, 1), opacity 0.45s ease';
          activeCard.style.transform += ' translate(350px, -120px) scale(0.2) rotateY(-40deg)';
          activeCard.style.opacity = '0';
          setTimeout(() => {
            activeCard.style.display = 'none';
            activeCard.style.opacity = '1';
            activeCard.style.transition = 'none';
          }, 450);
          this.setGestureBanner("✋ REPULSOR BLAST // WINDOW DISMISSED!", "alert");
          jarvisVoice.speak("Repulsor blast, window dismissed, boss.");
        } else {
          this.setGestureBanner("✋ REPULSOR BLAST // FIRED!", "active");
        }
        return;
      }

      // =========================================================================
      // GESTURE 3: VICTORY "V" SIGN (Capture Screenshot)
      // =========================================================================
      const isVictorySign = isIndexExt && isMiddleExt && !isRingExt && !isPinkyExt;
      if (isVictorySign && !this.isPinching) {
        if (!this.victoryTimer) this.victoryTimer = Date.now();
        const heldTime = Date.now() - this.victoryTimer;
        this.showReticle(pointerX, pointerY, `SNAP (${Math.max(0.1, (1.1 - heldTime/1000)).toFixed(1)}s)`);
        this.setGestureBanner("✌ VICTORY GESTURE // HOLD FOR SCREENSHOT", "active");

        if (heldTime > 1050) {
          this.victoryTimer = null;
          sfx.playScan();
          jarvisVoice.takeScreenshot();
          this.flashShutter();
          this.setGestureBanner("📸 CAPTURED // SCREENSHOT SAVED TO FOLDER", "active");
          jarvisVoice.speak("Holographic screenshot captured, boss.");
        }
        return;
      } else {
        this.victoryTimer = null;
      }

      // =========================================================================
      // GESTURE 4: DEFENSIVE FIST CLENCH (Shield Mode)
      // =========================================================================
      const isFist = !isIndexExt && !isMiddleExt && !isRingExt && !isPinkyExt;
      if (isFist) {
        this.setGestureBanner("✊ DEFENSIVE FIST // ARMOR SHIELD ACTIVE", "alert");
        this.showReticle(pointerX, pointerY, "SHIELD LOCK");
        document.querySelectorAll('.ar-glass-card:not([style*="display: none"])').forEach(c => {
          if (!c.classList.contains('minimized')) this.minimizeCard(c);
        });
        return;
      }

      // =========================================================================
      // GESTURE 5: AIR-POINTER & MID-AIR TAP CLICK
      // =========================================================================
      // Index is extended while middle is relatively curled
      const isPointingOnly = isIndexExt && (!isMiddleExt || dist(indexTip, wrist) > dist(middleTip, wrist) * 1.25) && !this.isPinching;
      if (isPointingOnly) {
        this.showReticle(pointerX, pointerY, "AIR POINTER", false);
        this.isPointing = true;

        const targetEl = document.elementFromPoint(pointerX, pointerY);
        const clickable = targetEl ? targetEl.closest('.ar-tree-item, .ar-card-ctrl-btn, .ar-hud-btn, .ar-orb-node, .ar-card-close, .ar-card-scale-hint') : null;

        if (clickable) {
          this.setGestureBanner("☝ AIR-POINTER TARGET LOCKED // TAP TO CLICK", "active");

          // Dwell tap: holding steady over button for 700ms triggers click!
          if (!this.pointingDwellTimer) {
            this.pointingDwellTimer = setTimeout(() => {
              clickable.click();
              sfx.playChirp();
              this.shockwaves.push({ x: pointerX, y: pointerY, radius: 8, maxRadius: 50, opacity: 1 });
              this.setGestureBanner("⚡ AIR-TAP CLICK // TRIGGERED!", "active");
              this.pointingDwellTimer = null;
            }, 700);
          }
        } else {
          clearTimeout(this.pointingDwellTimer);
          this.pointingDwellTimer = null;
          this.setGestureBanner("☝ AIR-POINTER ACTIVE // AIM AT BUTTONS", "active");
        }

        // Mid-air quick poke / forward tap
        if (this.prevIndexTip) {
          const dY = indexTip.y - this.prevIndexTip.y;
          const dZ = indexTip.z - this.prevIndexTip.z;
          if ((dY > 0.035 || dZ < -0.035) && Date.now() - this.lastTapTime > 550) {
            this.lastTapTime = Date.now();
            if (clickable) {
              clickable.click();
              sfx.playChirp();
              this.shockwaves.push({ x: pointerX, y: pointerY, radius: 10, maxRadius: 60, opacity: 1 });
              this.setGestureBanner("⚡ AIR-TAP CLICK // TRIGGERED!", "active");
            }
          }
        }
        this.prevIndexTip = { x: indexTip.x, y: indexTip.y, z: indexTip.z };
        return;
      } else {
        this.isPointing = false;
        clearTimeout(this.pointingDwellTimer);
        this.pointingDwellTimer = null;
      }
      this.prevIndexTip = { x: indexTip.x, y: indexTip.y, z: indexTip.z };

      // =========================================================================
      // GESTURE 6: PINCH-TO-DRAG & DRAMATIC 3D WRIST TILT
      // =========================================================================
      if (this.isPinching) {
        const pinchX = (1.0 - (thumbTip.x + indexTip.x) / 2) * screenW;
        const pinchY = ((thumbTip.y + indexTip.y) / 2) * screenH;
        this.showReticle(pinchX, pinchY, "PINCH LOCK", true);

        if (!this.grabbedCard) {
          const cards = Array.from(document.querySelectorAll('.ar-glass-card:not([style*="display: none"])'));
          for (const card of cards) {
            const rect = card.getBoundingClientRect();
            if (pinchX >= rect.left - 80 && pinchX <= rect.right + 80 && pinchY >= rect.top - 80 && pinchY <= rect.bottom + 80) {
              this.grabbedCard = card;
              this.dragOffset = { x: pinchX - rect.left, y: pinchY - rect.top };
              this.dragStartPinch = { x: pinchX, y: pinchY };
              this.grabStartTime = Date.now();
              card.classList.add('pinched');
              sfx.playChirp();
              this.setGestureBanner("🤏 PINCH-DRAG // TILT WRIST FOR 3D PERSPECTIVE", "active");
              break;
            }
          }
        } else {
          const cardId = this.grabbedCard.dataset.cardId || 'props';
          const state = this.cardStates[cardId] || { x: 50, y: 30, rotX: 0, rotY: 0, scale: 1 };

          // Dramatic 3D Wrist Tilt Calculation
          // Angle of forearm to palm vector
          const wristDx = (1.0 - primary[9].x) - (1.0 - wrist.x);
          const wristDy = primary[9].y - wrist.y;
          const wristAngleRad = Math.atan2(wristDy, wristDx) - (Math.PI / 2);
          
          // Lateral tilt (rotY) responds directly to wrist twisting and lateral angle (-45° to +45°)
          const lateralTilt = Math.max(-50, Math.min(50, wristAngleRad * 45));
          // Vertical tilt (rotX) responds to wrist vertical pitch (-35° to +35°)
          const verticalTilt = Math.max(-35, Math.min(35, (wristDy + 0.25) * 80));

          state.rotY = lateralTilt;
          state.rotX = verticalTilt;
          this.applyCardTransform(this.grabbedCard, state);

          // 2D position translation smoothly following fingers
          const newLeft = pinchX - this.dragOffset.x;
          const newTop = pinchY - this.dragOffset.y;
          this.grabbedCard.style.left = `${newLeft}px`;
          this.grabbedCard.style.top = `${newTop}px`;

          const stat = this.grabbedCard.querySelector('.ar-card-stat');
          if (stat) stat.textContent = `3D TILT: Y:${Math.round(state.rotY)}° X:${Math.round(state.rotX)}° // POS:${Math.round(newLeft/screenW*100)}%`;
        }
      } else {
        // Not pinching: Show normal pointer
        this.showReticle(pointerX, pointerY, "POINTER", false);

        if (this.grabbedCard) {
          this.grabbedCard.classList.remove('pinched');
          const stat = this.grabbedCard.querySelector('.ar-card-stat');
          if (stat) stat.textContent = "HOLD STILL = 3D ROTATE";
          this.grabbedCard = null;
        }
      }
    } catch (err) {
      console.warn("[ArHolo] onHandResults handled error:", err);
    }
  }

  setGestureBanner(text, type = 'active') {
    const banner = document.getElementById('arActiveGestureBanner');
    const textEl = document.getElementById('arGestureText');
    if (!banner || !textEl) return;
    textEl.textContent = text;
    banner.className = `ar-gesture-banner ${type}`;
    clearTimeout(this.bannerResetTimer);
    this.bannerResetTimer = setTimeout(() => {
      if (!this.isOpen) return;
      banner.className = 'ar-gesture-banner';
      textEl.textContent = 'READY // PERFORM GESTURES (PINCH, REPULSOR, 2-HAND SCALE, POINT-TAP, "V")';
    }, 2200);
  }

  flashShutter() {
    const flash = document.createElement('div');
    flash.style.position = 'fixed';
    flash.style.inset = '0';
    flash.style.backgroundColor = 'white';
    flash.style.zIndex = '999';
    flash.style.pointerEvents = 'none';
    flash.style.transition = 'opacity 0.25s ease-out';
    document.body.appendChild(flash);
    setTimeout(() => {
      flash.style.opacity = '0';
      setTimeout(() => flash.remove(), 260);
    }, 40);
  }

  triggerClapRingCenter() {
    const ring = document.getElementById('arReactorRing');
    if (!ring || ring.dataset.centered === 'true') return;

    ring.dataset.centered = 'true';
    sfx.playPowerUp();
    ring.style.transition = 'transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    ring.style.transform = 'translate(180px, 80px) scale(1.25)';

    setTimeout(() => {
      ring.style.transform = 'none';
      setTimeout(() => { ring.dataset.centered = 'false'; }, 600);
    }, 2800);
  }

  applyCardTransform(card, state) {
    if (!card) return;
    card.style.transform = `perspective(1200px) rotateY(${state.rotY}deg) rotateX(${state.rotX}deg) scale(${state.scale})`;
  }

  showReticle(x, y, tag = "POINTER", isPinch = false) {
    const reticle = document.getElementById('arPinchReticle');
    if (!reticle) return;
    reticle.classList.remove('hidden');
    reticle.style.left = `${x}px`;
    reticle.style.top = `${y}px`;
    const dot = reticle.querySelector('.ar-reticle-dot');
    if (dot) {
      dot.style.background = isPinch ? '#39ff14' : '#00f5d4';
      dot.style.boxShadow = isPinch ? '0 0 14px #39ff14, 0 0 28px rgba(57, 255, 20, 0.9)' : '0 0 12px #00f5d4, 0 0 22px rgba(0, 245, 212, 0.8)';
    }
    const tagEl = reticle.querySelector('.ar-reticle-tag');
    if (tagEl) {
      tagEl.textContent = tag;
      tagEl.style.color = isPinch ? '#39ff14' : '#00f5d4';
      tagEl.style.borderColor = isPinch ? 'rgba(57, 255, 20, 0.6)' : 'rgba(0, 245, 212, 0.6)';
    }
  }

  hideReticle() {
    const reticle = document.getElementById('arPinchReticle');
    if (reticle) reticle.classList.add('hidden');
  }

  resizeCanvas() {
    const canvas = document.getElementById('arHoloCanvas');
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
  }

  startRenderLoop() {
    const canvas = document.getElementById('arHoloCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const render = () => {
      if (!this.isOpen) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      // Render active shockwaves & laser bursts
      for (let i = this.shockwaves.length - 1; i >= 0; i--) {
        const sw = this.shockwaves[i];
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = sw.isRepulsor ? `rgba(57, 255, 20, ${sw.opacity})` : `rgba(0, 245, 212, ${sw.opacity})`;
        ctx.lineWidth = sw.isRepulsor ? 4 : 2;
        ctx.shadowColor = sw.isRepulsor ? '#39ff14' : '#00f5d4';
        ctx.shadowBlur = 12;
        ctx.stroke();

        sw.radius += (sw.isRepulsor ? 12 : 6);
        sw.opacity -= (sw.isRepulsor ? 0.04 : 0.06);
        if (sw.opacity <= 0) this.shockwaves.splice(i, 1);
      }

      // Render two-hand measurement cybernetic beam if 2 hands present
      if (this.lastLandmarks.length >= 2) {
        const h1 = this.lastLandmarks[0][0];
        const h2 = this.lastLandmarks[1][0];
        const p1x = (1.0 - h1.x) * window.innerWidth;
        const p1y = h1.y * window.innerHeight;
        const p2x = (1.0 - h2.x) * window.innerWidth;
        const p2y = h2.y * window.innerHeight;

        ctx.beginPath();
        ctx.moveTo(p1x, p1y);
        ctx.lineTo(p2x, p2y);
        ctx.strokeStyle = '#00f5d4';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Midpoint scale readout badge
        const midX = (p1x + p2x) / 2;
        const midY = (p1y + p2y) / 2;
        const distPx = Math.hypot(p1x - p2x, p1y - p2y);
        ctx.fillStyle = 'rgba(1, 12, 22, 0.85)';
        ctx.fillRect(midX - 70, midY - 15, 140, 30);
        ctx.strokeStyle = '#00f5d4';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(midX - 70, midY - 15, 140, 30);
        ctx.fillStyle = '#39ff14';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`2-HAND RESIZE (${Math.round(distPx)}px)`, midX, midY + 4);
      }

      // Render Mark VII Holographic Armor Gauntlets on all detected hands
      if (this.lastLandmarks.length > 0) {
        this.lastLandmarks.forEach(landmarks => {
          this.renderArmorGauntlet(ctx, landmarks);
        });
      }

      ctx.restore();
      this.animId = requestAnimationFrame(render);
    };

    render();
  }

  // =========================================================================
  // MARK VII HOLOGRAPHIC ARMOR GAUNTLET RENDERER
  // Renders cybernetic armor plating, palm repulsor core, and 3D hologram rings
  // =========================================================================
  renderArmorGauntlet(ctx, landmarks) {
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    // Map all 21 normalized landmarks to screen space (mirrored X)
    const pts = landmarks.map(lm => ({
      x: (1.0 - lm.x) * screenW,
      y: lm.y * screenH
    }));

    ctx.save();

    // 1. PALM DORSAL ARMOR PLATE (Faceted Cybernetic Armor)
    // Connects wrist (0), thumb root (1, 2), index root (5), middle (9), ring (13), pinky (17)
    const palmPlateIndices = [0, 1, 2, 5, 9, 13, 17, 0];
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    palmPlateIndices.forEach(idx => ctx.lineTo(pts[idx].x, pts[idx].y));
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 245, 212, 0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 245, 212, 0.7)';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00f5d4';
    ctx.shadowBlur = 10;
    ctx.stroke();

    // Inner palm circuit tracks
    [5, 9, 13, 17].forEach(kIdx => {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.lineTo(pts[kIdx].x, pts[kIdx].y);
      ctx.strokeStyle = 'rgba(0, 245, 212, 0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // 2. PALM REPULSOR CORE (Arc Reactor in Palm Center)
    const repX = (pts[0].x + pts[5].x + pts[17].x) / 3;
    const repY = (pts[0].y + pts[5].y + pts[17].y) / 3;

    // Outer spinning repulsor ring
    ctx.beginPath();
    ctx.arc(repX, repY, 18, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 245, 212, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Middle glow ring
    ctx.beginPath();
    ctx.arc(repX, repY, 12, 0, Math.PI * 2);
    ctx.strokeStyle = '#39ff14';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Brilliant inner core
    ctx.beginPath();
    ctx.arc(repX, repY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00f5d4';
    ctx.shadowBlur = 15;
    ctx.fill();

    // 3. FINGER ARMOR CONDUITS & HOLOGRAPHIC JOINT RINGS (All 5 Fingers)
    const fingers = [
      [1, 2, 3, 4],     // Thumb
      [5, 6, 7, 8],     // Index
      [9, 10, 11, 12],  // Middle
      [13, 14, 15, 16], // Ring
      [17, 18, 19, 20]  // Pinky
    ];

    fingers.forEach((finger, fIdx) => {
      // Connect wrist to finger base if not thumb
      if (fIdx > 0) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[finger[0]].x, pts[finger[0]].y);
        ctx.strokeStyle = 'rgba(0, 245, 212, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Draw cybernetic conduits between finger joints
      for (let i = 0; i < finger.length - 1; i++) {
        const p1 = pts[finger[i]];
        const p2 = pts[finger[i + 1]];

        // Cybernetic dual-line conduit
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.hypot(dx, dy);
        const nx = (-dy / len) * 3;
        const ny = (dx / len) * 3;

        ctx.beginPath();
        ctx.moveTo(p1.x + nx, p1.y + ny);
        ctx.lineTo(p2.x + nx, p2.y + ny);
        ctx.moveTo(p1.x - nx, p1.y - ny);
        ctx.lineTo(p2.x - nx, p2.y - ny);
        ctx.strokeStyle = 'rgba(0, 245, 212, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Central neon bone line
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = 'rgba(0, 245, 212, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 4. HOLOGRAPHIC ARMOR JOINT RINGS
        // Draw 3D-oriented holographic cylinder ring around the joint
        const angle = Math.atan2(dy, dx);
        ctx.beginPath();
        ctx.ellipse(p1.x, p1.y, 7, 3.5, angle + Math.PI/2, 0, Math.PI * 2);
        ctx.strokeStyle = '#00f5d4';
        ctx.fillStyle = 'rgba(0, 245, 212, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.fill();
        ctx.stroke();
      }

      // 5. ARMORED FINGERTIP SENSORS
      const tip = pts[finger[finger.length - 1]];
      const isPinchFinger = (finger[finger.length - 1] === 4 || finger[finger.length - 1] === 8);
      const activePinchGlow = isPinchFinger && this.isPinching;

      ctx.beginPath();
      ctx.arc(tip.x, tip.y, activePinchGlow ? 7 : 5, 0, Math.PI * 2);
      ctx.fillStyle = activePinchGlow ? '#39ff14' : '#00f5d4';
      ctx.shadowColor = activePinchGlow ? '#39ff14' : '#00f5d4';
      ctx.shadowBlur = activePinchGlow ? 16 : 8;
      ctx.fill();

      // Outer micro-reticle ring on fingertips
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 9, 0, Math.PI * 2);
      ctx.strokeStyle = activePinchGlow ? 'rgba(57, 255, 20, 0.8)' : 'rgba(0, 245, 212, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // 6. MAGNETIC ARCING BETWEEN THUMB & INDEX (When pinched)
    if (this.isPinching) {
      const pThumb = pts[4];
      const pIndex = pts[8];
      ctx.beginPath();
      ctx.moveTo(pThumb.x, pThumb.y);
      // Zigzag lightning arc
      const mx = (pThumb.x + pIndex.x) / 2 + (Math.random() - 0.5) * 8;
      const my = (pThumb.y + pIndex.y) / 2 + (Math.random() - 0.5) * 8;
      ctx.lineTo(mx, my);
      ctx.lineTo(pIndex.x, pIndex.y);
      ctx.strokeStyle = '#39ff14';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#39ff14';
      ctx.shadowBlur = 14;
      ctx.stroke();
    }

    // 7. WRIST GAUNTLET CUFF
    ctx.beginPath();
    ctx.ellipse(pts[0].x, pts[0].y, 22, 10, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 245, 212, 0.85)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }
}

const arHoloWorkspace = new ArHoloWorkspaceController();

// ==========================================
// 9. Initialization
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  updateClock();
  setInterval(updateClock, 1000);

  fetchTelemetry();
  setInterval(fetchTelemetry, 2500);

  setupModal();
  setupToggles();
  holographicWorkspace.init();
  arcReactorVisualizer.init();
  arHoloWorkspace.init();

  // Voice AI initialization
  jarvisVoice.startListening();

  // Voice greeting: attempt on load and unlock on first user interaction
  setTimeout(() => jarvisVoice.greet(), 700);

  const unlockAudioAndGreet = () => {
    sfx.init();
    if (arcReactorVisualizer.audioCtx && arcReactorVisualizer.audioCtx.state === 'suspended') {
      arcReactorVisualizer.audioCtx.resume();
    }
    if (jarvisVoice.recognition && !jarvisVoice.isListening) {
      try {
        jarvisVoice.recognition.start();
      } catch (err) {}
    }
    jarvisVoice.greet();
  };
  window.addEventListener('click', unlockAudioAndGreet);
  window.addEventListener('pointerdown', unlockAudioAndGreet);
  window.addEventListener('keydown', unlockAudioAndGreet);

  const cmdInput = document.getElementById('commandInput');
  const cmdSubmit = document.getElementById('commandSubmit');
  if (cmdSubmit && cmdInput) {
    cmdSubmit.addEventListener('click', () => {
      handleCommand(cmdInput.value);
      cmdInput.value = '';
    });
    cmdInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleCommand(cmdInput.value);
        cmdInput.value = '';
      }
    });
  }

  // Synchronize HUD with Python Background Hardware Microphone Voice Listener
  let lastSeenVoiceEventId = 0;
  setInterval(() => {
    fetch('/api/voice_event')
      .then(res => res.json())
      .then(evt => {
        if (evt && evt.id && evt.id !== lastSeenVoiceEventId && evt.command) {
          lastSeenVoiceEventId = evt.id;
          const transText = document.getElementById('voiceTranscriptText');
          const directiveEl = document.getElementById('footDirective');
          const badge = document.getElementById('voiceBadgeText');
          if (badge) badge.textContent = "LAPTOP MIC ACTIVE";

          if (transText) {
            transText.innerHTML = `<span style="color:#ffbe0b;font-weight:bold;">BOSS:</span> "${escapeHtml(evt.command)}" &nbsp; | &nbsp; <span style="color:var(--cyan-bright);font-weight:bold;">JARVIS:</span> "${escapeHtml(evt.reply)}"`;
          }
          if (directiveEl && evt.reply) {
            directiveEl.textContent = `DIRECTIVE: ${evt.reply.toUpperCase()}`;
          }
          if (typeof sfx !== 'undefined') sfx.playChirp();
        }
      })
      .catch(() => {});
  }, 600);

  // QR Code Modal Controls
  const qrBtn = document.getElementById('qrCodeBtn');
  const closeQrBtn = document.getElementById('closeQrCodeBtn');
  const dismissQrBtn = document.getElementById('qrDismissBtn');
  const qrGenerateBtn = document.getElementById('qrGenerateBtn');
  const qrCustomInput = document.getElementById('qrCustomInput');
  const qrCopyBtn = document.getElementById('qrCopyBtn');
  const qrDownloadBtn = document.getElementById('qrDownloadBtn');

  if (qrBtn) {
    qrBtn.addEventListener('click', () => {
      jarvisVoice.generateQRCode('https://www.google.com');
    });
  }
  if (closeQrBtn) closeQrBtn.addEventListener('click', () => jarvisVoice.closeQRCode());
  if (dismissQrBtn) dismissQrBtn.addEventListener('click', () => jarvisVoice.closeQRCode());

  if (qrGenerateBtn && qrCustomInput) {
    const runGen = () => {
      const val = qrCustomInput.value.trim();
      if (val) jarvisVoice.generateQRCode(val);
    };
    qrGenerateBtn.addEventListener('click', runGen);
    qrCustomInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') runGen();
    });
  }

  if (qrCopyBtn) {
    qrCopyBtn.addEventListener('click', () => {
      const textEl = document.getElementById('qrEncodedText');
      if (textEl && textEl.textContent) {
        navigator.clipboard.writeText(textEl.textContent).then(() => {
          sfx.playChirp();
          const orig = qrCopyBtn.textContent;
          qrCopyBtn.textContent = '✓ COPIED!';
          qrCopyBtn.style.color = '#00f5d4';
          setTimeout(() => {
            qrCopyBtn.textContent = orig;
            qrCopyBtn.style.color = '';
          }, 1800);
        }).catch(() => {});
      }
    });
  }

  const qrOpenFolderBtn = document.getElementById('qrOpenFolderBtn');
  if (qrOpenFolderBtn) {
    qrOpenFolderBtn.addEventListener('click', () => jarvisVoice.openScreenshotsFolder());
  }

  // Dashboard Center QR Widget Controls
  const dashQrOpenFolder = document.getElementById('dashQrOpenFolder');
  const dashQrExpand = document.getElementById('dashQrExpand');
  const dashQrClose = document.getElementById('dashQrClose');
  const dashQrCopyBtn = document.getElementById('dashQrCopyBtn');
  const dashQrDownloadBtn = document.getElementById('dashQrDownloadBtn');

  if (dashQrOpenFolder) {
    dashQrOpenFolder.addEventListener('click', () => jarvisVoice.openScreenshotsFolder());
  }

  if (dashQrExpand) {
    dashQrExpand.addEventListener('click', () => {
      const modal = document.getElementById('qrCodeModal');
      if (modal) {
        modal.classList.remove('qr-hidden');
        modal.style.display = 'flex';
        sfx.playScan();
      }
    });
  }

  if (dashQrClose) {
    dashQrClose.addEventListener('click', () => jarvisVoice.dismissDashboardQR());
  }

  if (dashQrCopyBtn) {
    dashQrCopyBtn.addEventListener('click', () => {
      const targetEl = document.getElementById('dashQrTargetText');
      if (targetEl && targetEl.textContent) {
        navigator.clipboard.writeText(targetEl.textContent).then(() => {
          sfx.playChirp();
          const orig = dashQrCopyBtn.textContent;
          dashQrCopyBtn.textContent = '✓ COPIED!';
          dashQrCopyBtn.style.color = '#00f5d4';
          setTimeout(() => {
            dashQrCopyBtn.textContent = orig;
            dashQrCopyBtn.style.color = '';
          }, 1800);
        }).catch(() => {});
      }
    });
  }

  if (dashQrDownloadBtn) {
    dashQrDownloadBtn.addEventListener('click', () => {
      const imgEl = document.getElementById('dashQrImg');
      if (imgEl && imgEl.src) {
        sfx.playChirp();
        const a = document.createElement('a');
        a.href = imgEl.src;
        a.target = '_blank';
        a.download = 'jarvis_qr_dashboard.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });
  }

  if (qrDownloadBtn) {
    qrDownloadBtn.addEventListener('click', () => {
      const imgEl = document.getElementById('qrDisplayImg');
      if (imgEl && imgEl.src) {
        sfx.playChirp();
        const a = document.createElement('a');
        a.href = imgEl.src;
        a.target = '_blank';
        a.download = 'jarvis_qr_matrix.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });
  }

  // Instant Web Search HUD Button
  const webSearchBtn = document.getElementById('webSearchBtn');
  if (webSearchBtn) {
    webSearchBtn.addEventListener('click', () => {
      sfx.playChirp();
      const cmdInput = document.getElementById('commandInput');
      if (cmdInput) {
        cmdInput.value = 'search google for ';
        cmdInput.focus();
        cmdInput.setSelectionRange(cmdInput.value.length, cmdInput.value.length);
      }
      jarvisVoice.speak("What would you like me to search for, boss?");
    });
  }

  // Initialize Stark Cockpit Helmet Visor HUD
  starkCockpitHud.init();
});
