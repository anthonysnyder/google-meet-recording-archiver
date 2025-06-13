// === Google Apps Script: Auto-Categorize Calendar Files to Shared Drive ===
// This script searches Google Drive for files related to a specific calendar event keyword
// and automatically copies and renames them into a date-named folder inside a Shared Drive.
// It also posts a Slack message summarizing the operation.

const SHARED_DRIVE_ID = "<YOUR_SHARED_DRIVE_ID>"; // Replace with your Shared Drive ID
const SLACK_WEBHOOK_URL = "<YOUR_SLACK_WEBHOOK_URL>"; // Replace with your Slack webhook URL
const EVENT_KEYWORD = "Event Placeholder"; // Keyword to identify event-related files (e.g., "Tea Reading")

function autoOrganizeCalendarFiles() {
  const dateToFind = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy/MM/dd");
  const normalizedDate = dateToFind.replaceAll("/", "-");

  console.log(`Script started at: ${new Date()}`);
  console.log(`Looking for files with keyword "${EVENT_KEYWORD}" and date "${dateToFind}"`);

  const files = DriveApp.getFiles();
  const renamedFiles = [];

  const targetFolder = getOrCreateFolderInSharedDrive(SHARED_DRIVE_ID, normalizedDate);
  const targetFolderId = targetFolder.getId();

  while (files.hasNext()) {
    const file = files.next();
    const name = file.getName();

    if (name.includes(EVENT_KEYWORD) && name.includes(dateToFind)) {
      console.log(`Checking file: ${name}`);

      const isNotes = name.toLowerCase().includes("notes");
      const isRecording = name.toLowerCase().includes("recording");
      const fileType = isNotes ? "Notes" : isRecording ? "Recording" : null;

      if (!fileType) continue;

      const extension = getExtension(name);
      const newTitle = `${EVENT_KEYWORD} – ${normalizedDate} – ${fileType}`;
      const newFullName = extension ? `${newTitle}.${extension}` : newTitle;

      const copiedFile = file.makeCopy(newFullName, targetFolder);
      Logger.log(`📎 Copied file MIME: ${copiedFile.getMimeType()}`);
      console.log(`✅ Copied and renamed: ${newFullName}`);

      renamedFiles.push(`${newFullName} → ${targetFolder.getName()}`);
    }
  }

  // Post Slack summary if files were processed
  if (renamedFiles.length > 0) {
    postToSlack(renamedFiles, normalizedDate, targetFolderId);
  }

  console.log("Script completed.");
}

function getOrCreateFolderInSharedDrive(driveId, folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  while (folders.hasNext()) {
    const f = folders.next();
    if (f.getParents().hasNext() && f.getParents().next().getId() === driveId) {
      console.log(`📂 Using existing folder: ${folderName}`);
      return f;
    }
  }

  const newFolder = DriveApp.getFolderById(
    DriveApp.getRootFolder().createFolder(folderName).getId()
  );
  console.log(`📁 Created new folder: ${folderName}`);
  return newFolder;
}

function getExtension(filename) {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop() : "";
}

function postToSlack(copiedFiles, folderName, folderId) {
  const folderUrl = `https://drive.google.com/drive/folders/${folderId}`;
  const copiedList = copiedFiles.map(f => `\t• ${f}`).join('\n');

  const message = 
`📁 Notes and Recording moved @ ${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'hh:mm a')}
• Copied: ${copiedFiles.length} file(s) to <${folderUrl}|${folderName}>
${copiedList}`;

  UrlFetchApp.fetch(SLACK_WEBHOOK_URL, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ text: message }),
  });
}
