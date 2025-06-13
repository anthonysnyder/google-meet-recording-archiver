# Google Drive Meeting Archiver

This Google Apps Script automates the organization of Google Meet recordings and AI-generated meeting notes (e.g., from Gemini) by:

- Renaming files using a consistent format (`Event Placeholder – YYYY-MM-DD – Notes` or `– Recording`)
- Copying them into a corresponding date-named folder inside a Shared Drive
- Sending a Slack notification with details about what was moved

---

## 🔧 Features

- ✅ Automatically processes files from your Google Drive  
- 📁 Sorts by event date into Shared Drive folders  
- 📝 Renames based on event name and file type  
- 📣 Sends Slack notifications with a summary report and clickable folder link

---

## 🛠 Requirements

1. A [Google Workspace](https://workspace.google.com/) account with:
   - Access to Google Apps Script  
   - Access to the Shared Drive where files should be archived  
2. A [Slack Incoming Webhook](https://api.slack.com/messaging/webhooks)  
3. Basic familiarity with the Google Apps Script editor  

---

## 🚀 Setup Instructions

### 1. Create the Script

1. Visit [script.new](https://script.new)  
2. Paste the contents of [`script.gs`](./script.gs) into the editor  
3. Name your project, e.g., `Meeting Archiver`  

### 2. Enable Advanced Drive API

1. Click the puzzle piece icon labeled **"+ Services"** in the left sidebar  
2. Add **"Drive API"** (not `DriveApp`, this is the advanced one)  

### 3. Set Your Configuration

At the top of the script, replace these constants:

```javascript
const SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/XXX/YYY/ZZZ";
const SHARED_DRIVE_ID = "YOUR_SHARED_DRIVE_ID";
const EVENT_KEYWORD = "Event Placeholder"; // Customize to match the event you're tracking
```
To get your Shared Drive ID:  
- Open the Shared Drive in Google Drive  
- Copy the long string after `/folders/` in the URL  
---

### 4. Set Up a Time-Based Trigger

1. In the Apps Script editor, click the clock icon on the left (**“Triggers”**)  
2. Click **“+ Add Trigger”**  
3. Set it up like this:  
   - **Function to run**: `moveAndRenameFiles`  
   - **Event source**: Time-driven  
   - **Type of time-based trigger**: Day timer / Hour timer, etc.  
   - Choose a time when your Meet recordings will have finished processing (e.g. 10:00 AM)  

---

### 5. Authorize the Script

The first time you run it, Apps Script will ask for authorization:  
- Review the scopes requested  
- Click **Allow**  

---

## ✅ Slack Message Output

Example message your Slack channel will receive:
```Notes and Recording moved @ 10:00 AM  
Copied: 2 file(s) to [2025-06-13](https://drive.google.com/drive/folders/123ABC456DEF)  
• Event Placeholder – 2025–06–13 – Notes → 2025–06–13  
• Event Placeholder – 2025–06–13 – Recording → 2025–06–13
```
---

## 📎 Notes

- The script checks file names for both the event keyword and the current date (e.g., `2025/06/13`)
- It uses `DriveApp.getFiles()` to scan all files in your Drive — you can narrow this if needed
- Files are **copied** (not moved) into the Shared Drive — originals remain in place
- Slack notifications include a clickable link to the Shared Drive folder

---

## 📄 License

MIT License

---

## 🙋‍♀️ Questions or Contributions?

Feel free to submit issues or pull requests if you’d like to add support for multiple event types, date lookback, or folder scoping!
