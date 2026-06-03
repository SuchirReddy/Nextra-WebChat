import { ApiError } from "@/lib/errors";
import { adminRepo } from "@/server/repos/admin-repo";
import { userRepo } from "@/server/repos/user-repo";

export const adminService = {
  requireAdmin: async (userId: string) => {
    const isAdmin = await adminRepo.isAdmin(userId);
    if (!isAdmin) {
      throw new ApiError("Admin access required", 403);
    }
  },

  stats: async () => adminRepo.stats(),

  moderationSnapshot: async () => {
    const [users, reports] = await Promise.all([adminRepo.recentUsers(), adminRepo.recentReports()]);
    return { users, reports };
  },

  updateReportStatus: async (reportId: string, status: "open" | "in_review" | "resolved" | "dismissed", adminId: string) => 
    adminRepo.updateReportStatus(reportId, status, adminId),

  setUserBanState: async (userId: string, banned: boolean) => adminRepo.setUserRole(userId, banned ? "banned" : "user"),

  deleteMessage: async (messageId: string) => adminRepo.deleteMessage(messageId),

  getRole: async (userId: string) => {
    const user = await userRepo.getById(userId);
    if (!user) {
      throw new ApiError("User not found", 404);
    }
    return user.role;
  }
};
