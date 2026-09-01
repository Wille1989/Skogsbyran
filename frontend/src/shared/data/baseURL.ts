const meta = import.meta as ImportMeta & { env?: { 
    VITE_BACKEND_URL?: string; 
    VITE_API_URL?: string;
  };
};

const envBaseURL = meta.env?.VITE_BACKEND_URL || meta.env?.VITE_API_URL;

export const baseURL = envBaseURL || "http://127.0.0.1:8020";
