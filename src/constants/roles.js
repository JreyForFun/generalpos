export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
};

export const ROLE_LABELS = {
  admin: 'Admin',
  manager: 'Manager',
  cashier: 'Cashier',
};

/** Roles that can access admin panels */
export const ADMIN_ROLES = [ROLES.ADMIN, ROLES.MANAGER];

/** Check if a role can access admin features */
export const isAdmin = (role) => ADMIN_ROLES.includes(role);
