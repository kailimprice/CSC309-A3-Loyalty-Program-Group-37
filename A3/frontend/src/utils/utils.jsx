const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export async function fetchServer(path, details, errors) {
    console.log('Path: ' + `${BACKEND_URL} + ${path} + ${JSON.stringify(details)}`)
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
  

export function validatePassword(password) {
    if (password == '')
        return false;
    if (password.length < 8 || password.length > 20)
        return 'Password must be 8-20 characters long';
    if (!/[a-z]/.test(password))
        return 'Password must contain a lower-case letter';
    if (!/[A-Z]/.test(password))
        return 'Password must contain an upper-case letter';
    if (!/\d/.test(password))
        return 'Password must contain a digit';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
        return 'Password must contain a special character';
    return false;
}

export function queryRemoveLimit(params) {
    if (params.length == 0)
        return '';
    const split = params.slice(1).split('&');
    return `?${split.filter(x => !x.startsWith('limit=')).join('&')}`;
}