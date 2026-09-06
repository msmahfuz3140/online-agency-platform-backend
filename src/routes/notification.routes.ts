import { Router, Request, Response } from "express";
import {
  getAdminNotifications,
  getClientNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../services/notification.service.js";

const router = Router();

/**
 * GET /api/notifications
 * Fetches real notifications for admin or client
 */
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const role = (req.query.role as string) || "admin";
    const email = (req.query.email as string) || "";

    if (role === "client") {
      const data = await getClientNotifications(email);
      res.json({ success: true, ...data });
      return;
    }

    const data = await getAdminNotifications();
    res.json({ success: true, ...data });
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, error: "Failed to fetch notifications." });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a specific notification as read
 */
router.patch("/:id/read", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const ok = await markNotificationAsRead(id);
    res.json({ success: ok });
  } catch (error: any) {
    console.error("Error marking notification read:", error);
    res.status(500).json({ success: false, error: "Failed to update notification." });
  }
});

/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications for role as read
 */
router.post("/mark-all-read", async (req: Request, res: Response): Promise<void> => {
  try {
    const { role = "admin", email } = req.body;
    await markAllNotificationsAsRead(role, email);
    res.json({ success: true, message: "All notifications marked as read." });
  } catch (error: any) {
    console.error("Error marking all notifications read:", error);
    res.status(500).json({ success: false, error: "Failed to update notifications." });
  }
});

export default router;
