import { supabase } from "@/integrations/supabase/client";

/**
 * Interface for creating a public share
 */
export interface CreatePublicShareRequest {
  testId: string;
  title?: string;
  description?: string;
  expiresInHours?: number;
  maxViews?: number;
}

/**
 * Interface for public share response
 */
export interface PublicShareResponse {
  shareId: string;
  shareToken: string;
  shareUrl: string;
}

/**
 * Interface for public share data
 */
export interface PublicShareData {
  testType: string;
  score: number;
  reactionTime: number | null;
  accuracy: number | null;
  timestamp: string;
  title: string | null;
  description: string | null;
  shareId: string;
  currentViews: number;
  maxViews: number | null;
  expiresAt: string | null;
}

/**
 * Interface for user's public share item
 */
export interface UserPublicShare {
  id: string;
  share_token: string;
  title: string | null;
  description: string | null;
  expires_at: string | null;
  max_views: number | null;
  current_views: number;
  is_active: boolean;
  created_at: string;
  test_results: {
    test_type: string;
    score: number;
    timestamp: string;
  };
}

/**
 * Interface for service response
 */
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Create a public share for a test result
 */
export async function createPublicShare(
  request: CreatePublicShareRequest
): Promise<ServiceResponse<PublicShareResponse>> {
  try {
    const { data, error } = await supabase.rpc('create_public_share', {
      p_test_id: request.testId,
      p_title: request.title || null,
      p_description: request.description || null,
      p_expires_in_hours: request.expiresInHours || null,
      p_max_views: request.maxViews || null
    });

    if (error) {
      console.error('Error creating public share:', error);
      return {
        success: false,
        error: error.message
      };
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        error: 'Failed to create public share'
      };
    }

    const shareData = data[0];
    return {
      success: true,
      data: {
        shareId: shareData.share_id,
        shareToken: shareData.share_token,
        shareUrl: shareData.share_url
      }
    };
  } catch (error) {
    console.error('Unexpected error creating public share:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get public share data by token (for anonymous viewing)
 */
export async function getPublicShareData(
  shareToken: string
): Promise<ServiceResponse<PublicShareData>> {
  try {
    const { data, error } = await supabase.rpc('get_public_share_data', {
      p_share_token: shareToken
    });

    if (error) {
      console.error('Error getting public share data:', error);
      return {
        success: false,
        error: error.message
      };
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        error: 'Share not found or no longer available'
      };
    }

    const shareData = data[0];
    return {
      success: true,
      data: {
        testType: shareData.test_type,
        score: shareData.score,
        reactionTime: shareData.reaction_time,
        accuracy: shareData.accuracy,
        timestamp: shareData.test_timestamp, // Updated to use new column name
        title: shareData.title,
        description: shareData.description,
        shareId: shareData.share_id,
        currentViews: shareData.current_views,
        maxViews: shareData.max_views,
        expiresAt: shareData.expires_at
      }
    };
  } catch (error) {
    console.error('Unexpected error getting public share data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Revoke a public share
 */
export async function revokePublicShare(
  shareToken: string
): Promise<ServiceResponse<boolean>> {
  try {
    const { data, error } = await supabase.rpc('revoke_public_share', {
      p_share_token: shareToken
    });

    if (error) {
      console.error('Error revoking public share:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      data: data === true
    };
  } catch (error) {
    console.error('Unexpected error revoking public share:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get user's public shares
 */
export async function getUserPublicShares(): Promise<ServiceResponse<UserPublicShare[]>> {
  try {
    const { data, error } = await supabase
      .from('public_test_shares')
      .select(`
        id,
        share_token,
        title,
        description,
        expires_at,
        max_views,
        current_views,
        is_active,
        created_at,
        test_results!inner(
          test_type,
          score,
          timestamp
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting user public shares:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      data: (data as UserPublicShare[]) || []
    };
  } catch (error) {
    console.error('Unexpected error getting user public shares:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate a shareable URL for a test result
 */
export function generateShareableUrl(shareToken: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/shared/${shareToken}`;
}

/**
 * Validate share token format
 */
export function isValidShareToken(token: string): boolean {
  // Check if token matches expected format (base64url, 32 characters)
  return /^[A-Za-z0-9_-]{32}$/.test(token);
}
