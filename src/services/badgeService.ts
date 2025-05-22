/**
 * Badge Service
 *
 * Handles operations related to user badges
 */
import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import {
  UserBadgeWithDetails,
  MAX_DISPLAYED_BADGES
} from '@/types/achievement';
import { getAchievementById } from '@/data/achievements';

// Common response type for badge operations
type BadgeServiceResponse<T = undefined> = {
  success: boolean;
  error?: string;
  data?: T;
};

// Type for database errors
type DatabaseError = PostgrestError | Error;

// Helper function to check if a table doesn't exist error
function isTableNotExistError(error: DatabaseError): boolean {
  if ('code' in error && error.code === '42P01') {
    return true;
  }

  if (error instanceof Error &&
      error.message.includes('relation') &&
      error.message.includes('does not exist')) {
    return true;
  }

  return false;
}

// Helper function to handle database errors
function handleDatabaseError(
  error: unknown,
  operation: string
): BadgeServiceResponse {
  // Convert unknown error to a more specific type if possible
  const dbError = error as DatabaseError;

  if (dbError && isTableNotExistError(dbError)) {
    console.warn(`User badges table not set up yet. Cannot ${operation}.`);
    return {
      success: false,
      error: 'Badge system is not fully set up yet. Please try again later.'
    };
  }

  console.error(`Error ${operation}:`, error);

  // Extract error message if available
  const errorMessage = dbError instanceof Error ||
    ('message' in dbError && typeof dbError.message === 'string')
    ? dbError.message
    : 'Unknown error';

  return { success: false, error: errorMessage };
}

// Helper function to validate user ID
function validateUserId(userId: string): BadgeServiceResponse | null {
  if (!userId) {
    return { success: false, error: 'User ID is required' };
  }
  return null;
}

// Helper function to map database badges to UserBadgeWithDetails
function mapBadgesToDetails(badges: any[]): UserBadgeWithDetails[] {
  return badges
    .map(badge => {
      const achievement = getAchievementById(badge.achievement_id);
      if (!achievement) return null;

      return {
        id: badge.id,
        userId: badge.user_id,
        achievementId: badge.achievement_id,
        displayOrder: badge.display_order,
        createdAt: badge.created_at,
        achievement
      };
    })
    .filter(Boolean) as UserBadgeWithDetails[];
}

/**
 * Get all badges for a user
 */
export async function getUserBadges(
  userId: string
): Promise<BadgeServiceResponse<UserBadgeWithDetails[]>> {
  try {
    // Validate user ID
    const validationError = validateUserId(userId);
    if (validationError) return validationError;

    try {
      // Get user badges from Supabase
      const { data: userBadges, error } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId)
        .order('display_order', { ascending: true });

      if (error) {
        // Check if this is a "relation does not exist" error
        if (error.code === '42P01') {
          console.warn('User badges table not set up yet. Using empty badges list.');
          return { success: true, data: [] };
        }

        return handleDatabaseError(error, 'fetching user badges');
      }

      // Map badges with achievement details
      const badgesWithDetails = mapBadgesToDetails(userBadges);

      return {
        success: true,
        data: badgesWithDetails
      };
    } catch (error) {
      // Check if this is a "relation does not exist" error
      if (isTableNotExistError(error)) {
        console.warn('User badges table not set up yet. Using empty badges list.');
        return { success: true, data: [] };
      }

      // Re-throw other errors
      throw error;
    }
  } catch (error) {
    return handleDatabaseError(error, 'getting user badges');
  }
}

// Helper function to validate achievement ID
function validateAchievementId(achievementId: string): BadgeServiceResponse | null {
  if (!achievementId) {
    return { success: false, error: 'Achievement ID is required' };
  }
  return null;
}

// Helper function to check if achievement exists
function validateAchievementExists(achievementId: string): BadgeServiceResponse | null {
  const achievement = getAchievementById(achievementId);
  if (!achievement) {
    return { success: false, error: 'Achievement not found' };
  }
  return null;
}

