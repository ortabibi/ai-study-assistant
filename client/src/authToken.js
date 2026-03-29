let authToken = null;
let authUser = null;

export function setAuthToken(token) {
  authToken = token || null;
}

export function getAuthToken() {
  return authToken;
}

export function setAuthUser(user) {
  authUser = user || null;
}

export function clearAuth() {
  authToken = null;
  authUser = null;
}

export function getAuthUser() {
  return authUser;
}

