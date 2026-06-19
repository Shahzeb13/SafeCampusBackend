import { Request, Response } from "express";
import UserModal from "../../Models/userModel.js";
import { encryptPassword } from "../../Utils/hashPassword.js";
import { validateEmail } from "../../Utils/ValidateAuthData.js";
import { isSuperAdmin } from "../../Types/TypePredicates/roleHelpers.js";
import Organization from "../../Models/organizationModel.js";

/**
 * @desc    Assign a user as an OrgOwner to a specific Organization
 * @route   POST /api/admin/super/assign-org-owner
 */
export const createAndAssignOrgOwner = async (req: Request, res: Response) => {
    try {
        if (!isSuperAdmin(req.user?.role!)) {
            return res.status(403).json({ success: false, message: "Only Super Admin can perform this action." });
        }

        const { username, email, password, organizationId } = req.body;
        if (!username || !email || !password || !organizationId) {
            return res.status(400).json({ success: false, message: "Missing required fields (username, email, password, organizationId)." });
        }

        const emailCheck = validateEmail(email);
        if (!emailCheck.ok) return res.status(400).json({ success: false, message: emailCheck.reason });

        const existingUser = await UserModal.findOne({ email });
        if (existingUser) return res.status(400).json({ success: false, message: "User with this email already exists." });

        const hashedPassword = await encryptPassword(password);
        const user = await UserModal.create({
            username,
            email,
            password: hashedPassword,
            role: "organization_owner",
            allowed_client: "web",
            organizationId,
        });

        // link organization
        const org = await Organization.findById(organizationId);
        if (!org) {
            // rollback user creation if org not found
            await UserModal.findByIdAndDelete(user._id);
            return res.status(404).json({ success: false, message: "Organization not found." });
        }
        // Validation: ensure only one owner per organization
        // if (org.ownerUserId) {
        //     // rollback created user
        //     await UserModal.findByIdAndDelete(user._id);
        //     return res.status(400).json({ success: false, message: "Organization already has an owner." });
        // }
        // Establish bi‑directional link
        org.ownerUserId = user._id;
        await org.save();
        // user already has organizationId set
        await user.save();

        res.status(201).json({
            success: true,
            message: "Organization Owner created and linked successfully",
            user: { id: user._id, username, email, role: user.role, organizationId },
        });
    } catch (error: any) {
        console.error("Error in createAndAssignOrgOwner:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

/**
 * @desc    Delete an Organization Owner and clean up references (SuperAdmin only)
 * @route   DELETE /api/admin/super/org-owner
 */
export const deleteOrgOwner = async (req: Request, res: Response) => {
    try {
        if (!isSuperAdmin(req.user?.role!)) {
            return res.status(403).json({ success: false, message: "Only Super Admin can perform this action." });
        }
        const { userId, organizationId } = req.body;
        if (!userId || !organizationId) {
            return res.status(400).json({ success: false, message: "Missing userId or organizationId." });
        }
        const user = await UserModal.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found." });
        const org = await Organization.findById(organizationId);
        if (!org) return res.status(404).json({ success: false, message: "Organization not found." });
        // Ensure the user is indeed the owner
        if (org.ownerUserId?.toString() !== userId) {
            return res.status(400).json({ success: false, message: "User is not the owner of this organization." });
        }
        // Remove references
        org.ownerUserId = undefined as any;
        await org.save();
        await UserModal.findByIdAndDelete(userId);
        return res.status(200).json({ success: true, message: "Organization Owner deleted successfully." });
    } catch (error: any) {
        console.error("Error in deleteOrgOwner:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
