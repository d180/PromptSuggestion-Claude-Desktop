# Prompt Suggestion MCP Server (Claude Desktop – Local Version)

A Model Context Protocol (MCP) server that helps your LLM instantly rewrite disappointing responses into **one clean, high-quality prompt** — running fully on your local machine.

This MCP server analyzes the recent conversation, identifies what you actually wanted, and generates a **single, first-person improved prompt** designed to produce a much better answer from the assistant.

No noise.  
No confusion.  
Just one perfect next prompt — every time.

---

## ✨ Features

### 🎯 Smart Failure Understanding  
The server reads:
- The recent conversation window  
- The last user message  
- An optional user comment explaining the dislike  

It then determines:
- What you were trying to achieve  
- Why the assistant’s last answer failed  
- What clarity or structure was missing  

---

### ✍️ High-Quality Prompt Rewriting  
Your MCP server always generates **one optimized prompt** that is:

- Written in **first person**  
  - (“Explain to me…”, “Give me…”, “Help me…”)
- **Self-contained**  
  - Works even if the AI never saw the earlier conversation
- Clear, specific, and free of meta references  
  - No “the user”, “previous messages”, or “the conversation above”
- Structured when needed  
  - Steps, examples, analogies, UX guidelines, etc.

You may also receive **up to two short alternatives**, but the main one is always clearly the best.

---

### 🧠 Consistent Output  
No matter what phrase you use:  
- “use the tool”  
- “give me a better prompt”  
- “rewrite this prompt”  
- “fix the prompt”  

…the MCP server **always** returns one definitive best prompt.

---

## 🖥️ Local Claude Desktop Version (This Repo)

This repository contains the **local MCP server (TypeScript version)** used with **Claude Desktop**.

It runs fully on your machine using `tsx` — no cloud hosting required.

---

## 📦 Installation

### 1️⃣ Clone the repository
```bash
git clone https://github.com/d180/PromptSuggestion-Claude-Desktop.git
cd PromptSuggestion-Claude-Desktop
```

### 2️⃣ Install dependencies
```bash
npm install
```

### 3️⃣ Add your API Key  
Create a `.env` file inside the project root:

```env
GEMINI_API_KEY=your_key_here
```

That’s all you need locally.

---

## 🔗 Connect the MCP Server to Claude Desktop

Claude Desktop loads MCP connections from this file:

**macOS**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows**
```
%APPDATA%/Claude/claude_desktop_config.json.json
```

### Add this configuration:

```json
{
  "mcpServers": {
    "prompt-suggestion": {
      "command": "npx",
      "args": [
        "tsx",
        "PATH_TO_YOUR_PROJECT/src/stdio.ts"
      ],
      "env": {
        "GEMINI_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

Replace:

- `PATH_TO_YOUR_PROJECT` → Your actual local folder path  
- `YOUR_API_KEY_HERE` → Your Gemini API key  

Then **restart Claude Desktop**.

Your tool will appear automatically when Claude asks for MCP permissions.

---

## 🧠 How to Use the MCP Tool

When chatting with Claude, simply type any of the following:

- **"Use the tool and give me a better prompt."**
- **"Rewrite this prompt using the MCP tool."**
- **"Fix this prompt."**
- **"Give me a cleaner prompt for this."**

Claude Desktop will:

1. Detect the MCP intent  
2. Call your local MCP server  
3. Request permission to run it  
4. Return the improved prompt  

---

## 🧩 Output Format  
The MCP server always returns:

```json
{
  "summary": "...",
  "root_causes": ["..."],
  "suggested_prompt": "THE BEST FIRST-PERSON PROMPT",
  "alternatives": ["..."],
  "confidence": "0.0 - 1.0"
}
```

The **best improved prompt** is always in:  
`"suggested_prompt"`

---

## 🚀 Why the Local Version?

- No ChatGPT developer mode required  
- Claude’s memory stays ON  
- Runs entirely on your machine  
- No cloud, no accounts, no hosting  
- Extremely fast and private  

------
