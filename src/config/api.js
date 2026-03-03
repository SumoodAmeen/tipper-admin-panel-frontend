export const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const getMediaUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const serverRoot = BASE_URL.replace(/\/api(\/.*)?$/, '');
    return `${serverRoot}${path}`;
};
