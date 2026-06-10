import en from './en.json';

// Flatten nested JSON object to dotted keys
function flattenObject(obj: any, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const val = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        Object.assign(result, flattenObject(val, newKey));
      } else {
        result[newKey] = String(val);
      }
    }
  }
  
  return result;
}

const flattenedEn = flattenObject(en);

// Helper to format string with arguments (e.g., "Hello {name}" -> "Hello Sulagna")
function formatString(template: string, args: Record<string, any> = {}): string {
  let formatted = template;
  for (const key in args) {
    if (Object.prototype.hasOwnProperty.call(args, key)) {
      formatted = formatted.replace(new RegExp(`\\{${key}\\}`, 'g'), String(args[key]));
    }
  }
  return formatted;
}

// Build the 'm' object where each key maps to a format function
export const m = new Proxy({} as any, {
  get(_, prop: string) {
    const template = flattenedEn[prop] || prop;
    return (args?: Record<string, any>) => formatString(template, args);
  }
});

export function getLocale() {
  return "en";
}

export function setLocale(newLocale: string) {
  // Mock locale updates
  console.log("Mock locale set to", newLocale);
}
