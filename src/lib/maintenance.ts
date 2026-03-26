import prisma from "./prisma";

/**
 * Checks if the site is in maintenance mode.
 * Useful for locking down API routes during maintenance.
 */
export async function isSiteInMaintenanceMode(): Promise<boolean> {
  try {
    const settings = await prisma.siteSettings.findUnique({ where: { id: "global" } });
    return settings?.isMaintenanceMode || false;
  } catch (error) {
    console.error("Failed to check maintenance mode:", error);
    return false; // Fallback to false if DB check fails
  }
}
