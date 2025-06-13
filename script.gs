// === Google Apps Script: Auto-Categorize Calendar Files to Shared Drive ===
// This script searches Google Drive for files related to a specific calendar event keyword
// and automatically copies and renames them into a date-named folder inside a Shared Drive.
// It also posts a Slack message summarizing the operation.

const SHARED_DRIVE_ID = "<YOUR_SHARED_DRIVE_ID>"; // Replace with your Shared Drive ID
const SLACK_WEBHOOK_URL = "<YOUR_SLACK_WEBHOOK_URL>"; // Replace with your Slack webhook URL
const EVENT_KEYWORD = "Event Placeholder"; // Keyword to identify event-related files (e.g., "Tea Reading")
const DATE_STRING = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy/MM/dd");
const DESTINATION_FOLDER_NAME = DATE_STRING.replaceAll("/", "-");

function autoOrganizeCalendarFiles() {
  const log = (msg) => console.info(msg);
  log(`Script started at: ${new Date()}`);

  // Search for files in My Drive that match the keyword and current date
  log(`Looking for files with keyword "${EVENT_KEYWORD}" and date "${DATE_STRING}"`);
  const files = DriveApp.getFilesByNameContains(EVENT_KEYWORD);
  const todayFiles = [];

  while (files.hasNext()) {
    const file = files.next();
    const name = file.getName();
    if (name.includes(DATE_STRING)) {
      todayFiles.push(file);
    }
  }

  // Create or get the destination folder in Shared Drive
  const destFolder = getOrCreateFolderInSharedDrive(SHARED_DRIVE_ID, DESTINATION_FOLDER_NAME);
  const renamedFiles = [];
  let skipped = 0;

  for (const file of todayFiles) {
    const name = file.getName();
    log(`Checking file: ${name}`);

    // Determine if file is a Notes or Recording type
    const isNotes = name.toLowerCase().includes("notes");
    const isRecording = name.toLowerCase().includes("recording");
    const fileType = isNotes ? "Notes" : isRecording ? "Recording" : null;

    if (!fileType) {
      log(`⏭️ Skipped: ${name}`);
      skipped++;
      continue;
    }

    // Extract date from filename using regex (normalizing format)
    const dateMatch = name.match(/\d{4}\/\d{2}\/\d{2}/);
    const normalizedDate = dateMatch ? dateMatch[0].replaceAll("/", "-") : DESTINATION_FOLDER_NAME;

    const newTitle = `${EVENT_KEYWORD} – ${normalizedDate} – ${fileType}`;
    const mimeType = file.getMimeType();

    const copiedFile = file.makeCopy(newTitle, destFolder);
    log(`📎 Copied file MIME: ${mimeType}`);

    // Attempt to rename Docs separately via API for Docs files (since makeCopy does not update title bar)
    if (mimeType === MimeType.GOOGLE_DOCS) {
      try {
        Drive.Files.patch({ title: newTitle }, copiedFile.getId());
      } catch (e) {
        log(`⚠️ Could not patch Docs API title: ${e.message}`);
      }
    }

    log(`✅ Copied and renamed: ${newTitle}`);
    renamedFiles.push(newTitle);
  }

  // Post summary to Slack
  const message = `📁 ${EVENT_KEYWORD} File Copy @ ${new Date().toLocaleTimeString()}
• Copied: ${renamedFiles.length} file(s)
` + renamedFiles.map(f => `\t• ${f}`).join("\n") + `
• Skipped: ${skipped}\n\n✅ No errors`;
  postToSlack(message);
}

function getOrCreateFolderInSharedDrive(driveId, folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  while (folders.hasNext()) {
    const f = folders.next();
    if (f.getParents().hasNext() && f.getParents().next().getId() === driveId) {
      return f;
    }
  }
  // If not found, create it
  const resource = {
    title: folderName,
    mimeType: MimeType.FOLDER,
    parents: [{ id: driveId }]
  };
  const newFolder = Drive.Files.insert(resource);
  return DriveApp.getFolderById(newFolder.id);
}

function postToSlack(message) {
  const payload = JSON.stringify({ text: message });
  UrlFetchApp.fetch(SLACK_WEBHOOK_URL, {
    method: "post",
    contentType: "application/json",
    payload
  });
}

// Required for Advanced Drive Service:
// 1. In the Apps Script project: Resources > Advanced Google Services > Enable "Drive API"
// 2. In Google Cloud Console: Enable "Google Drive API" for your project
