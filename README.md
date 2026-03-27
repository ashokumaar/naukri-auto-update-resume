# Naukri Resume Auto Updater

This project automates the process of updating your resume on Naukri.com to keep your profile active and increase visibility to recruiters. It uses Playwright to simulate browser actions, integrates AI for intelligent job applications, and can be scheduled to run automatically with GitHub Actions.

## Features

-   **AI-Powered Applications**: Uses AI models from Groq (Llama 3.3) and Google (Gemini 2.0 Flash) to intelligently answer open-ended application questions.
-   **Auto Job Apply**: Automatically searches and applies to relevant jobs based on a keyword.
-   **Company Blocklist**: Avoids applying to specified companies using a blocklist.
-   **Headline Auto-Update**: (Optional) Rotates between two profile headlines daily.
-   **Automated Login**: Logs into your Naukri account and manages sessions.
-   **Resume Upload**: (Optional) Automatically uploads your latest resume.
-   **Activity Simulation**: Simulates user activity to appear active.
-   **Scheduled Updates**: Uses GitHub Actions to run the script on a daily schedule.
-   **Notifications**: Sends success or failure notifications to your Telegram.
-   **Stealth Mode**: Uses `playwright-extra` with a stealth plugin to avoid bot detection.

## How It Works

1.  Launches a browser using Playwright with stealth settings.
2.  Loads existing session cookies to skip login if possible.
3.  If not logged in, it uses your credentials to log in and saves the new cookies.
4.  Simulates user activity on the homepage.
5.  Navigates to the profile page.
6.  (Optional) Updates your profile headline and uploads your resume.
7.  Searches for jobs using a specified keyword.
8.  Applies to jobs, using AI (Groq/Gemini) and `my_profile.txt` for application questions, while avoiding companies in the blocklist.
9.  Sends a notification to your Telegram chat to confirm the result.

## Project Structure
```
.
├── .github/workflows/naukri.yml  # GitHub Actions workflow for scheduling
├── src/
│   ├── AI/
│   │   ├── groq.js               # Handles AI content generation via Groq API
│   │   └── gemini.js             # Handles AI content generation via Gemini API
│   ├── main.js                   # Main script entry point
│   ├── login.js                  # Handles login logic
│   ├── apply.js                  # Handles the job application process
│   ├── headline.js               # Updates the profile headline
│   ├── upload.js                 # Handles resume upload
│   ├── navigation.js             # Manages page navigation
│   ├── activity.js               # Simulates user activity
│   ├── blocklist.js              # Contains companies to avoid
│   ├── notify.js                 # Sends Telegram notifications
│   └── utils.js                  # Helper functions
├── resume/
│   └── Your_Resume.pdf           # Your resume file
├── session/
│   └── cookies.json              # Stores session cookies
├── my_profile.txt                # Your professional summary for AI context
├── package.json
└── README.md
```

## Setup and Usage

### 1. Fork and Clone the Repository

First, fork this repository to your own GitHub account and then clone it to your local machine.

### 2. Install Dependencies
```bash
npm install
```

### 3. Add Your Resume and Profile Summary

-   Place your resume file inside the `resume/` directory.
-   Update `my_profile.txt` with a professional summary to be used as context for the AI.

### 4. Configure Environment Variables

#### For Local Development:

Create a `.env` file in the root of the project:
```
# Naukri Credentials
NAUKRI_EMAIL="your-naukri-email@example.com"
NAUKRI_PASSWORD="your-naukri-password"

# Job Search
JOB_SEARCH_KEYWORD="Java spring boot developer"

# AI API Keys (at least one is required for the apply feature)
GROQ_API_KEY="your-groq-api-key"
GEMINI_API_KEY="your-gemini-api-key"

# Telegram Notifications
TELEGRAM_TOKEN="your-telegram-bot-token"
TELEGRAM_CHAT_ID="your-telegram-chat-id"

# Optional Headlines
# NAUKRI_HEADLINE_EVEN="Software Engineer with 4+ years of experience"
# NAUKRI_HEADLINE_ODD="Full Stack Developer specialized in JavaScript and Cloud"
```

#### For GitHub Actions:

Configure these as secrets in your forked repository's **Settings > Secrets and variables > Actions**.
-   `NAUKRI_EMAIL`
-   `NAUKRI_PASSWORD`
-   `JOB_SEARCH_KEYWORD`
-   `GROQ_API_KEY`
-   `GEMINI_API_KEY`
-   `TELEGRAM_TOKEN`
-   `TELEGRAM_CHAT_ID`
-   (Optional) `NAUKRI_HEADLINE_EVEN`
-   (Optional) `NAUKRI_HEADLINE_ODD`

### 5. Running the Script

#### Locally
```bash
npm start
```

#### Automatically with GitHub Actions

The workflow is configured to run daily. Enable GitHub Actions in the **Actions** tab of your repository and push your changes.

## Disclaimer

This script is for personal educational purposes only. Automating website interactions may be against the terms of service of the website. Use it at your own risk.
