# Naukri Resume Auto Updater

This project automates the process of updating your resume on Naukri.com to keep your profile active and increase visibility to recruiters. It uses Playwright to simulate browser actions and can be scheduled to run automatically with GitHub Actions.

## Features

-   **Headline Auto-Update**: Rotates between two profile headlines daily based on even/odd dates to keep your profile visibly active.
-   **Auto Job Apply**: Automatically searches and applies to a few relevant jobs based on a keyword.
-   **Automated Login**: Logs into your Naukri account.
-   **Session Management**: Uses cookies to maintain login sessions and reduce the need for frequent logins.
-   **Resume Upload**: Automatically uploads your latest resume.
-   **Activity Simulation**: Simulates user activity to make the profile appear active.
-   **Scheduled Updates**: Uses GitHub Actions to run the update script on a daily schedule.
-   **Notifications**: Sends success or failure notifications to your Telegram.
-   **Error Handling**: Captures a screenshot on failure for easier debugging.

## How It Works

The script performs the following steps:
1.  Launches a headless browser using Playwright.
2.  Loads existing session cookies to try and skip login.
3.  If not logged in, it uses your credentials to log in and saves the new cookies.
4.  Navigates to a few pages to simulate user activity.
5.  Goes to your profile page.
6.  Uploads the resume found in the `resume/` directory.
7.  Sends a notification to your specified Telegram chat to confirm the result.

## Project Structure
```
.
├── .github/workflows/naukri.yml  # GitHub Actions workflow for scheduling
├── src/
│   ├── main.js                   # Main script entry point
│   ├── login.js                  # Handles login logic
│   ├── upload.js                 # Handles resume upload
│   ├── navigation.js             # Manages navigation
│   ├── activity.js               # Simulates user activity
│   ├── notify.js                 # Sends Telegram notifications
│   └── utils.js                  # Helper functions (delay, retry, cookies)
├── resume/
│   └── Resume_AshokKumarVG.pdf                # Your resume file
├── session/
│   └── cookies.json              # Stores session cookies
├── package.json
└── README.md
```

## Setup and Usage

### 1. Fork and Clone the Repository

First, fork this repository to your own GitHub account and then clone it to your local machine.

### 2. Install Dependencies

Make sure you have Node.js installed (v18 or higher is recommended).

```bash
npm install
```
This will install Playwright and other required packages.

### 3. Add Your Resume

Place your resume file inside the `resume/` directory and name it `Resume_AshokKumarVG.pdf`.

### 4. Configure Environment Variables

The script uses environment variables for your credentials and Telegram bot details.

#### For Local Development:

Create a `.env` file in the root of the project:
```
NAUKRI_EMAIL="your-naukri-email@example.com"
NAUKRI_PASSWORD="your-naukri-password"
TELEGRAM_TOKEN="your-telegram-bot-token"
TELEGRAM_CHAT_ID="your-telegram-chat-id"
NAUKRI_HEADLINE_EVEN="Software Engineer with 4+ years of experience in Node.js and React"
NAUKRI_HEADLINE_ODD="Full Stack Developer specialized in JavaScript, Node.js and Cloud Technologies"
JOB_SEARCH_KEYWORD="Java spring boot developer"
```

#### For GitHub Actions:

Do not commit your `.env` file. Instead, configure these as secrets in your forked repository.

1.  Go to your repository's **Settings** > **Secrets and variables** > **Actions**.
2.  Click **New repository secret** for each of the following:
    -   `NAUKRI_EMAIL`
    -   `NAUKRI_PASSWORD`
    -   `TELEGRAM_TOKEN`
    -   `TELEGRAM_CHAT_ID`

To get a Telegram `TOKEN` and `CHAT_ID`, you need to [create a new bot with BotFather](https://core.telegram.org/bots#6-botfather).

### 5. Running the Script

#### Locally

You can run the script manually from your terminal:
```bash
npm start
```

The first time you run it, it will log in and save your session cookies to `session/cookies.json`. Subsequent runs will be faster as they will use these cookies.

#### Automatically with GitHub Actions

The primary goal of this project is automation. The workflow is configured to run daily.

1.  Push your changes to your forked repository.
2.  Enable GitHub Actions in the **Actions** tab of your repository.
3.  The workflow will trigger automatically at the scheduled time (around 7:00 AM IST). You can also run it manually from the Actions tab by selecting the "Naukri Auto Update" workflow and clicking "Run workflow".

If the script fails, a screenshot named `error.png` will be saved as an artifact in the workflow run, which you can download to see what went wrong.

## Disclaimer

This script is for personal educational purposes only. Automating website interactions may be against the terms of service of the website. Use it at your own risk. The author is not responsible for any consequences of using this script.
