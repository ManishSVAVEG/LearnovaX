# LearnovaX - Complete Setup Guide

A free, AI-powered learning platform for students worldwide.
**No subscription, no costs, no feature locking.**

## 🎓 What is LearnovaX?

LearnovaX is your personal AI tutor that helps you:

- Generate comprehensive study notes with structured formatting
- Create multiple types of summaries (8 different modes)
- Generate and take AI-graded exams with instant feedback
- Chat with AI for concept clarification and explanations
- Track your performance with detailed analytics
- Plan your study schedule with reminders
- Unlock 100+ achievements through gamification
- Access everything offline with offline support

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (Download from [nodejs.org](https://nodejs.org))
- npm or yarn (comes with Node.js)
- Expo CLI (installed automatically via npm)
- An AI API Key from any supported provider (all 100% free tiers available)

### Supported AI Providers (All Free)

1. **OpenAI** - [Get Free API Key](https://platform.openai.com/api-keys)
   - Models: GPT-4o, GPT-4o Mini, GPT-4, etc.

2. **Google Gemini** - [Get Free API Key](https://makersuite.google.com/app/apikey)
   - Models: Gemini 1.5 Pro, Gemini 1.5 Flash, etc.

3. **Groq** - [Get Free API Key](https://console.groq.com)
   - Models: Llama 3, Mixtral, etc. (Ultra-fast inference)

4. **Anthropic Claude** - [Get Free API Key](https://console.anthropic.com)
   - Models: Claude 3.5 Sonnet, Claude 3 Opus, etc.

### Installation & Setup

```bash
# 1. Clone or download the project
cd LearnovaX

# 2. Install dependencies
npm install
# or
yarn install

# 3. Start the Expo development server
npm run expo:dev
# or
npx expo start

# 4. Scan the QR code with Expo Go App or press 'w' for web preview
```

## 📱 Using the App

### First Time Setup

1. **Onboarding**: Select your:
   - Country
   - Education Board (CBSE, IB, Cambridge, etc.)
   - Grade/Class
   - Subjects

2. **AI Provider Setup**:
   - Choose your preferred AI provider
   - Paste your API key (encrypted locally, never sent to servers)
   - Select the model you want to use
   - Validate the key

3. **Start Learning!**

## ✨ Features

### 1. Study Notes Generator

- Input: Topic name
- Choose difficulty, length, and tone
- Generates: Structured notes with:
  - Key definitions
  - Core concepts
  - Examples
  - Exam tips
  - Quick recap sections
- Save to library or export as PDF

### 2. Summary Generator (8 Types)

Generate summaries in multiple formats:

1. **Ultra Quick Revision** - Top 5 facts only
2. **Exam-Oriented** - Focus on exam questions
3. **Concept Breakdown** - Step-by-step understanding
4. **Weakness-Based** - Remediation for weak topics
5. **Crash Sheet** - One-page essentials
6. **Formula Extraction** - All formulas & equations
7. **Definition Mode** - Glossary of key terms
8. **Memory Trigger** - Mnemonics & memory aids

### 3. AI Exam Generator

- Set: Subject, topic, total marks, number of questions, difficulty, timer
- AI generates: Exam paper with custom mark distribution
- Take exam: Full-screen interface with countdown timer
- Auto-grade: AI evaluates answers and shows:
  - Score breakdown by question
  - Per-topic accuracy
  - Weak topic identification
  - Explanation for each answer

### 4. AI Study Assistant Chat

- Ask any academic question
- Upload images of problems
- Share YouTube links for explanations
- Get step-by-step solutions
- Chat history: Saved for reference
- Markdown support: Formatted answers

### 5. Analytics Dashboard

- Weekly activity chart: See your study patterns
- Accuracy trends: Track improvement over time
- Subject performance: Which subjects need work
- Study recommendations: Personalized suggestions
- Study time: Total hours invested

### 6. Study Scheduler

- Schedule study sessions for specific subjects
- Set frequency and duration
- Get push notifications as reminders
- Track completion rate
- Build study streaks

### 7. Personal Library

- Save: Notes, summaries, exam results
- Organize: By subject
- Search: Find content quickly
- Offline access: Read saved content anytime
- Export: As PDF or text

### 8. Achievement System (100 Badges)

Unlock badges for:

- API keys encrypted locally - Never sent to our servers
- No backend required - Everything works peer-to-peer
- No data harvesting - Your study data stays on your device
- Open source ready - Code is transparent
- GDPR compliant - Your privacy first

## 📊 Technical Stack

- Framework: React Native + Expo
- Language: TypeScript
- UI Library: Jetpack Compose (expo-linear-gradient, expo-blur)
- State Management: Context API + React Query
- Storage: AsyncStorage + Secure encryption
- API Integration: Multi-provider support
- Stylingliant** - Your privacy first

## 📊 Technical Stack

- **Framework**: React Native + Expo
- **Language**: TypeScript
- **UI Library**: Jetpack Compose (expo-linear-gradient, expo-blur)
- **State Management**: Context API + React Query
- **Storage**: AsyncStorage + Secure encryption
- **API Integration**: Multi-provider support
- **Styling**: Dark theme, glassmorphism UI

## 🛠 Advanced Setup (Production Build)

### Build for Android

```bash
# Create a production build
npm run expo:static:build

# Generate APK
eas build --platform android --distribution apk
```

### Build for iOS

```bash
# Create iOS build
eas build --platform ios
```

### Environment Variables

Create a `.env.local` file:
```
EXPO_PUBLIC_DOMAIN=your-domain.com
REACT_NATIVE_PACKAGER_HOSTNAME=localhost
```

## 💻 Development Server

```bash
# Start dev server
npm run expo:dev

# Server (Node.js backend - for future features)
npm run server:dev

# Lint check
npm run lint

# Fix linting issues
npm run lint:fix
```

## 📚 API Provider Configuration

### OpenAI

- API Key starts with: `sk-`
- Free tier: $5 credit
- Models: GPT-4o (recommended for study)

### Google Gemini

- API Key starts with: `AIza...`
- Free tier: 60 requests/minute
- Models: Gemini 1.5 Pro (best reasoning)

### Groq

- API Key starts with: `gsk_`
- Free tier: UNLIMITED
- Models: Llama 3.3 70B (fastest)

### Anthropic Claude

- API Key starts with: `sk-ant-...`
- Free tier: $5 credit
- Models: Claude 3.5 Sonnet (most accurate)
  # App navigation & screens
│   ├── (tabs)/              # Main tab screens
│   ├── index.tsx            # Splash screen
│   ├── onboarding.tsx       # Setup wizard
│   ├── api-setup.tsx        # API configuration
│   └── ...
├── components/              # Reusable UI components
├── constants/               # App constants (colors, badges)
├── contexts/                # React context (global state)
├── lib/                     # Utility libraries
│   ├── ai.ts               # AI provider integration
│   ├── storage.ts          # Local storage
│   ├── encryption.ts       # Security utilities
│   ├── offline.ts          # Offline support
│   ├── analytics.ts        # Analytics calculations
│   ├── validation.ts       # Data validation
│   └── ...
├── server/                  # Node.js backend (optional)
└── package.json             # React context (global state)
├── lib/                   # Utility libraries
│   ├── ai.ts             # AI provider integration
│   ├── storage.ts        # Local storage
│   ├── encryption.ts     # Security utilities
│   ├── offline.ts        # Offline support

- Copy the exact key (no spaces)
- Check if it's a test key (won't work)
- Verify API is enabled in provider's console
- Check rate limits haven't been exceeded

### App Crashes?

- Clear app cache: Settings → App → Clear Cache
- Reinstall app
- Check internet connection
- Update Expo Go app

### Slow Responses?

- Try Groq (fastest AI, free)
- Check internet connection
- Switch to faster model (e.g., Mini, Flash)
- Reduce output length

### Storage Full?

- Check internet connection
- Update Expo Go app

### Slow Responses?
- Try Groq (fastest AI, free)
- Check internet connection
- Switch to faster model (e.g., Mini, Flash)
- Reduce output length

### Storage Full?
- App → Clear Cache
- Delete old exam results from library
- Move notes to cloud backup (export as PDF)

## 🤝 Contributing

## 🤝 Contributing

We welcome contributions!

- Found a bug? Open an issue
- Have an idea? Create a discussion
- Want to improve it? Submit a PR

## 📝 License

LearnovaX is **free and open-source**.

## 🎯 Roadmap

- [ ] Backend sync (cloud backup)
- [ ] Collaborative study groups
- [ ] Video explanations integration
- [ ] Advanced analytics with ML
- [ ] Offline PDF download support
- [ ] Voice input for questions
- [ ] Teacher dashboard
- [ ] Global leaderboards

## 💬 Support

- GitHub Issues: For bugs and features
- Discussions: For questions and ideas
- Email: support (at) LearnovaX (dot) app (coming soon)

---

## Final Notes

Happy Studying! 🎓

Built with ❤️ for students everywhere. No ads. No costs. Just learning.