// Helper function to check if badge already exists
async function checkBadgeExists(
  userId: string,
  achievementId: string
): Promise<BadgeServiceResponse<{ exists: boolean, badge?: any }>> {
  try {
    const { data: existingBadge, error } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', userId)
      .eq('achievement_id', achievementId)
      .single();

    if (error) {
      // Not found is expected and not an error in this context
      if (error.code === 'PGRST116') {
        return { success: true, data: { exists: false } };
      }

      return handleDatabaseError(error, 'checking if badge exists');
    }

    return {
      success: true,
      data: {
        exists: !!existingBadge,
        badge: existingBadge
      }
    };
  } catch (error) {
    return handleDatabaseError(error, 'checking if badge exists');
  }
}

// Helper function to get badge count for a user
async function getUserBadgeCount(userId: string): Promise<BadgeServiceResponse<number>> {
  try {
    const { data: badgeCount, error } = await supabase
      .from('user_badges')
      .select('id', { count: 'exact' })
      .eq('user_id', userId);

    if (error) {
      return handleDatabaseError(error, 'counting user badges');
    }

    return {
      success: true,
      data: badgeCount ? badgeCount.length : 0
    };
  } catch (error) {
    return handleDatabaseError(error, 'counting user badges');
  }
}

// Helper function to insert a new badge
async function insertBadge(
  userId: string,
  achievementId: string,
  displayOrder: number
): Promise<BadgeServiceResponse<any>> {
  try {
    const { data: newBadge, error } = await supabase
      .from('user_badges')
      .insert({
        user_id: userId,
        achievement_id: achievementId,
        display_order: displayOrder
      })
      .select()
      .single();

    if (error) {
      return handleDatabaseError(error, 'adding user badge');
    }

    return { success: true, data: newBadge };
  } catch (error) {
    return handleDatabaseError(error, 'adding user badge');
  }
}

/**
 * Add a badge for a user
 */
export async function addUserBadge(
  userId: string,
  achievementId: string
): Promise<BadgeServiceResponse<UserBadgeWithDetails>> {
  try {
    // Validate inputs
    const userIdError = validateUserId(userId);
    if (userIdError) return userIdError;

    const achievementIdError = validateAchievementId(achievementId);
    if (achievementIdError) return achievementIdError;

    const achievementExistsError = validateAchievementExists(achievementId);
    if (achievementExistsError) return achievementExistsError;

    // Get the achievement
    const achievement = getAchievementById(achievementId);

    // Check if badge already exists
    const badgeExistsResult = await checkBadgeExists(userId, achievementId);
    if (!badgeExistsResult.success) return badgeExistsResult;

    if (badgeExistsResult.data?.exists) {
      return { success: false, error: 'Badge already exists for this user' };
    }

    // Get current badge count
    const countResult = await getUserBadgeCount(userId);
    if (!countResult.success) return countResult;

    // Check if maximum badges reached
    if (countResult.data >= MAX_DISPLAYED_BADGES) {
      return {
        success: false,
        error: `Maximum of ${MAX_DISPLAYED_BADGES} badges allowed`
      };
    }

    // Calculate next display order
    const nextDisplayOrder = countResult.data + 1;

    // Insert the new badge
    const insertResult = await insertBadge(userId, achievementId, nextDisplayOrder);
    if (!insertResult.success) return insertResult;

    // Create badge with details
    const newBadge = insertResult.data;
    const badgeWithDetails: UserBadgeWithDetails = {
      id: newBadge.id,
      userId: newBadge.user_id,
      achievementId: newBadge.achievement_id,
      displayOrder: newBadge.display_order,
      createdAt: newBadge.created_at,
      achievement
    };

    return {
      success: true,
      data: badgeWithDetails
    };
  } catch (error) {
    return handleDatabaseError(error, 'adding user badge');
  }
}

