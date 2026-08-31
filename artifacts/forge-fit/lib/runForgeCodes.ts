export function createRunForgeClientId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 11).toUpperCase();
  return `forge-fit-${timestamp}-${random}`;
}