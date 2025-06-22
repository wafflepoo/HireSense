export const ROLES = {
  ADMIN: 'admin',
  RECRUITER: 'recruiter',
  CANDIDATE: 'candidate'
};

export const SUBSCRIPTION_TYPES = {
  STARTER: 'Starter',
  PRO: 'Pro',
  ENTERPRISE: 'Enterprise'
};

export const CV_LIMITS = {
  [SUBSCRIPTION_TYPES.STARTER]: 500,
  [SUBSCRIPTION_TYPES.PRO]: 2000,
  [SUBSCRIPTION_TYPES.ENTERPRISE]: 10000
};

export const JWT_SETTINGS = {
  EXPIRE_TIME: '24h'
};