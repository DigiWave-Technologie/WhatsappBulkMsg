function insatnceforqr() {
  const Instance = [42888];
  const randomIndex = Math.floor(Math.random() * Instance.length);
  return Instance[randomIndex];
}

module.exports = { insatnceforqr };
