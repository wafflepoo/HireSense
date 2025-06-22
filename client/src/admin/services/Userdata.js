// src/modules/admin/services/dummyData.js
export const getDummyUsers = () => [
  {
    id: 'user_1',
    firstName: 'Admin',
    lastName: 'Test',
    email: 'admin@hiresense.com',
    publicMetadata: {
      role: 'admin',
      subscription: 'enterprise'
    },
    cvsProcessed: 1243
  },
  {
    id: 'user_2',
    firstName: 'Recruteur',
    lastName: 'Pro',
    email: 'recruiter@company.com',
    publicMetadata: {
      role: 'recruiter',
      subscription: 'pro'
    },
    cvsProcessed: 876
  },
  {
    id: 'user_3',
    firstName: 'Candidat',
    lastName: 'Standard',
    email: 'candidate@email.com',
    publicMetadata: {
      role: 'candidate',
      subscription: 'starter'
    },
    cvsProcessed: 499 // Near limit
  }
];