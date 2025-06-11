
/**
 * Checks if the code is running in a browser environment.
 * @returns {boolean} True if in a browser, false otherwise.
 */
const isBrowser = typeof window !== 'undefined';

/**
 * Saves a value to localStorage with SSR safety.
 * Logs an error to the console if saving fails (e.g., JSON stringification error or localStorage quota exceeded).
 *
 * @template T The type of the value to save.
 * @param {string} key The key under which to store the value.
 * @param {T} value The value to store. Must be JSON-serializable.
 */
export function saveToLocalStorage<T>(key: string, value: T): void {
  if (!isBrowser) {
    // console.debug(`[LocalStorage] Not in browser environment. Skipping save for key: "${key}".`);
    return;
  }

  try {
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
  } catch (error) {
    console.error(`[LocalStorage] Error saving item "${key}":`, error);
  }
}

/**
 * Loads a value from localStorage with SSR safety.
 * Returns a default value if the key is not found or if an error occurs during parsing.
 * Logs an error to the console if loading or parsing fails.
 *
 * @template T The expected type of the value to load.
 * @param {string} key The key of the value to retrieve.
 * @param {T} defaultValue The value to return if the key is not found or parsing fails.
 * @returns {T} The retrieved value, or the defaultValue.
 */
export function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  if (!isBrowser) {
    // console.debug(`[LocalStorage] Not in browser environment. Returning default value for key: "${key}".`);
    return defaultValue;
  }

  try {
    const serializedValue = localStorage.getItem(key);
    if (serializedValue === null) {
      // console.info(`[LocalStorage] Item "${key}" not found in localStorage. Returning default value.`);
      return defaultValue;
    }
    // Note: This type assertion `as T` assumes the stored data structure matches the expected type `T`.
    // For critical data, consider schema validation (e.g., with Zod) after parsing
    // to ensure type safety before returning.
    return JSON.parse(serializedValue) as T;
  } catch (error) {
    console.error(`[LocalStorage] Error loading or parsing item "${key}" from localStorage. Returning default value. Error:`, error);
    return defaultValue;
  }
}

/**
 * Removes an item from localStorage with SSR safety.
 * Logs an error to the console if removal fails (though this is rare for localStorage.removeItem).
 *
 * @param {string} key The key of the item to remove.
 */
export function removeFromLocalStorage(key: string): void {
  if (!isBrowser) {
    // console.debug(`[LocalStorage] Not in browser environment. Skipping remove for key: "${key}".`);
    return;
  }

  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`[LocalStorage] Error removing item "${key}" from localStorage:`, error);
  }
}
