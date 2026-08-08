const history = new Map();

export function addHistorySample(serviceId, sample, limit = 60) {
  const samples = history.get(serviceId) ?? [];

  samples.push(sample);

  while (samples.length > limit) {
    samples.shift();
  }

  history.set(serviceId, samples);
}

export function getHistory(serviceId) {
  return history.get(serviceId) ?? [];
}

export function getAllHistory() {
  return Object.fromEntries(history);
}
