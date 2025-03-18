/**
 * Utility functions for authentication
 */

/**
 * Check if the current user is an admin based on their role
 * @returns boolean
 */
export const isAdmin = (): boolean => {
  try {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return user.role === 'Admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Verify if the provided credentials match the admin credentials
 * @param email - Email to check
 * @param password - Password to check
 * @returns boolean indicating if credentials match admin credentials
 */
export const checkAdminCredentials = (email: string, password: string): boolean => {
  // Use hardcoded values instead of environment variables for reliability
  return (
    email === "admin@cardshow.com" &&
    password === "Admin123!@#"
  );
};

/**
 * Create an admin user object with hardcoded values
 * @returns Admin user object
 */
export const createAdminUser = () => {
  return {
    id: 1000,
    name: "Admin",
    email: "admin@cardshow.com",
    role: "Admin",
    status: "Active",
    joined: new Date().toISOString().split('T')[0]
  };
}; 