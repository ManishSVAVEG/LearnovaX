/**
 * Offline support and caching system
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_KEYS = {
  NOTES_CACHE: "aibuddy_cache_notes_",
  EXAM_CACHE: "aibuddy_cache_exams_",
  SUMMARY_CACHE: "aibuddy_cache_summaries_",
};

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl?: number; // Time to live in milliseconds
}

/**
 * Cache content for offline access
 */
export async function cacheContent<T>(
  key: string,
  data: T,
  ttlMinutes = 24 * 60 // Default 24 hours
): Promise<void> {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000,
    };
    await AsyncStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    console.warn("Failed to cache content:", error);
  }
}

/**
 * Get cached content
 */
export async function getCachedContent<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;

    const entry: CacheEntry<T> = JSON.parse(raw);
    
    // Check if cache has expired
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.warn("Failed to retrieve cached content:", error);
    return null;
  }
}

/**
 * Clear expired cache
 */
export async function clearExpiredCache(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const cacheKeys = allKeys.filter((k) => k.startsWith("aibuddy_cache_"));

    for (const key of cacheKeys) {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) continue;

      const entry: CacheEntry<unknown> = JSON.parse(raw);
      if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
        await AsyncStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.warn("Failed to clear expired cache:", error);
  }
}

/**
 * Get cache size in bytes
 */
export async function getCacheSize(): Promise<number> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const cacheKeys = allKeys.filter((k) => k.startsWith("aibuddy_cache_"));
    
    let totalSize = 0;
    for (const key of cacheKeys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        totalSize += value.length;
      }
    }
    return totalSize;
  } catch (error) {
    console.warn("Failed to get cache size:", error);
    return 0;
  }
}

/**
 * Clear all cache
 */
export async function clearAllCache(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const cacheKeys = allKeys.filter((k) => k.startsWith("aibuddy_cache_"));
    
    await AsyncStorage.multiRemove(cacheKeys);
  } catch (error) {
    console.warn("Failed to clear cache:", error);
  }
}

/**
 * Mark content as offline available
 */
export async function markForOfflineAvailability(
  contentId: string,
  content: string,
  type: "note" | "summary" | "exam"
): Promise<void> {
  const typeSuffix = type === "note" ? "NOTES_CACHE" : type === "summary" ? "SUMMARY_CACHE" : "EXAM_CACHE";
  const key = `${CACHE_KEYS[typeSuffix as keyof typeof CACHE_KEYS]}${contentId}`;
  await cacheContent(key, { id: contentId, content, type }, 7 * 24 * 60); // 7 days
}

/**
 * Get all offline available content
 */
export async function getOfflineAvailableContent(): Promise<
  Array<{ id: string; type: "note" | "summary" | "exam"; title: string }>
> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const offlineKeys = allKeys.filter((k) => k.startsWith("aibuddy_cache_"));
    
    const content = [];
    for (const key of offlineKeys) {
      const cached = await getCachedContent<{ id: string; title: string; type: string }>(key);
      if (cached) {
        content.push({
          id: cached.id,
          type: cached.type as "note" | "summary" | "exam",
          title: cached.title || key,
        });
      }
    }
    return content;
  } catch (error) {
    console.warn("Failed to get offline content:", error);
    return [];
  }
}

/**
 * Sync offline data when connection is restored
 */
export async function syncOfflineData(): Promise<void> {
  try {
    // This would sync any changes made offline with the backend
    // For now, just log that sync occurred
    console.log("Syncing offline data...");
    
    // In production, implement actual sync logic here
  } catch (error) {
    console.warn("Failed to sync offline data:", error);
  }
}

/**
 * Check storage space
 */
export async function getStorageStats(): Promise<{
  used: number;
  cacheSize: number;
  percentage: number;
}> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    let totalSize = 0;

    for (const key of allKeys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        totalSize += value.length;
      }
    }

    const cacheSize = await getCacheSize();
    const maxSize = 50 * 1024 * 1024; // Assume 50MB limit
    const percentage = Math.round((totalSize / maxSize) * 100);

    return {
      used: totalSize,
      cacheSize,
      percentage,
    };
  } catch (error) {
    console.warn("Failed to get storage stats:", error);
    return { used: 0, cacheSize: 0, percentage: 0 };
  }
}

/**
 * Optimize storage
 */
export async function optimizeStorage(): Promise<void> {
  try {
    // Clear expired cache
    await clearExpiredCache();
    
    // Remove oldest cache entries if storage is getting full
    const stats = await getStorageStats();
    if (stats.percentage > 80) {
      // Remove cache entries older than 3 days
      const thirtyDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter((k) => k.startsWith("aibuddy_cache_"));

      for (const key of cacheKeys) {
        const raw = await AsyncStorage.getItem(key);
        if (raw) {
          const entry: CacheEntry<unknown> = JSON.parse(raw);
          if (entry.timestamp < thirtyDaysAgo) {
            await AsyncStorage.removeItem(key);
          }
        }
      }
    }
  } catch (error) {
    console.warn("Failed to optimize storage:", error);
  }
}