// Helper function to validate badge ID
function validateBadgeId(badgeId: string): BadgeServiceResponse | null {
  if (!badgeId) {
    return { success: false, error: 'Badge ID is required' };
  }
  return null;
}

// Helper function to get a badge by ID
async function getBadgeById(
  userId: string,
  badgeId: string
): Promise<BadgeServiceResponse<any>> {
  try {
    const { data: badge, error } = await supabase
      .from('user_badges')
      .select('*')
      .eq('id', badgeId)
      .eq('user_id', userId)
      .single();

    if (error) {
      // Not found is expected in some contexts
      if (error.code === 'PGRST116') {
        return { success: true, data: null };
      }

      return handleDatabaseError(error, 'getting badge by ID');
    }

    return { success: true, data: badge };
  } catch (error) {
    return handleDatabaseError(error, 'getting badge by ID');
  }
}

// Helper function to delete a badge
async function deleteBadge(
  userId: string,
  badgeId: string
): Promise<BadgeServiceResponse> {
  try {
    const { error } = await supabase
      .from('user_badges')
      .delete()
      .eq('id', badgeId)
      .eq('user_id', userId);

    if (error) {
      return handleDatabaseError(error, 'removing badge');
    }

    return { success: true };
  } catch (error) {
    return handleDatabaseError(error, 'removing badge');
  }
}

// Helper function to get all badges for a user
async function getAllUserBadges(userId: string): Promise<BadgeServiceResponse<any[]>> {
  try {
    const { data: badges, error } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', userId)
      .order('display_order', { ascending: true });

    if (error) {
      return handleDatabaseError(error, 'getting all user badges');
    }

    return { success: true, data: badges || [] };
  } catch (error) {
    return handleDatabaseError(error, 'getting all user badges');
  }
}

// Helper function to update badge display orders
async function updateBadgeDisplayOrders(
  badges: any[]
): Promise<BadgeServiceResponse> {
  try {
    // Update each badge's display order
    for (let i = 0; i < badges.length; i++) {
      const { error } = await supabase
        .from('user_badges')
        .update({ display_order: i + 1 })
        .eq('id', badges[i].id);

      if (error) {
        return handleDatabaseError(error, 'updating badge display orders');
      }
    }

    return { success: true };
  } catch (error) {
    return handleDatabaseError(error, 'updating badge display orders');
  }
}

/**
 * Remove a badge for a user
 */
export async function removeUserBadge(
  userId: string,
  badgeId: string
): Promise<BadgeServiceResponse> {
  try {
    // Validate inputs
    const userIdError = validateUserId(userId);
    if (userIdError) return userIdError;

    const badgeIdError = validateBadgeId(badgeId);
    if (badgeIdError) return badgeIdError;

    // Get the badge to be removed
    const badgeResult = await getBadgeById(userId, badgeId);
    if (!badgeResult.success) return badgeResult;

    if (!badgeResult.data) {
      return { success: false, error: 'Badge not found' };
    }

    // Delete the badge
    const deleteResult = await deleteBadge(userId, badgeId);
    if (!deleteResult.success) return deleteResult;

    // Get remaining badges to update their display order
    const remainingBadgesResult = await getAllUserBadges(userId);
    if (!remainingBadgesResult.success) return remainingBadgesResult;

    // Update display order for remaining badges
    if (remainingBadgesResult.data.length > 0) {
      const updateOrderResult = await updateBadgeDisplayOrders(remainingBadgesResult.data);
      if (!updateOrderResult.success) return updateOrderResult;
    }

    return { success: true };
  } catch (error) {
    return handleDatabaseError(error, 'removing user badge');
  }
}

// Helper function to validate order number
function validateOrderNumber(order: number, maxOrder: number): BadgeServiceResponse | null {
  if (order < 1) {
    return { success: false, error: 'Display order must be at least 1' };
  }

  if (order > maxOrder) {
    return {
      success: false,
      error: `Display order cannot exceed ${maxOrder}`
    };
  }

  return null;
}

