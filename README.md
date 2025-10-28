# 🎙️ Telc Speaking Trainer (Arabic)

An AI-powered web application designed to help users practice for the Telc German speaking exam. This application provides a conversational partner that simulates a real exam environment, offers real-time interaction, and delivers a final evaluation with a score and constructive feedback.

The entire user interface is in Arabic to cater to Arabic-speaking learners.

## ✨ Features

- **Realistic Conversation Practice**: Engage in a dynamic conversation with an AI examiner in German.
- **Speech-to-Text**: Utilizes the browser's native Web Speech API to transcribe your spoken German in real-time.
- **Text-to-Speech**: The AI's responses are converted to speech for an immersive auditory experience.
- **Streaming Responses**: The AI's answers are streamed word-by-word for a more natural and engaging chat flow.
- **Instant Final Evaluation**: Once the session is complete, receive a score out of 100 and detailed feedback in Arabic on your performance.
- **Secure & Scalable**: Built with a serverless backend proxy on Vercel to protect API keys and ensure scalability.
- **Responsive Design**: Fully functional on both desktop and mobile devices.

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or later)
- [npm](https://www.npmjs.com/) (or yarn/pnpm)
- A Google Gemini API Key. You can get one from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/telc-speaking-trainer.git
    cd telc-speaking-trainer
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    Create a file named `.env.local` in the root of your project and add your Gemini API key:
    ```
    VITE_GEMINI_API_KEY=YOUR_GEMINI_API_KEY
    ```

4.  **Run the development server:**
    ```sh
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

##  Vercel Deployment Guide

This project is optimized for deployment on [Vercel](https://vercel.com/). The serverless function in the `api/` directory will be automatically deployed.

### Step-by-Step Instructions

1.  **Push your code to a GitHub repository.**
    (If you haven't already, create a new repository on GitHub and push your project files.)

2.  **Import Project on Vercel:**
    - Log in to your Vercel account.
    - Click on "Add New..." -> "Project".
    - Select your GitHub repository and click "Import".

3.  **Configure Project Settings:**
    - Vercel will likely detect that you are using Vite and configure the build settings automatically. They should be:
        - **Framework Preset**: `Vite`
        - **Build Command**: `npm run build` or `vite build`
        - **Output Directory**: `dist`
        - **Install Command**: `npm install`

4.  **Add Environment Variables (Crucial Step):**
    - In your Vercel project dashboard, go to the **Settings** tab.
    - Click on **Environment Variables**.
    - Add the following variable. This is how the serverless function will securely access your API key.

| Variable Name   | Value                 | Description                          |
| --------------- | --------------------- | ------------------------------------ |
| `GEMINI_API_KEY`  | `your_gemini_api_key` | Your secret key for the Gemini API.  |

    **Important**: Do NOT prefix this variable with `VITE_`. Vercel makes server-side environment variables available directly via `process.env`.

5.  **Deploy:**
    - Click the "Deploy" button.
    - Vercel will start the build process. Once complete, your Telc Speaking Trainer will be live on the internet! You can access it via the URL provided by Vercel.

That's it! Your application is now deployed securely and is ready to be used by anyone in the world.
