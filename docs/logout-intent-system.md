# Logout Intent System

## Overview

The Logout Intent System is designed to improve user experience by distinguishing between intentional (manual) and automatic signouts, preventing unnecessary "signed out" warnings when users manually log out and then refresh the page.

## Problem Statement

Previously, users would see a "You have been signed out" warning in two scenarios:

1. **Expected scenario (good UX)**: When a user is actively using the app and gets signed out due to session expiration
2. **Problematic scenario (poor UX)**: When a user manually signs out and then refreshes the page, they still see the "signed out" warning even though the signout was intentional

## Solution

The system tracks logout intent using multiple storage mechanisms to distinguish between manual and automatic signouts:

### Storage Strategy

1. **SessionStorage Flag**: `holistiq_manual_logout`

   - Short-term flag that persists across page refreshes within the same tab
   - Automatically cleared after 30 seconds
   - Used for immediate post-logout page refreshes

2. **LocalStorage Intent**: `holistiq_logout_intent`
   - Longer-term storage with timestamp
   - Contains `{ isManual: boolean, timestamp: number }`
   - Automatically expires after 5 minutes
   - Used for cross-tab communication and longer-term tracking

## Implementation Details

### Core Components

#### SessionManager (`src/services/sessionManager.ts`)

**New SessionAction**:

```typescript
enum SessionAction {
  // ... existing actions
  MANUAL_LOGOUT = "MANUAL_LOGOUT", // New action for intentional logout
}
```

**Enhanced signOut Method**:

```typescript
public async signOut(isManual: boolean = true): Promise<void>
```

- Now accepts an `isManual` parameter (defaults to `true`)
- Tracks logout intent using `setLogoutIntent()`
- Broadcasts appropriate action based on logout type

**New Methods**:

- `setLogoutIntent(isManual: boolean)`: Records logout intent
- `getLogoutIntent()`: Retrieves logout intent with expiration check
- `clearLogoutIntent()`: Clears all logout intent tracking

#### Authentication Navigation (`src/hooks/useAuthNavigation.ts`)

**Enhanced handleSignOut**:

- Checks logout intent from multiple sources
- Only shows warning messages for automatic/unexpected signouts
- Navigates without warning for manual logouts
- Automatically clears logout intent after handling

#### Logout Intent Utilities (`src/utils/auth/logoutIntentUtils.ts`)

**Utility Functions**:

- `isAfterManualLogout()`: Checks if current page load is after manual logout
- `shouldShowSignedOutWarning()`: Determines if warning should be shown
- `clearLogoutIntent()`: Cleans up all logout intent tracking

#### Sign-In Page (`src/pages/auth/EnhancedSignIn.tsx`)

**Enhanced Message Handling**:

- Uses `shouldShowSignedOutWarning()` to filter messages
- Only displays "signed out" warnings for unexpected signouts
- Automatically clears logout intent when appropriate

### Cross-Tab Communication

The system handles logout scenarios across multiple browser tabs:

1. **Manual Logout**: Broadcasts `MANUAL_LOGOUT` action
2. **Session Expiration**: Broadcasts `SESSION_EXPIRED` action
3. **Other Tabs**: React appropriately based on the action type

### Component Updates

#### SessionTimeoutWarning

- Updated to handle `MANUAL_LOGOUT` action
- Dismisses warning for manual logouts

#### SessionExpiredModal

- Updated to not show modal for manual logouts
- Only displays for genuine session expirations

## Usage Examples

### Manual Logout (User clicks logout button)

```typescript
// User clicks logout button
await sessionManager.signOut(true); // isManual = true

// Result: No warning shown on subsequent page refresh
```

### Automatic Logout (Session expires)

```typescript
// Session expires due to inactivity
await sessionManager.signOut(false); // isManual = false

// Result: Warning shown to inform user of unexpected signout
```

### Page Refresh After Manual Logout

```typescript
// User manually logs out, then refreshes page
if (shouldShowSignedOutWarning()) {
  // Don't show warning - this was intentional
  showMessage(location.state.message);
} else {
  // Clear the intent and navigate silently
  clearLogoutIntent();
}
```

## Benefits

1. **Improved UX**: No more confusing warnings after intentional logout
2. **Clear Communication**: Users only see warnings for unexpected signouts
3. **Cross-Tab Support**: Consistent behavior across multiple browser tabs
4. **Automatic Cleanup**: Intent tracking expires automatically to prevent stale data
5. **Backward Compatibility**: Existing logout flows continue to work

## Testing Scenarios

### Scenario 1: Manual Logout + Page Refresh

1. User clicks logout button
2. User refreshes the sign-in page
3. **Expected**: No "signed out" warning displayed

### Scenario 2: Session Expiration

1. User is inactive for 30+ minutes
2. Session expires automatically
3. User is redirected to sign-in page
4. **Expected**: "Session expired" warning displayed

### Scenario 3: Manual Logout + New Tab

1. User clicks logout in Tab A
2. User opens sign-in page in Tab B
3. **Expected**: No warning in Tab B

### Scenario 4: Cross-Tab Session Expiration

1. Session expires in Tab A
2. User switches to Tab B
3. **Expected**: Session expired warning in Tab B

## Configuration

### Timeouts

- **SessionStorage Flag**: 30 seconds
- **LocalStorage Intent**: 5 minutes
- **Session Inactivity**: 30 minutes (unchanged)

### Storage Keys

- `holistiq_manual_logout`: SessionStorage flag
- `holistiq_logout_intent`: LocalStorage intent object
- `holistiq_session_action`: Cross-tab communication

## Future Enhancements

1. **Analytics Integration**: Track logout patterns for UX insights
2. **Customizable Timeouts**: Allow configuration of intent expiration times
3. **Enhanced Messaging**: Different messages for different logout reasons
4. **Remember User Preference**: Option to never show logout warnings
