let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

export const getAccessToken = () => {
  return accessToken;
};

export const clearAccessToken = () => {
  accessToken = null;
};

export const setRefreshToken = (token) => {
  sessionStorage.setItem('refreshToken', token);
};

export const getRefreshToken = () => {
  return sessionStorage.getItem('refreshToken');
};

export const clearRefreshToken = () => {
  sessionStorage.removeItem('refreshToken');
};

export const clearAllTokens = () => {
  accessToken = null;
  sessionStorage.removeItem('refreshToken');
};
