function getRandomInstance() {
  const Instance = [45333];
  const randomIndex = Math.floor(Math.random() * Instance.length);
  return Instance[randomIndex];
}

module.exports = { getRandomInstance };
