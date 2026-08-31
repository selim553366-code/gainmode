const CODE_PREFIX = 'Forge';

function createCandidateCode() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2).toUpperCase();
  return `${CODE_PREFIX}${`${timestamp}${random}`.slice(-10)}`;
}

export function generateRunForgeDiscountCode(existing?: string | null) {
  if (existing?.startsWith(CODE_PREFIX)) return existing;
  return createCandidateCode();
}