# 🤝 SignBridge - Chrome Web Store Submission & Publishing Guide

> Single source of truth for Chrome Web Store listing metadata, permissions justifications, privacy disclosures, and publishing readiness.

---

## 📌 Extension Details

- **Name**: SignBridge - Live Meeting Interpreter
- **Version**: 1.1.0
- **Category**: Accessibility
- **Default Language**: English
- **Target Audience**: Deaf & hard-of-hearing individuals, sign language interpreters, remote teams, educators.

---

## 📝 Store Listing Copy

### Summary Description (132 characters max):
Real-time AI sign language interpretation overlay for Google Meet, Zoom, MS Teams, Webex, and Jitsi video calls.

### Detailed Description:
SignBridge brings real-time AI sign language interpretation directly to your browser during video calls. Whether you are on **Google Meet**, **Zoom**, **Microsoft Teams**, **Webex**, or **Jitsi Meet**, SignBridge interprets sign language gestures into live text captions and natural spoken sentences.

#### KEY FEATURES:
• **Multi-Platform Support**: Works seamlessly on Google Meet, Zoom Web, MS Teams, Webex, Jitsi Meet, and custom web video calls.
• **Real-Time Hand Landmark Detection**: Powered by MediaPipe Vision running 100% locally in your browser.
• **AI Sentence Reconstruction**: Automatically transforms signed word sequences into natural, grammatically correct sentences.
• **Text-to-Speech (TTS) Voice Engine**: Reads interpreted sentences out loud during video meetings.
• **Bidirectional Hearing Mode**: Converts incoming speaker audio into live text captions for Deaf participants.
• **Draggable & Minimizable Overlay**: Position captions anywhere without obstructing meeting controls or participant videos.
• **Privacy-First**: No camera feeds or video frames are ever recorded or sent to external servers.

---

## 🔒 Permissions Justification

| Permission | Reason for Review Team |
|---|---|
| `activeTab` | Required to inject the sign language caption overlay into the active video call tab when toggled on by the user. |
| `storage` | Required to persist user preferences locally (such as confidence meter toggles and TTS audio preferences). |
| `tabs` | Required to detect when the user is currently on a supported video conferencing domain (e.g. Google Meet, Zoom, Teams). |
| `<all_urls>` | Required so users can utilize live sign language interpretation on custom or enterprise WebRTC video conferencing portals. |

---

## 🛡️ Privacy & Security Disclosures

- **Data Collection**: None. SignBridge does not collect, track, or transmit any personally identifiable information (PII).
- **Video Feed Processing**: All MediaPipe hand landmark detection and gesture classification execute locally in client memory.
- **Third-Party Services**: Optional local AI sentence reconstruction proxies requests through user-configured backend. No video frames leave the machine.

---

## 📅 Version History

- **v1.1.0** (Current):
  - Multi-platform support added for Google Meet, Zoom, MS Teams, Webex, and Jitsi Meet.
  - MediaPipe Vision library bundled locally for zero-latency, offline-capable execution.
  - Added Text-to-Speech (TTS) engine and Speech-to-Text Hearing Mode.
  - Redesigned glassmorphic floating UI with drag controls and platform badges.
- **v1.0.0**: Initial MVP for Google Meet.
