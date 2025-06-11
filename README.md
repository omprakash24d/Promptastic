
# Promptastic! - High-Performance Teleprompter

Promptastic! is a modern, feature-rich teleprompter application designed for presenters, content creators, and anyone who needs to deliver scripts smoothly and professionally. Built with Next.js, React, and ShadCN UI, it offers a clean, intuitive interface, real-time customization, and AI-powered enhancements.

[![Promptastic Screenshot](/public/cover_image.png)](#)
*Caption: Homepage of Promptastic*

## ✨ Core Features

*   **📜 Script Management**:
    *   Input, paste, or upload scripts (supports `.txt`, `.md`, `.pdf`, `.docx`).
    *   Save, load, rename, and duplicate scripts.
    *   Script versioning with notes.
    *   AI-powered script summarization.
    *   Export scripts as `.txt`.
*   **🖥️ Teleprompter View**:
    *   Distraction-free, full-screen display.
    *   Smooth, adjustable auto-scrolling.
    *   Rich text support: `**bold**`, `*italic*`, `_underline_`.
    *   Visual cues: `//PAUSE//`, `//EMPHASIZE//` (highlights text), `//SLOWDOWN//`.
*   **⚙️ Real-time Settings**:
    *   Adjust font size, scroll speed, line spacing, horizontal padding.
    *   Choose font family (includes Atkinson Hyperlegible for readability).
    *   Customize text color (respects high-contrast mode).
    *   Adjustable focus line/area (style: line or shaded paragraph, vertical position).
    *   Layout presets and save/load custom settings profiles.
*   **⏯️ Playback Controls**:
    *   Play, pause, resume, and reset scroll.
    *   Manual scroll override when paused.
    *   Click paragraph to set as new start point when paused.
    *   Optional countdown timer before playback starts.
*   **🎨 UI & UX**:
    *   Clean, minimal, and responsive interface.
    *   Collapsible side panels for Scripts and Settings.
    *   Light, Dark, and High-Contrast themes.
    *   Touchscreen and keyboard friendly.
    *   Help panel with usage instructions.
*   **Mirror Mode**: Flip text horizontally for use with physical teleprompter mirrors.
*   **🎤 AI Scroll Sync (Experimental)**:
    *   AI listens to the speaker and attempts to sync scroll speed (currently uses placeholder speech analysis).
*   **🎬 Presentation Mode**: An even more immersive, UI-less fullscreen mode for delivery.
*   **🔒 Authentication**:
    *   Email/Password signup and login.
    *   Google Sign-In.
    *   Password reset functionality.
    *   User profile management (display name, profile picture upload).
*   **☁️ Cloud Sync**:
    *   User scripts and versions are saved to Firestore when logged in.
    *   Anonymous users' scripts are saved locally in the browser.

## 🛠️ Tech Stack

*   **Frontend**: [Next.js](https://nextjs.org/) (App Router), [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/)
*   **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
*   **AI Integration**: [Genkit (by Firebase)](https://firebase.google.com/docs/genkit)
*   **Backend/Database**: [Firebase](https://firebase.google.com/) (Authentication, Firestore, Storage)
*   **File Parsing**: `mammoth` (for .docx), `pdfjs-dist` (for .pdf)
*   **Icons**: [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18.x or later recommended)
*   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Firebase Setup

1.  **Create a Firebase Project**: Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project (or use an existing one).
2.  **Add a Web App**: In your Firebase project settings, add a new Web App and copy the Firebase configuration object.
3.  **Enable Firebase Services**:
    *   **Authentication**: Enable "Email/Password" and "Google" sign-in methods. Set a "Project support email" for Google Sign-In.
    *   **Firestore**: Create a Firestore database in Native mode.
    *   **Storage**: Set up Firebase Storage.
4.  **Environment Variables**:
    *   Create a `.env.local` file in the root of your project.
    *   Add your Firebase configuration details to this file:
        ```env
        NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
        NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
        NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
        ```
    *   The application has fallback values in `src/firebase/config.ts` but using `.env.local` is strongly recommended.
5.  **Security Rules**:
    *   **Firestore**: Secure your data by setting up Firestore security rules. A basic example to allow users to access only their own scripts:
        ```json
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            match /users/{userId}/scripts/{scriptId} {
              allow read, write: if request.auth != null && request.auth.uid == userId;
              match /versions/{versionId} {
                allow read, write: if request.auth != null && request.auth.uid == userId;
              }
            }
          }
        }
        ```
    *   **Storage**: Secure your file uploads (e.g., profile pictures) with Storage security rules:
        ```
        rules_version = '2';
        service firebase.storage {
          match /b/{bucket}/o {
            match /profilePictures/{userId}/{fileName} {
              allow read: if request.auth != null && request.auth.uid == userId;
              allow write: if request.auth != null && request.auth.uid == userId
                           && request.resource.size < 5 * 1024 * 1024 // Max 5MB
                           && request.resource.contentType.matches('image/(jpeg|png|gif|webp)');
            }
          }
        }
        ```
    *   Deploy these rules via the Firebase console or Firebase CLI.

### Installation & Running

1.  **Clone the repository (if applicable) or use within Firebase Studio.**
2.  **Install dependencies**:
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Run the development server for the Next.js app**:
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    The app will usually be available at `http://localhost:9002` (or another port if 9002 is busy).

4.  **Run the Genkit development server (for AI features)**:
    Open a new terminal and run:
    ```bash
    npm run genkit:dev
    # or
    npm run genkit:watch # for auto-reloading on Genkit flow changes
    ```
    This typically starts on `http://localhost:3400`.

## Key Functionalities

### Script Management
Access the Script Manager via the "Scripts" button in the header. Here you can:
*   Create new scripts or edit existing ones in a text area.
*   Save scripts with a name. Logged-in users' scripts sync to Firestore; anonymous users' scripts save to browser local storage.
*   Load saved scripts into the teleprompter.
*   Rename, duplicate, or delete scripts.
*   Import scripts from `.txt`, `.md`, `.pdf`, and `.docx` files.
*   Export the current script as a `.txt` file.
*   Save and load different versions of a script, with optional notes for each version.
*   Generate an AI-powered summary of the current script.

### Teleprompter Controls & Settings
*   **Playback Bar**: Located at the bottom (hidden in Presentation Mode). Controls play/pause, reset, AI Sync toggle, script summary, fullscreen, and presentation mode.
*   **Settings Panel**: Access via the gear icon in the header. Customize:
    *   **Appearance**: Font size, line spacing, font family, text color, horizontal text padding, focus line position and style (line or shaded paragraph), mirror mode, dark/light/high-contrast themes.
    *   **Playback**: Scroll speed, AI scroll sync (enable/disable), countdown timer (enable/disable, duration).
    *   **Layouts & Profiles**: Apply predefined layout presets or save/load your custom combinations of settings as named profiles.
    *   **General**: Reset core settings to defaults.

### Authentication
*   Users can sign up with an email and password, or sign in using Google.
*   Password reset functionality is available.
*   Logged-in users can update their display name and profile picture.

### AI Features
*   **Script Summary**: Get a concise summary of the current script text using Genkit.
*   **AI Scroll Sync (Experimental)**: When enabled in settings and activated via the playback controls, the application will attempt to listen to your speech and adjust the teleprompter scroll speed accordingly. (Note: The speech analysis part is currently a placeholder).

## 🎨 Styling & Theming

*   The application uses Tailwind CSS for utility-first styling.
*   It supports **Light Mode**, **Dark Mode**, and a **High-Contrast Mode** for accessibility. Theme preferences are persisted.
*   The primary color is a calming light blue (`#5DADE2`), with a light grey background (`#F0F4F8`) and a desaturated purple accent (`#A992E2`).
*   The main font is 'Inter', with 'Atkinson Hyperlegible' available as a high-readability option.

## ⌨️ Keyboard Shortcuts

*   **Spacebar / Backspace**: Toggle Play/Pause scrolling (when not focused on an input field).
*   **Esc**: Exit Fullscreen or Presentation mode.
*   **Ctrl+S / Cmd+S**: Save current script (when Script Manager is open and focused).

## 🔮 Known Issues / Future Enhancements

*   **AI Scroll Sync**: The speech analysis component of AI Scroll Sync is currently a placeholder and does not perform actual speech-to-speed calculations. This requires integration with a Speech-to-Text API.
*   **Advanced Rich Text Editing**: While basic markdown and cues are supported, a full WYSIWYG editor for scripts could be a future enhancement.
*   **File Import Robustness**: Further enhance parsing and error handling for imported files, especially complex PDFs or DOCX.
*   **Tags/Folders for Scripts**: Organization features for users with many scripts.
*   **Advanced AI Script Tools**: Grammar checks, tone adjustment, or rephrasing suggestions.
*   **HTML File Import**: Support for importing HTML files with proper sanitization.
*   **Debounce Script Input**: For very large scripts, debounce text area input to improve performance.
*   **Draft Auto-Save**: Periodically auto-save script drafts to local storage for recovery.

## 🤝 Contributing

Contributions are welcome! If you'd like to contribute to Promptastic!, please follow these steps:

1.  **Fork the Repository**: Create your own fork of the project.
2.  **Create a Branch**: Make a new branch for your feature or bug fix (e.g., `feature/new-cool-thing` or `fix/scrolling-issue`).
3.  **Make Your Changes**: Implement your changes and test them thoroughly.
4.  **Commit Your Changes**: Write clear and concise commit messages.
5.  **Push to Your Fork**: Push your changes to your forked repository.
6.  **Submit a Pull Request**: Open a pull request to the main repository, describing your changes and why they should be merged.

Please ensure your code adheres to the project's coding style and guidelines.

## 📜 License

This project is licensed under the **MIT License**.

See the [LICENSE](LICENSE.md) file for more details. (You would typically create a LICENSE.md file with the MIT license text).

## ©️ Copyright

Copyright (c) 2025 Om Prakash. All Rights Reserved.


## 🙏 Acknowledgements

*   Thanks to the creators of Next.js, React, ShadCN UI, Tailwind CSS, Firebase, and Genkit for their amazing tools.
*   Inspiration from various teleprompter applications and presentation tools.
*   Community contributions and feedback.

---