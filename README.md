# Naukri.com AI-Powered Automation

This project automates the process of keeping your Naukri.com profile active and intelligently applies to jobs using AI. It leverages Playwright for robust browser automation and Groq's Llama 3 model to answer recruiter questions based on your detailed professional profile.

## Key Features

-   **AI-Powered Job Applications**: Automatically answers chatbot questionnaires during the application process using an AI model configured with your professional details.
-   **Multi-API Key Support**: Cycles through a list of Groq API keys to handle rate limits gracefully.
-   **Auto Job Search & Apply**: Searches for jobs based on a specified keyword and applies to them.
-   **Company Blocklist**: Maintains a `blocklist.js` to prevent applying to specified companies.
-   **Daily Profile Refresh**:
    -   **Resume Upload**: Automatically re-uploads your resume to mark your profile as "updated."
    -   **Headline Update**: Alternates your profile headline daily to increase visibility.
-   **Stealth & Session Management**: Uses `playwright-extra` with a stealth plugin to avoid bot detection and saves session cookies to minimize logins.
-   **Local Scheduling**: Designed to be run on a daily schedule using your local machine's task scheduler (e.g., Windows Task Scheduler).
-   **Telegram Notifications**: Sends a notification with a summary of the run's success or failure.

## How It Works

1.  **Launch**: The script starts a browser using Playwright with stealth settings.
2.  **Login**: It loads existing session cookies or logs in with your credentials if needed.
3.  **Profile Update**: It navigates to your profile, updates your headline, and re-uploads your resume.
4.  **Job Search**: It searches for jobs using the `JOB_SEARCH_KEYWORD` from your `.env` file.
5.  **Auto-Apply**: It iterates through the search results and applies to jobs, avoiding companies in the `blocklist.js`.
6.  **AI Questionnaire Handling**: If a job application presents a chatbot questionnaire, the script uses Groq's AI and the context from `my_profile.txt` to answer the questions.
7.  **Notify**: Finally, it sends a summary of its activity (e.g., number of jobs applied to) to your specified Telegram chat.

## Project Structure
```
.
├── .github/workflows/           # Contains the (now deprecated) GitHub Actions workflow
├── node_modules/                # Node.js dependencies
├── resume/
│   └── Your_Resume.pdf          # Your resume file
├── session/
│   └── cookies.json             # Stores session cookies to avoid frequent logins
├── src/
│   ├── AI/
│   │   └── groq.js              # Handles AI content generation via Groq API
│   ├── activity.js              # Simulates human-like mouse movements
│   ├── apply.js                 # The core logic for auto-applying to jobs and handling questionnaires
│   ├── blocklist.js             # A list of company names to skip during auto-apply
│   ├── headline.js              # Logic for updating the profile headline
│   ├── login.js                 # Handles the login process
│   ├── main.js                  # The main entry point of the script
│   ├── navigation.js            # Helper functions for navigating the site
│   ├── notify.js                # Logic for sending Telegram notifications
│   └── upload.js                # Handles the resume upload process
├── .env                         # Your local environment variables (credentials, keys)
├── .gitignore
├── my_profile.txt               # The "brain" for the AI, containing your professional details
├── package-lock.json
├── package.json
├── README.md
└── review_queue.txt             # Logs job URLs that failed during the questionnaire phase for manual review
├── run.bat                      # The runner script for Windows Task Scheduler
└── run_hidden.vbs               # VBScript to run the .bat file silently in the background
```

---

## Setup and Configuration

### 1. Fork and Clone the Repository

First, fork this repository to your own GitHub account, then clone it to your local machine.

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Your Profile and Resume

