const isElectron = !!window.api;
const API_URL = "http://10.0.2.2:3000"; 

export async function loginUser(data) {
  if (isElectron) {
    return window.api.loginUser(data);
  }

  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return res.json();
}

export async function registerUser(data) {
  if (isElectron) {
    return window.api.registerUser(data);
  }

  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return res.json();
}

export async function updateUserCity(data) {
  if (isElectron) {
    return window.api.updateUserCity(data);
  }

  const res = await fetch(`${API_URL}/user/city`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return res.json();
}

export async function addWeatherHistory(data) {
  if (isElectron) {
    return window.api.addWeatherHistory(data);
  }

  const res = await fetch(`${API_URL}/weather/history`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return res.json();
}
