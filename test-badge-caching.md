# Badge Caching Test Instructions

## Before Testing

1. Open browser developer tools (F12)
2. Go to Network tab
3. Clear any existing network logs
4. Filter by "user_badges" to see only badge-related queries

## Test Steps

### Test 1: Initial Page Load

1. Navigate to `/achievements` page
2. Check Network tab for user_badges queries
3. **Expected Result**: Should see only 1 query to user_badges table

### Test 2: Component Re-renders

1. Stay on the achievements page
2. Try interacting with filters or search
3. Check Network tab
4. **Expected Result**: Should see NO additional user_badges queries (data should come from cache)

### Test 3: Cache Hit Verification

1. Open browser console
2. Look for cache-related log messages like:
   - `[User Badges] Cache HIT - Using cached data`
   - `[SupabaseCache] Cache hit for USER_BADGES`

### Test 4: Badge Management Operations

1. Try adding a badge (if possible)
2. Check Network tab
3. **Expected Result**: Should see 1 query for the add operation, then cache should be invalidated and refreshed

### Test 5: Page Refresh

1. Refresh the page (F5)
2. Check Network tab
3. **Expected Result**: Should see 1 new query to user_badges (cache is cleared on page refresh)

## Success Criteria

- ✅ Only 1 user_badges query on initial page load
- ✅ No redundant queries during normal page interactions
- ✅ Cache invalidation works properly after badge modifications
- ✅ Console shows cache hit/miss messages in development mode

## Debugging

If you see multiple queries:

1. Check if multiple components are calling useUserBadges
2. Verify cache configuration is correct
3. Check for any cache invalidation issues
