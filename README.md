# ⚡ IdeaForge AI — Business Idea Generator

A powerful, AI-driven business idea generator powered by **Claude (Anthropic)**. Enter your context, get deeply researched, market-specific business ideas in seconds.

---

## 🚀 Getting Started

### 1. Open the App
Simply open `index.html` in any modern browser (Chrome, Firefox, Safari, Edge).

> ⚠️ **Important for local use:** Open the file via a local server or double-click. Some browsers restrict API calls from `file://` — if that happens, use VS Code Live Server or run `npx serve .` in this folder.

### 2. Get Your Anthropic API Key
1. Go to [https://console.anthropic.com/keys](https://console.anthropic.com/keys)
2. Create a new API key
3. Copy the key (starts with `sk-ant-...`)

### 3. Enter Your API Key
When you first open the app, you'll see a setup screen asking for your key. Paste it in and click **Launch IdeaForge**.

Your key is stored **only in your browser's localStorage** — it never goes to any server other than Anthropic's official API.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 Real AI | Powered by Claude claude-sonnet-4-20250514 — not templates |
| 🎯 Hyper-specific | Ideas tailored to your country, audience, skills, and budget |
| 📊 Structured output | Every idea includes revenue model, costs, risk level, and action steps |
| 🔖 Save ideas | Bookmark your favorites — persisted across sessions |
| 📋 Copy | Copy any idea as formatted text |
| 📥 Export | Download ideas as `.txt` files |
| 🌙 Dark luxury UI | Premium design with smooth animations |
| 📱 Mobile friendly | Works on phones and tablets |
| 3 or 5 ideas | Choose how many ideas to generate |
| Detail levels | Concise / Detailed / Deep Dive modes |

---

## 💡 Tips for Best Results

- **Be specific with Industry** → "Street food delivery for office workers" beats "Food"
- **Use real country/city context** → "Mumbai" beats "India"
- **Add your skills** → Claude matches ideas to what you can actually build
- **Use the Insight field** → Share a pain point you've personally noticed — this produces your most unique ideas
- **Try Deep Dive mode** → For your top idea, regenerate in Deep Dive for a full breakdown

---

## 🛠 Tech Stack

- **Pure HTML + CSS + JavaScript** — No frameworks, no build step
- **Anthropic Claude API** — `claude-sonnet-4-20250514` model
- **Google Fonts** — Syne (display) + Outfit (body) + JetBrains Mono
- **LocalStorage** — For API key + saved ideas persistence
- **Fetch API** — Direct browser-to-API calls

---

## 📁 File Structure

```
ideaforge-ai/
├── index.html     ← Main app
├── style.css      ← All styling (dark luxury theme)
├── script.js      ← All logic + Claude API calls
└── README.md      ← This file
```

---

## 🔒 Privacy

- Your API key is stored only in your own browser (`localStorage`)
- No backend server — all requests go directly from your browser to Anthropic
- No analytics, no tracking

---

## 📦 Hosting

Want to host this online? You can deploy it to:
- **GitHub Pages** — Free, just push to a repo and enable Pages
- **Netlify** — Drop the folder onto netlify.com/drop
- **Vercel** — `npx vercel` in the folder

> For hosted versions, users bring their own API keys via the gate screen.

---

Made with ⚡ by IdeaForge AI
