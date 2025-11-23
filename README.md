# 🚻 HOSICOCO - Smart Public Toilet Map

**Bản đồ vệ sinh công cộng thông minh cho Việt Nam**

*Minh bạch - Tiện lợi - Văn minh - Sạch sẽ*

---

## 🎯 Project Overview

Hosicoco is a Progressive Web App (PWA) that helps people find and review public toilets in Vietnam. Built with Next.js 14, TypeScript, and Firebase, it provides a community-driven platform to improve public hygiene infrastructure.

## 🛠 Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS + Custom Design System
- **Map:** Mapbox GL JS
- **Backend:** Firebase (Auth, Firestore, Storage, Hosting)
- **State Management:** Zustand
- **Animations:** Framer Motion
- **Validation:** Zod

## 📦 Project Structure

```
/src
  /app                 # Next.js App Router pages
  /components
    /ui                # Reusable UI components (Buttons, Inputs)
    /features          # Feature-specific components (Map, Review, Report)
    /layout            # Layout components (Header, Footer)
  /lib
    /firebase          # Firebase initialization & helpers
    /utils             # Utility functions
    /constants         # Static configuration
  /hooks               # Custom React Hooks
  /types               # TypeScript type definitions
  /services            # API service layer
  /styles              # Global CSS
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project (create at [firebase.google.com](https://firebase.google.com))
- Mapbox account (get token at [mapbox.com](https://www.mapbox.com))

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd hosicoco
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` and add your Firebase and Mapbox credentials.

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

## 🎨 Design System

The project follows a strict design system defined in `PROJECT_MANIFEST.md`:

### Color Palette

- **Primary:** `#00B4D8` (Action buttons, active states)
- **Secondary:** `#48CAE4` (Hover states, highlights)
- **Deep Blue:** `#03045E` (Headings, main text)
- **Navy:** `#023E8A` (Sub-headings)
- **Status Colors:**
  - Clean: `#2ECC71`
  - Okay: `#F1C40F`
  - Dirty: `#E74C3C`

### Typography

- **Body Font:** Inter / Be Vietnam Pro
- **Heading Font:** Nunito

## 🔒 Security Standards

All code must follow security best practices:

- ✅ Firestore Security Rules (deny by default)
- ✅ Input validation with Zod
- ✅ XSS protection (sanitize user content)
- ✅ No hardcoded API keys (environment variables only)
- ✅ GDPR/Privacy compliance

## 📝 Development Guidelines

### Code Style

- Use **Clean Code** principles
- Meaningful variable/function names
- Comment "why", not "what"
- Follow **Conventional Commits** (e.g., `feat: add map markers`)

### TypeScript

- Strict mode enabled
- No `any` types (use proper typing)
- Leverage path aliases (`@/components`, `@/lib`)

### Error Handling

- Always wrap async/await in try/catch
- Show user-friendly error messages (Toast notifications)
- Never expose internal errors to users

## 📚 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 🤝 Contributing

Contributions are welcome! Please read the `PROJECT_MANIFEST.md` for detailed requirements before submitting PRs.

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

Built with 💙 for the people of Vietnam.

---

**Note:** This README is generated as part of the project initialization. For detailed technical specifications, see `PROJECT_MANIFEST.md`.
# hosicoco
