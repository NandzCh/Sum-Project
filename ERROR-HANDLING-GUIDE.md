# Error Handling Implementation Guide

## Overview

Comprehensive error handling has been implemented across the habit tracker app to handle localStorage failures, data corruption, quota exceeded errors, and user input validation.

## What's Been Added

### 1. Storage Error Handling (`src/storage.js`)

**Features:**
- Detects localStorage unavailability (private/incognito mode)
- Handles quota exceeded errors (storage full)
- Catches data corruption and JSON parse errors
- Schema version mismatch detection
- Export/Import functionality for data backup

**Error Types:**
- `unavailable` - localStorage not accessible
- `quota` - Storage quota exceeded
- `corrupt` - Data corruption detected
- `security` - Browser security restrictions
- `version` - Schema version mismatch

### 2. State Validation (`src/state.js`)

**Features:**
- Input validation for habits (max 200 chars name, 500 chars description)
- Transaction validation (positive amounts, max 999,999,999)
- Label length limits (max 200 chars)
- Save failure tracking (alerts after 3 consecutive failures)
- Try-catch blocks around all state mutations

**Error Types:**
- `validation` - User input validation failures
- `error` - General operation errors
- `critical` - Multiple save failures requiring user action

### 3. User Notifications (`src/main.js`)

**Features:**
- Toast notifications for all error types
- Export button in critical error toasts
- Auto-hide for non-critical errors (4-7 seconds)
- Persistent toasts for critical errors (manual dismiss only)
- Import/Export UI in help modal (press `h`)

## Testing Error Scenarios

### Test 1: Storage Unavailable (Private Mode)
```
1. Open the app in private/incognito mode
2. Expected: Warning toast appears
3. All functionality works but changes don't persist
```

### Test 2: Quota Exceeded
```
1. Fill localStorage to near capacity
2. Add many transactions or habits
3. Expected: "Storage full" toast with export option
4. Click export to download backup
```

### Test 3: Data Corruption
```
1. Open DevTools > Application > Local Storage
2. Manually corrupt the 'habit-tracker:v1' value (invalid JSON)
3. Reload the page
4. Expected: "Data corrupted" toast, app starts fresh
```

### Test 4: Input Validation
```
1. Try to add a habit with name > 200 characters
2. Expected: Toast shows "Habit name is too long"
3. Try to add transaction with amount > 999,999,999
4. Expected: Toast shows "Amount is too large"
5. Try to add transaction with negative or zero amount
6. Expected: Toast shows "Amount must be a positive number"
```

### Test 5: Export/Import
```
1. Press 'h' to open help modal
2. Click "export data" button
3. Expected: JSON file downloads
4. Clear localStorage (DevTools > Application)
5. Click "import data" button and select the exported file
6. Expected: "Data imported successfully" toast, page reloads
7. All data should be restored
```

### Test 6: Multiple Save Failures
```
1. Fill localStorage to capacity
2. Make 3+ changes (add habits, toggle completions)
3. Expected: Critical error toast with "export now" button
4. Toast doesn't auto-hide (stays until dismissed)
```

## User-Facing Features

### Help Modal Data Section
- Press `h` to open help
- New "// data" section with:
  - **Export data** - Download JSON backup
  - **Import data** - Restore from backup file

### Error Toast Actions
- **Critical errors** - Show "export now" button
- **Quota errors** - Show "export" button  
- **Validation errors** - Auto-hide after 4 seconds
- **General errors** - Auto-hide after 5 seconds

## Technical Implementation

### Error Flow
```
1. Error occurs (storage, validation, etc.)
2. notifyError() called with error object
3. Error listeners in main.js receive error
4. Toast shown with appropriate message and action
5. User can act (export, dismiss, retry)
```

### Retry Logic
- Save failures tracked (MAX_SAVE_FAILURES = 3)
- After 3 failures, critical alert shown
- Counter resets on successful save
- Prevents alert spam

### Data Safety
- All mutations wrapped in try-catch
- Save failures don't crash the app
- In-memory state preserved even if save fails
- Export always available as escape hatch

## Error Messages

| Error Type | Message | Duration | Action |
|------------|---------|----------|--------|
| unavailable | Storage unavailable. Data will not persist. | 10s | export |
| quota | Storage full. Delete old data or export a backup. | 10s | export |
| corrupt | Saved data corrupted. Starting fresh. | 7s | - |
| security | Cannot save due to browser restrictions. | 6s | - |
| validation | [Specific validation message] | 4s | - |
| critical | Failed to save data multiple times... | ∞ | export now |

## Benefits

1. **Data Safety** - Users can always export backup before data loss
2. **Graceful Degradation** - App works even when localStorage fails
3. **Clear Feedback** - Users understand what went wrong
4. **Recovery Options** - Export/import provides escape hatch
5. **No Silent Failures** - All errors visible to user

## Future Enhancements

- Auto-export on critical errors (download prompt)
- Cloud sync option for persistent backup
- Compression for large datasets
- Migration logic for schema version changes
- Detailed error logging for debugging
