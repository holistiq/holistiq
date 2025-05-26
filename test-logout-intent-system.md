# Testing the Logout Intent System

## Test Results Summary

✅ **Fixed Issue**: Missing import in `EnhancedSignIn.tsx`

- **Problem**: `shouldShowSignedOutWarning()` and `clearLogoutIntent()` functions were used but not imported
- **Solution**: Added `import { shouldShowSignedOutWarning, clearLogoutIntent } from "@/utils/auth";`
- **Status**: ✅ RESOLVED

## Manual Testing Checklist

### ✅ **Compilation & Build Tests**

- [x] TypeScript compilation passes (`npm run type-check`)
- [x] Development server starts successfully (`npm run dev`)
- [x] No import/export errors
- [x] All dependencies resolved correctly

### 🔄 **Runtime Testing Required**

#### Test Scenario 1: Manual Logout + Page Refresh

**Steps:**

1. Sign in to the application
2. Click the logout button (manual logout)
3. Refresh the sign-in page
4. **Expected**: No "signed out" warning should appear

#### Test Scenario 2: Session Expiration

**Steps:**

1. Sign in to the application
2. Wait for session to expire (or simulate expiration)
3. Get redirected to sign-in page
4. **Expected**: "Session expired" warning should appear

#### Test Scenario 3: Manual Logout + New Tab

**Steps:**

1. Sign in to the application in Tab A
2. Click logout in Tab A
3. Open sign-in page in Tab B
4. **Expected**: No warning should appear in Tab B

#### Test Scenario 4: Cross-Tab Session Expiration

**Steps:**

1. Sign in to the application in multiple tabs
2. Let session expire in one tab
3. Switch to another tab
4. **Expected**: Session expired warning should appear

## Browser Console Debugging

### Check for JavaScript Errors

Open browser console (F12) and look for:

- Import/export errors
- Function not defined errors
- Authentication flow errors
- Storage access errors

### Expected Console Messages

During normal operation, you should see:

```
SessionManager: Starting direct Google OAuth sign-in
SessionManager: Remember me: [true/false]
DirectGoogleAuth: Starting Google OAuth sign-in
DirectGoogleAuth: Exchanging ID token for Supabase session
SessionManager: Session initialized successfully
```

### Error Indicators

Watch for these error patterns:

```
❌ ReferenceError: shouldShowSignedOutWarning is not defined
❌ ReferenceError: clearLogoutIntent is not defined
❌ Error setting logout intent: [error details]
❌ Error getting logout intent: [error details]
❌ DirectGoogleAuth: ID token exchange failed: [error details]
```

## Storage Inspection

### LocalStorage Keys to Monitor

- `holistiq_logout_intent`: Should contain `{isManual: boolean, timestamp: number}`
- `holistiq-session-preference`: Session storage preference

### SessionStorage Keys to Monitor

- `holistiq_manual_logout`: Should be "true" after manual logout
- `holistiq_just_signed_in`: Temporary flag after sign-in

## Implementation Status

### ✅ **Completed Components**

- [x] SessionManager logout intent tracking
- [x] Enhanced signOut method with manual flag
- [x] Cross-tab communication for MANUAL_LOGOUT
- [x] Logout intent utilities
- [x] Enhanced useAuthNavigation hook
- [x] Updated SessionTimeoutWarning component
- [x] Updated SessionExpiredModal component
- [x] Enhanced EnhancedSignIn message handling
- [x] Comprehensive documentation
- [x] Unit tests for utilities

### 🔄 **Pending Verification**

- [ ] Manual testing of all scenarios
- [ ] Browser console verification
- [ ] Cross-tab behavior verification
- [ ] Storage persistence verification

## Next Steps

1. **Manual Testing**: Test all scenarios listed above
2. **Browser Console**: Check for any JavaScript errors
3. **Storage Verification**: Verify localStorage/sessionStorage behavior
4. **Cross-Tab Testing**: Test behavior across multiple browser tabs
5. **Edge Cases**: Test with browser refresh, tab closure, etc.

## Rollback Plan (If Needed)

If issues are found that can't be quickly resolved:

1. **Revert EnhancedSignIn.tsx changes**:

   ```typescript
   // Remove the import and revert to simple message handling
   useEffect(() => {
     if (location.state?.message) {
       setMessage(location.state.message);
     }
   }, [location.state]);
   ```

2. **Revert sessionManager.signOut() signature**:

   ```typescript
   // Change back to: public async signOut(): Promise<void>
   // Remove isManual parameter and logout intent tracking
   ```

3. **Revert useSupabaseAuth.signOut()**:
   ```typescript
   // Remove isManual parameter: await sessionManager.signOut();
   ```

But this should not be necessary as the core functionality is preserved and only enhancements were added.
