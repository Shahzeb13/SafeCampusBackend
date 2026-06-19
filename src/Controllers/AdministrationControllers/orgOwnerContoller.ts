import { Request, Response } from "express";
import Organization from "../../Models/organizationModel.js";
import UserModal from "../../Models/userModel.js";
import campusModel from "../../Models/campusModel.js";
import { encryptPassword } from "../../Utils/hashPassword.js";
import { validateUsername, validateEmail } from "../../Utils/ValidateAuthData.js";

export async function getOrganizationbyOrgOwnerId(req: Request, res: Response) {
  console.log("get orgranization for org owner by his id route hit");
  try {
    const loggedInUserId = req?.user?.id;
    const loggedInUserRole = req?.user?.role;
    if (!loggedInUserId) {
      res.status(401).json({
        success: false,
        message: "User is not logged in"
      });
      return;
    }

    if (loggedInUserRole !== "organization_owner") {
      res.status(403).json({
        success: false,
        message: "LoggedIn user does not have authority to access an organization"
      });
      return;
    }

    const organization = await Organization.findOne({
      ownerUserId: loggedInUserId
    });

    if (!organization) {
      res.status(404).json({
        success: false,
        message: "organization not found for this owner"
      });
      return;
    }

    return res.status(200).json({
      success: true,
      message: "Organization Sucessfully Retreived",
      data: organization
    });

  } catch (error) {
    console.error("error in getOrganizationbyorgownerid contoller");
    if (error instanceof Error) {
      console.log("Error message", error.message);
      console.log("Stack Trace", error.stack);
    } else {
      console.log("Unknown error", error);
    }

    return res.status(500).json({
      sucess: false,
      message: "Internal Server Error Bro"
    });
  }
}

