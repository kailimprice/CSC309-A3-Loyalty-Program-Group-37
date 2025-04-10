import { useLocation, useHistory } from "react-router-dom";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
export async function fetchServer(path, details, errors) {
    const response = await fetch(`${BACKEND_URL}/${path}`, details);
    if (!response.ok) {
        if (errors && errors[response.status])
            return [null, errors[response.status]];
        const responseJson = await response.json();
        return [null, `Error ${response.status}: ${responseJson['error']}`];
    }
    return [response, false];
}

export const PERMISSION_LEVELS = ['any', 'regular', 'cashier', 'manager', 'superuser'];
export function hasPerms(levelHas, levelNeeded) {
    const has = PERMISSION_LEVELS.findIndex(x => x == levelHas);
    const needed = PERMISSION_LEVELS.findIndex(x => x == levelNeeded);
    return has >= needed;
}

export function useQueryParams() {
    const location = useLocation();
    const history = useHistory();
  
    const addQueryParam = (key, value) => {
        const searchParams = new URLSearchParams(location.search);
        searchParams.set(key, value);
        history.push({
            search: searchParams.toString(),
        });
    };
    const removeQueryParam = (key) => {
        const searchParams = new URLSearchParams(location.search);
        searchParams.delete(key);
        history.push({
            search: searchParams.toString(),
        });
    };
    return { addQueryParam, removeQueryParam };
};
  