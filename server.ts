import express from 'express';
import path from 'path';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));

// Initialize Gemini Client
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY environment variable is not set. CyberGuard AI will operate in simulated mode.");
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

// Role-specific System Prompts
const ROLE_PROMPTS: Record<string, string> = {
  cyber_expert: `You are CyberGuard AI, an elite cybersecurity expert.
Answer only cybersecurity-related questions including ethical hacking, networking, malware analysis, digital forensics, Linux, cloud security, cryptography, secure coding, incident response, SIEM, SOC, penetration testing, OWASP, phishing, ransomware, vulnerability assessment, and cyber awareness.

If a user asks anything unrelated to cybersecurity, politely respond:

'I am CyberGuard AI and can only answer cybersecurity-related questions.'`,

  malware_analyst: `You are CyberGuard AI operating in Malware & Log Triage Analyst mode.
Your role is to analyze malware behaviors, system/network logs, memory dumps, YARA rules, threat intelligence indicators (IOCs), reverse engineering concepts, and incident triage.
Answer only cybersecurity and threat analysis related questions.

If a user asks anything unrelated to cybersecurity, politely respond:

'I am CyberGuard AI and can only answer cybersecurity-related questions.'`,

  ethical_hacker: `You are CyberGuard AI operating in Ethical Hacker & PenTester mode.
Your role is to explain authorized offensive security principles, penetration testing methodologies (PTES, OWASP), network scanning concepts, vulnerability assessments, defense evasions, and remediation controls for educational and defensive purposes.
Answer only cybersecurity and ethical hacking related questions.

If a user asks anything unrelated to cybersecurity, politely respond:

'I am CyberGuard AI and can only answer cybersecurity-related questions.'`,

  code_auditor: `You are CyberGuard AI operating in Secure Code Auditor (SAST) mode.
Your role is to inspect source code for security vulnerabilities (e.g. OWASP Top 10, SQLi, XSS, CSRF, RCE, IDOR, insecure deserialization) and provide secure, refactored patch code snippets and defense-in-depth guidance.
Answer only software security, code auditing, and cybersecurity related questions.

If a user asks anything unrelated to cybersecurity, politely respond:

'I am CyberGuard AI and can only answer cybersecurity-related questions.'`
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'CyberGuard AI',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY
  });
});

