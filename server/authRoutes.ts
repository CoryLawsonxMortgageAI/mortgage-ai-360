import type { Express } from "express";
import { isAuthenticated, logAudit } from "./replitAuth";

export function registerAuthRoutes(app: Express) {
  // Get current user endpoint for frontend
  app.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const user: any = req.user;
      
      if (!user?.dbUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Log access to user data
      await logAudit(user.dbUser.id, user.dbUser.email, "view_pii", req, {
        resource: "user_profile",
      });

      // Return user information (excluding sensitive session data)
      res.json({
        id: user.dbUser.id,
        openId: user.dbUser.openId,
        name: user.dbUser.name,
        email: user.dbUser.email,
        role: user.dbUser.role,
        loginMethod: user.dbUser.loginMethod,
        createdAt: user.dbUser.createdAt,
        lastSignedIn: user.dbUser.lastSignedIn,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}