export async function createCampusAdmin(req: Request, res: Response) {
  console.log("create campus admin route hit");
  try {
    const loggedInUserId = req?.user?.id;
    const loggedInUserRole = req?.user?.role;
    const loggedInUserOrgId = req?.user?.organizationId;

    if (!loggedInUserId || loggedInUserRole !== "organization_owner" || !loggedInUserOrgId) {
      return res.status(403).json({
        success: false,
        message: "Not Authorized! Organization Owner access required."
      });
    }

    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are required."
      });
    }

    const isUsernameValid = validateUsername(username);
    if (!isUsernameValid.ok) {
      return res.status(400).json({ success: false, message: isUsernameValid.reason });
    }

    const isEmailValid = validateEmail(email);
    if (!isEmailValid.ok) {
      return res.status(400).json({ success: false, message: isEmailValid.reason });
    }

    const userExists = await UserModal.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await encryptPassword(password);

    const user = await UserModal.create({
      username,
      email,
      password: hashedPassword,
      role: "campus_admin",
      allowed_client: "web",
      organizationId: loggedInUserOrgId,
      status: "active"
    });

    return res.status(201).json({
      success: true,
      message: "Campus Admin created successfully.",
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        organizationId: user.organizationId
      }
    });

  } catch (error: any) {
    console.error("Error in createCampusAdmin:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
}

export async function assignCampusAdmin(req: Request, res: Response) {
  console.log("assign campus admin route hit");
  try {
    const loggedInUserId = req?.user?.id;
    const loggedInUserRole = req?.user?.role;
    const loggedInUserOrgId = req?.user?.organizationId;

    if (!loggedInUserId || loggedInUserRole !== "organization_owner" || !loggedInUserOrgId) {
      return res.status(403).json({
        success: false,
        message: "Not Authorized! Organization Owner access required."
      });
    }

    const { userId, campusId } = req.body;

    if (!userId || !campusId) {
      return res.status(400).json({
        success: false,
        message: "userId and campusId are required."
      });
    }

    // Find the user and verify they belong to this organization and have role 'campus_admin'
    const user = await UserModal.findOne({
      _id: userId,
      organizationId: loggedInUserOrgId,
      role: "campus_admin"
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Campus Admin user not found in your organization."
      });
    }

    // Find the campus and verify it belongs to this organization
    const campus = await campusModel.findOne({
      _id: campusId,
      organizationId: loggedInUserOrgId
    });

    if (!campus) {
      return res.status(404).json({
        success: false,
        message: "Campus not found in your organization."
      });
    }

    // Check if campus already has an admin
    if (campus.campusAdmins && campus.campusAdmins.length > 0) {
      return res.status(400).json({
        success: false,
        message: "This campus already has a campus admin assigned."
      });
    }

    // Remove this user from any other campus they might be assigned to
    await campusModel.updateMany(
      { organizationId: loggedInUserOrgId },
      { $pull: { campusAdmins: userId } }
    );

    // Assign user to campus
    if (!campus.campusAdmins) {
      campus.campusAdmins = [];
    }
    campus.campusAdmins.push(userId);
    await campus.save();

    // Update user's campusId
    user.campusId = campus._id;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Campus Admin successfully assigned to campus.",
      data: {
        userId: user._id,
        campusId: campus._id
      }
    });

  } catch (error: any) {
    console.error("Error in assignCampusAdmin:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
}

export async function getCampusAdmins(req: Request, res: Response) {
  console.log("get campus admins route hit");
  try {
    const loggedInUserId = req?.user?.id;
    const loggedInUserRole = req?.user?.role;
    const loggedInUserOrgId = req?.user?.organizationId;

    if (!loggedInUserId || loggedInUserRole !== "organization_owner" || !loggedInUserOrgId) {
      return res.status(403).json({
        success: false,
        message: "Not Authorized! Organization Owner access required."
      });
    }

    const admins = await UserModal.find({
      organizationId: loggedInUserOrgId,
      role: "campus_admin"
    }).populate("campusId", "name code").select("-password");

    return res.status(200).json({
      success: true,
      data: admins
    });

  } catch (error: any) {
    console.error("Error in getCampusAdmins:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
}

export async function editCampusAdmin(req: Request, res: Response) {
  console.log("edit campus admin route hit");
  try {
    const loggedInUserId = req?.user?.id;
    const loggedInUserRole = req?.user?.role;
    const loggedInUserOrgId = req?.user?.organizationId;

    if (!loggedInUserId || loggedInUserRole !== "organization_owner" || !loggedInUserOrgId) {
      return res.status(403).json({
        success: false,
        message: "Not Authorized! Organization Owner access required."
      });
    }

    const { id } = req.params;
    const { username, email, password } = req.body;

    const user = await UserModal.findOne({
      _id: id,
      organizationId: loggedInUserOrgId,
      role: "campus_admin"
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Campus Admin not found in your organization."
      });
    }

    if (username) {
      const isUsernameValid = validateUsername(username);
      if (!isUsernameValid.ok) {
        return res.status(400).json({ success: false, message: isUsernameValid.reason });
      }
      user.username = username;
    }

    if (email) {
      const isEmailValid = validateEmail(email);
      if (!isEmailValid.ok) {
        return res.status(400).json({ success: false, message: isEmailValid.reason });
      }

      const emailExists = await UserModal.findOne({ email, _id: { $ne: id } });
      if (emailExists) {
        return res.status(400).json({ success: false, message: "Email is already in use by another user." });
      }
      user.email = email;
    }

    if (password) {
      user.password = await encryptPassword(password);
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Campus Admin updated successfully.",
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });

  } catch (error: any) {
    console.error("Error in editCampusAdmin:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
}

export async function deleteCampusAdmin(req: Request, res: Response) {
  console.log("delete campus admin route hit");
  try {
    const loggedInUserId = req?.user?.id;
    const loggedInUserRole = req?.user?.role;
    const loggedInUserOrgId = req?.user?.organizationId;

    if (!loggedInUserId || loggedInUserRole !== "organization_owner" || !loggedInUserOrgId) {
      return res.status(403).json({
        success: false,
        message: "Not Authorized! Organization Owner access required."
      });
    }

    const { id } = req.params;

    const user = await UserModal.findOne({
      _id: id,
      organizationId: loggedInUserOrgId,
      role: "campus_admin"
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Campus Admin not found in your organization."
      });
    }

    // Pull this admin from all campuses in this organization
    await campusModel.updateMany(
      { organizationId: loggedInUserOrgId },
      { $pull: { campusAdmins: id } }
    );

    // Delete the user doc
    await UserModal.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Campus Admin deleted successfully and references removed."
    });

  } catch (error: any) {
    console.error("Error in deleteCampusAdmin:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
}