// Helper function to update a single badge's display order
async function updateSingleBadgeOrder(
  badgeId: string,
  newOrder: number
): Promise<BadgeServiceResponse> {
  try {
    const { error } = await supabase
      .from('user_badges')
      .update({ display_order: newOrder })
      .eq('id', badgeId);

    if (error) {
      return handleDatabaseError(error, 'updating badge display order');
    }

    return { success: true };
  } catch (error) {
    return handleDatabaseError(error, 'updating badge display order');
  }
}

// Helper function to shift badge orders when moving a badge to a later position
async function shiftBadgesDown(
  badges: any[],
  startOrder: number,
  endOrder: number
): Promise<BadgeServiceResponse> {
  try {
    // Find badges that need to be shifted down
    const badgesToShift = badges.filter(
      b => b.display_order > startOrder && b.display_order <= endOrder
    );

    // Update each badge's display order
    for (const badge of badgesToShift) {
      const { error } = await supabase
        .from('user_badges')
        .update({ display_order: badge.display_order - 1 })
        .eq('id', badge.id);

      if (error) {
        return handleDatabaseError(error, 'shifting badges down');
      }
    }

    return { success: true };
  } catch (error) {
    return handleDatabaseError(error, 'shifting badges down');
  }
}

// Helper function to shift badge orders when moving a badge to an earlier position
async function shiftBadgesUp(
  badges: any[],
  startOrder: number,
  endOrder: number
): Promise<BadgeServiceResponse> {
  try {
    // Find badges that need to be shifted up
    const badgesToShift = badges.filter(
      b => b.display_order >= startOrder && b.display_order < endOrder
    );

    // Update each badge's display order
    for (const badge of badgesToShift) {
      const { error } = await supabase
        .from('user_badges')
        .update({ display_order: badge.display_order + 1 })
        .eq('id', badge.id);

      if (error) {
        return handleDatabaseError(error, 'shifting badges up');
      }
    }

    return { success: true };
  } catch (error) {
    return handleDatabaseError(error, 'shifting badges up');
  }
}

/**
 * Update badge display order
 */
export async function updateBadgeOrder(
  userId: string,
  badgeId: string,
  newOrder: number
): Promise<BadgeServiceResponse> {
  try {
    // Validate inputs
    const userIdError = validateUserId(userId);
    if (userIdError) return userIdError;

    const badgeIdError = validateBadgeId(badgeId);
    if (badgeIdError) return badgeIdError;

    // Get the badge to be updated
    const badgeResult = await getBadgeById(userId, badgeId);
    if (!badgeResult.success) return badgeResult;

    const badge = badgeResult.data;
    if (!badge) {
      return { success: false, error: 'Badge not found' };
    }

    // Get all badges for the user
    const allBadgesResult = await getAllUserBadges(userId);
    if (!allBadgesResult.success) return allBadgesResult;

    const allBadges = allBadgesResult.data;

    // Validate the new order
    const orderError = validateOrderNumber(newOrder, allBadges.length);
    if (orderError) return orderError;

    // If the order hasn't changed, return success
    if (badge.display_order === newOrder) {
      return { success: true };
    }

    // Update display orders based on direction of movement
    if (badge.display_order < newOrder) {
      // Moving badge to a later position
      const shiftResult = await shiftBadgesDown(allBadges, badge.display_order, newOrder);
      if (!shiftResult.success) return shiftResult;
    } else {
      // Moving badge to an earlier position
      const shiftResult = await shiftBadgesUp(allBadges, newOrder, badge.display_order);
      if (!shiftResult.success) return shiftResult;
    }

    // Update the badge's display order
    const updateResult = await updateSingleBadgeOrder(badgeId, newOrder);
    if (!updateResult.success) return updateResult;

    return { success: true };
  } catch (error) {
    return handleDatabaseError(error, 'updating badge order');
  }
}