1.  **Add Your Resume**: Place your resume file (e.g., `My_Resume.pdf`) inside the `resume/` directory.
2.  **Update `main.js`**: Open `src/main.js` and update the `RESUME_PATH` variable to point to your resume file.
3.  **Crucial: Configure `my_profile.txt`**: This file is the "brain" for the AI. The more detailed it is, the better the AI will perform. Open `my_profile.txt` and fill out each section carefully.

    -   **Specific Q&A**: For direct questions like notice period, CTC, etc.
    -   **Behavioral Q&A**: For "tell me about a time..." style questions.
    -   **Skill Experience Breakdown**: List your skills and years of experience (e.g., `- Java: 3.5 years`). Use specific numbers, not `3+`.
    -   **Tools and Technologies**: List all the tools you use (e.g., `- IDEs: IntelliJ IDEA, VS Code`). This is critical for answering "Do you know Postman?" type questions.

### 4. Set Up Environment Variables

Create a `.env` file in the root of the project. This file stores your sensitive credentials and configuration.

```env
#-------------------
# NAUKRI CREDENTIALS
#-------------------
NAUKRI_EMAIL="your-naukri-email@example.com"
NAUKRI_PASSWORD="your-naukri-password"

#-------------------
# JOB SEARCH & PROFILE
#-------------------
# The keyword to search for jobs (e.g., "Java Backend Developer")
JOB_SEARCH_KEYWORD="Java spring boot developer"

# The base headline for your profile. A period will be added on odd days.
NAUKRI_HEADLINE="Full Stack Developer | Java | Spring Boot | Microservices | React"

#-------------------
# AI CONFIGURATION (GROQ)
#-------------------
# Add one or more Groq API keys, separated by commas.
# The script will cycle through them to avoid rate limits.
# Get keys from: https://console.groq.com/keys
GROQ_API_KEYS="gsk_key_1,gsk_key_2,gsk_key_3"

#-------------------
# TELEGRAM NOTIFICATIONS
#-------------------
# Your Telegram Bot Token from BotFather
TELEGRAM_TOKEN="your-telegram-bot-token"
# Your personal Chat ID
TELEGRAM_CHAT_ID="your-telegram-chat-id"
```

---

## Running the Script

### Running Manually

To run the script on your local machine for testing or a one-time execution:

```bash
npm start
```

### Scheduling Automation (Recommended Method)

Running the automation from a cloud service like GitHub Actions is **not recommended**, as Naukri.com often detects and blocks traffic from data center IP addresses, resulting in a `403 Forbidden` error.

The most reliable way to automate this script is to schedule it to run on your local machine.

#### On Windows (using Task Scheduler)

1.  **Create a Runner Script**: In the root of your project, create a new file named `run.bat` and add the following lines. This script will navigate to your project directory and run the automation.

    ```batch
    @echo off
    cd /d "C:\path\to\your\naukri-auto-update-resume"
    npm start
    ```
    *Replace `C:\path\to\your\naukri-auto-update-resume` with the actual path to your project folder.*

2.  **Open Task Scheduler**: Press `Win + R`, type `taskschd.msc`, and press Enter.

3.  **Create a New Task**:
    -   In the right-hand pane, click **Create Basic Task...**.
    -   **Name**: Give it a name like "Naukri Daily Update".
    -   **Trigger**: Choose **Daily** and set a time when your computer will be on (e.g., 10:00 AM).
    -   **Action**: Select **Start a program**.
    -   **Program/script**: To run the script silently in the background, browse to and select the `run_hidden.vbs` file. If you want to see the command window during execution, select the `run.bat` file instead.
    -   Click **Finish**.

4.  **Configure Power Settings**:
    -   Find your new task in the Task Scheduler Library, right-click it, and select **Properties**.
    -   Go to the **Conditions** tab.
    -   Uncheck the box that says "Start the task only if the computer is on AC power." This ensures it runs even if you're on a laptop's battery.
    -   Click **OK**.

The script will now run automatically on your local machine every day at the scheduled time.

## Disclaimer

This script is intended for personal educational purposes. Automating interactions with a website may be against its terms of service. Use this tool responsibly and at your own risk.
