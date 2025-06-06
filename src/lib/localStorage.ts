export function saveToLocalStorage<T>(key: string, value: T): void {
  if (typeof window !== 'undefined') {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error(`Error saving to localStorage: ${key}`, error);
    }
  }
}

export function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window !== 'undefined') {
    try {
      const serializedValue = localStorage.getItem(key);
      if (serializedValue === null) {
        return defaultValue;
      }
      return JSON.parse(serializedValue);
    } catch (error) {
      console.error(`Error loading from localStorage: ${key}`, error);
      return defaultValue;
    }
  }
  return defaultValue;
}
