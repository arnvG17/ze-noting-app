<h1 align="center">🚀 The Noting App</h1>

<p align="center">
  <i>Your AI-Powered Document Summarizer & Study Assistant</i><br>
  <img src="https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/Node.js-Express-green?style=for-the-badge&logo=node.js" />
  <img src="https://img.shields.io/badge/LLM-TogetherAI-orange?style=for-the-badge&logo=openai" />
</p>

<p align="center">
  <a href="https://lnkd.in/gBrnHVc5">🌐 Live Demo</a> •
  <a href="https://lnkd.in/gV9PmAZv">📦 GitHub Repo</a>
</p>

---

## ✨ Overview

**The Noting App** transforms your study workflow by letting you upload documents (PDF, DOCX, TXT), get instant **AI-powered summaries**, and chat directly with your files — all wrapped in a delightful, modern UI/UX.

Whether you're a student, researcher, or knowledge-worker, this is your go-to assistant for making reading and note-taking smarter.

---

## 🌟 Features

- 🔹 **AI Summarization** — Upload documents & get concise, well-structured summaries in seconds.  
- 🔹 **Interactive Chatbot** — Ask context-aware questions about your document powered by advanced LLMs.  
- 🔹 **Downloadable Notes** — Export AI-generated notes as PDF for offline use.  
- 🔹 **Drag-and-Drop Upload** — Effortless file upload with real-time validation & progress.  
- 🔹 **Modern UI/UX** — Glassmorphism header, animated 3D notes background, responsive design, shimmer loaders, smooth transitions.  

---

## 🧠 Tech Stack

| Layer      | Technologies |
|------------|--------------|
| **Frontend** | React 18 + Vite + Tailwind CSS + shadcn UI + Framer Motion |
| **Backend**  | Node.js + Express + Multer |
| **LLMs**     | Together AI’s **Llama-3.2-3B-Instruct-Turbo** with custom prompt engineering |

---

## 🎨 UI / UX Highlights

- 🟢 **Header Bar**: Fixed, glassy & beautifully rounded with centered layout.  
- 🟢 **3D Notes Animation**: Pure SVG + CSS floating notes (no three.js!).  
- 🟢 **Shimmer Loader**: Custom shimmer effect matching the app’s branding.  
- 🟢 **Responsive Design**: Works flawlessly on desktop, tablet & mobile.  

<p align="center">
  <img src="https://user-images.githubusercontent.com/placeholder/animated-notes.gif" alt="Animated Background" width="700"/>
</p>

---

## 🚀 Getting Started

### 1️⃣ Clone the Repo


git clone https://github.com/arnvG17/ze-noting-pp.git
cd ze-noting-app

# Install frontend
cd frontend
npm install

# Install backend
cd ../server
npm install

# In /server
npm run dev

# In /client (new terminal)
npm run dev

## Folder Structure

the-noting-app/
├── client/   # React frontend
│   ├── src/
│   └── public/
├── server/   # Node.js backend
│   ├── routes/
│   ├── controllers/
│   └── uploads/
└── README.md