// Chat API Route (Multi-turn conversation history, Multimodal Image Input, Thinking Mode, Model Selection)
app.post('/api/chat', async (req, res) => {
  try {
    const { 
      message, 
      history = [], 
      model = 'gemini-3.6-flash', 
      role = 'cyber_expert',
      images = [],
      enableThinking = false,
    } = req.body;

    if ((!message || typeof message !== 'string') && images.length === 0) {
      return res.status(400).json({ error: "Message or image parameter is required." });
    }

    const promptText = message || "Please analyze the uploaded image for cybersecurity threats, indicators of compromise, or code vulnerabilities.";

    const ai = getAiClient();

    if (!ai) {
      // Rich smart fallback for offline/demo environment when GEMINI_API_KEY is not yet populated
      let topicReply = "";
      const lowerMsg = promptText.toLowerCase();

      if (lowerMsg.includes('ethical hack') || lowerMsg.includes('pen test') || role === 'ethical_hacker') {
        topicReply = `### ⚔️ Ethical Hacking & Penetration Testing Core Guide

Ethical Hacking (White Hat Hacking) is the practice of authorized testing of systems and networks to identify vulnerabilities before malicious attackers exploit them.

#### 🎯 Key Penetration Testing Methodology (PTES):
1. **Reconnaissance & Footprinting:** Gathering public intelligence (OSINT, DNS records, IP blocks) using tools like \`Whois\`, \`Shodan\`, and \`theHarvester\`.
2. **Network Scanning & Enumeration:** Identifying active hosts, open ports, and running service versions using \`Nmap\` (\`nmap -sV -sC -p- <target>\`) and \`Masscan\`.
3. **Vulnerability Assessment:** Scanning for known CVEs using scanners like \`Nessus\`, \`OpenVAS\`, or \`Nikto\`.
4. **Exploitation:** Safely validating vulnerabilities using frameworks like \`Metasploit\` or custom POC scripts.
5. **Post-Exploitation & Privilege Escalation:** Assessing lateral movement risk, dumping hashes (\`Mimikatz\`), and evaluating active directory structures.
6. **Reporting & Remediation:** Documenting CVSS risk scores, proof of concepts, and patch guidance for engineering teams.

#### 🛠️ Essential Ethical Hacking Tools:
- **Nmap / RustScan:** Fast port scanning & OS fingerprinting
- **Burp Suite / OWASP ZAP:** Web application proxy & parameter manipulation
- **Wireshark:** Deep packet analysis & PCAP inspection
- **Metasploit Framework:** Exploit verification & payload generation

*Pro-Tip:* Configure your \`GEMINI_API_KEY\` in settings to unlock live real-time Gemini AI penetration testing analysis!`;
      } else if (lowerMsg.includes('malware') || lowerMsg.includes('log') || role === 'malware_analyst') {
        topicReply = `### 🔍 Malware & Forensic Log Triage Guide

Malware analysis systematically inspects malicious binaries, ransomware samples, and suspicious network traffic to construct Indicators of Compromise (IOCs).

#### 🧪 Analysis Phases:
1. **Static Analysis:**
   - Hashing (\`md5sum\`, \`sha256sum\`) & VT (VirusTotal) lookup
   - String extraction (\`strings binary.exe | grep http\`)
   - PE Header inspection (\`PEStudio\`, \`Capa\`) for API imports (\`VirtualAlloc\`, \`CreateRemoteThread\`)
2. **Dynamic Analysis (Sandboxing):**
   - Executing binary in isolated VMs (ANY.RUN, Cuckoo Sandbox)
   - Process monitoring via Procmon & Process Hacker
   - Registry modification tracking (\`HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\`)
3. **SIEM & Log Triage:**
   - **Sysmon Event ID 1:** Process Creation (command-line arguments, parent-child process anomalies)
   - **Sysmon Event ID 3:** Network Connections (suspicious outbound beaconing to C2 servers)
   - **Sysmon Event ID 10:** Process Access (lsass.exe memory dumping)

*Pro-Tip:* Configure your \`GEMINI_API_KEY\` in settings to perform real-time automated YARA rule generation!`;
      } else if (lowerMsg.includes('incident') || lowerMsg.includes('nist')) {
        topicReply = `### 🛡️ NIST Incident Response Lifecycle (SP 800-61)

An Incident Response Plan ensures swift containment and minimal impact during security breaches or ransomware outbreaks.

#### 📋 4 Core NIST Phases:
1. **Preparation:** Establishing CSIRT roles, out-of-band communication, backup immutability, and SIEM alert thresholds.
2. **Detection & Analysis:** Correlation of IDS/IPS alerts, EDR telemetry, and firewall logs to confirm breach validity and scope.
3. **Containment, Eradication & Recovery:**
   - *Short-Term Containment:* Isolating compromised hosts from VLANs/Active Directory.
   - *Eradication:* Terminating malicious processes, revoking stolen OAuth tokens, patching vulnerability vector.
   - *Recovery:* Restoring systems from clean, verified backups and monitoring for persistence.
4. **Post-Incident Activity:** Documenting timeline, root cause analysis (RCA), and hardening security posture.`;
      } else if (lowerMsg.includes('owasp') || lowerMsg.includes('sast') || role === 'code_auditor') {
        topicReply = `### 💻 OWASP Top 10 & Secure Code Audit Guide

Software security audits identify vulnerabilities early in the Software Development Life Cycle (SDLC).

#### 🚨 Critical OWASP Vulnerabilities & Fixes:
1. **SQL Injection (SQLi):**
   - *Vulnerable:* \`db.query("SELECT * FROM users WHERE id = " + req.query.id)\`
   - *Secure Patch:* Use parameterized queries: \`db.query("SELECT * FROM users WHERE id = ?", [req.query.id])\`
2. **Cross-Site Scripting (XSS):**
   - *Vulnerable:* Rendering untrusted HTML via \`dangerouslySetInnerHTML\`
   - *Secure Patch:* Sanitize with \`DOMPurify.sanitize(input)\` or native React JSX encoding.
3. **Broken Object Level Authorization (BOLA/IDOR):**
   - *Secure Patch:* Validate that \`currentUser.id\` owns the requested record ID on the backend server.`;
      } else {
        topicReply = `### 🛡️ CyberGuard AI Security Response

Thank you for contacting CyberGuard AI regarding "${promptText}".

1. **Threat Assessment:** CyberGuard AI is ready to inspect network logs, source code, system architecture, or threat indicators.
2. **Core Best Practice:** Ensure zero-trust network segmentation, enforce multi-factor authentication (MFA), and audit user privileges regularly.

*Pro-Tip:* Configure your \`GEMINI_API_KEY\` in settings to enable live model reasoning.`;
      }

      return res.json({
        text: topicReply,
      });
    }

    // Build multi-turn conversation history for @google/genai SDK
    const contents: Array<{ role: 'user' | 'model'; parts: Array<any> }> = [];

    if (Array.isArray(history)) {
      for (const item of history) {
        if (item && item.text) {
          contents.push({
            role: item.sender === 'user' ? 'user' : 'model',
            parts: [{ text: item.text }]
          });
        }
      }
    }

    // Build parts for current user message (including image attachments if present)
    const currentUserParts: Array<any> = [];

    if (Array.isArray(images) && images.length > 0) {
      for (const img of images) {
        if (img && img.data && img.mimeType) {
          // Stripping data URL prefix if present
          const base64Data = img.data.includes(',') ? img.data.split(',')[1] : img.data;
          currentUserParts.push({
            inlineData: {
              mimeType: img.mimeType,
              data: base64Data,
            }
          });
        }
      }
    }

    currentUserParts.push({ text: promptText });

    contents.push({
      role: 'user',
      parts: currentUserParts
    });

    // Model selection logic
    // Force gemini-3.1-pro-preview when high thinking mode or image analysis is requested
    let selectedModel = model;
    if (enableThinking || (Array.isArray(images) && images.length > 0)) {
      selectedModel = 'gemini-3.1-pro-preview';
    } else {
      const allowedModels = ['gemini-3.1-pro-preview', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.1-flash-live-preview'];
      selectedModel = allowedModels.includes(model) ? model : 'gemini-3.6-flash';
    }

    // Select system prompt based on role
    const systemPrompt = ROLE_PROMPTS[role] || ROLE_PROMPTS.cyber_expert;

    // Config setup
    const config: any = {
      systemInstruction: systemPrompt,
      temperature: selectedModel === 'gemini-3.1-pro-preview' ? 0.2 : 0.4,
    };

    // Enable High Thinking Mode for gemini-3.1-pro-preview if requested
    if (enableThinking && selectedModel === 'gemini-3.1-pro-preview') {
      config.thinkingConfig = {
        thinkingLevel: ThinkingLevel.HIGH,
      };
      // Do NOT set maxOutputTokens per specification
    }

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents,
      config,
    });

    const replyText = response.text || "I am CyberGuard AI and can only answer cybersecurity-related questions.";
    res.json({ text: replyText, modelUsed: selectedModel, thinkingActive: enableThinking });
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI response." });
  }
});

// Vite Development & Production Server Setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CyberGuard AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
