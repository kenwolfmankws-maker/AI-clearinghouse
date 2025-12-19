export type OrgRole = 'admin' | 'member' | 'viewer';

export const canManageMembers = (role: string): boolean => {
  return role === 'admin';
};

export const canManageSettings = (role: string): boolean => {
  return role === 'admin';
};

export const canViewAnalytics = (role: string): boolean => {
  return ['admin', 'member'].includes(role);
};

export const canManageCollections = (role: string): boolean => {
  return ['admin', 'member'].includes(role);
};

export const canViewCollections = (role: string): boolean => {
  return ['admin', 'member', 'viewer'].includes(role);
};

export const canDeleteOrganization = (role: string): boolean => {
  return role === 'admin';
};

export const getRolePermissions = (role: OrgRole) => {
  return {
    canManageMembers: canManageMembers(role),
    canManageSettings: canManageSettings(role),
    canViewAnalytics: canViewAnalytics(role),
    canManageCollections: canManageCollections(role),
    canViewCollections: canViewCollections(role),
    canDeleteOrganization: canDeleteOrganization(role)
  };
};
