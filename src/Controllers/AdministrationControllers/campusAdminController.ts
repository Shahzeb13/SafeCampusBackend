
import {Request , Response}  from "express";
import campusModel from "../../Models/campusModel.js";
import { validateEmail, validateUsername } from "../../Utils/ValidateAuthData.js";
import { encryptPassword } from "../../Utils/hashPassword.js";
import UserModel from "../../Models/userModel.js";
export async function getcampusAdminOrganziation(req: Request , res: Response){

    try {

     const userId = req.user!.id;
        const role = req.user!.role;

     if (role !== "campus_admin") {
  return res.status(403).json({
    success: false,
    message: "Access denied",
  });
}
   const campus = await campusModel.findOne({
  campusAdmins: userId,
});

    if (!campus) {
      return res.status(404).json({
        success: false,
        message: "Campus not found",
      });
    }

    return res.status(200).json({
      success: true,
      campus,
    });

    }
    catch(err: any){
        console.log("Server Error Occured during campus retriaval for campusADmin");
        console.log("message" , err.message);
        console.log("stack Trace" , err.stack);

        return res.status(500).json({success: false, message: "Internal Server Error"})
    }
}



export async function createStudentStaff(req: Request, res: Response) {
  console.log("create student/Staff route hit");
  try {
    const loggedInUserId = req?.user?.id;
    const loggedInUserRole = req?.user?.role;
    const loggedInUserCampusId = req?.user?.campusId;
    const loggedInUserOrgId = req?.user?.organizationId;


    if (!loggedInUserId || loggedInUserRole !== "campus_admin" || !loggedInUserCampusId || !loggedInUserOrgId) {
      return res.status(403).json({
        success: false,
        message: "Not Authorized! CampusAdmin access required."
      });
    }

    const { username, email, password , role} = req.body;



    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are required."
      });
    }

    if(!["student", "staff"].includes(role)){
        return res.status(401).json({sucess:"false" , message:"This api can only fucking create student and staff roles bruh"});
    }

    const isUsernameValid = validateUsername(username);
    if (!isUsernameValid.ok) {
      return res.status(400).json({ success: false, message: isUsernameValid.reason });
    }

    const isEmailValid = validateEmail(email);
    if (!isEmailValid.ok) {
      return res.status(400).json({ success: false, message: isEmailValid.reason });
    }

    const userExists = await UserModel.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await encryptPassword(password);



    const creationRole = role === "student" ? "student" : "staff"
    const user = await UserModel.create({
      username,
      email,
      password: hashedPassword,
      role: creationRole,
      allowed_client: "mobile",
      campusId: loggedInUserCampusId,
      organizationId: loggedInUserOrgId,
      status: "active"
    });

    return res.status(201).json({
      success: true,
      message: `${creationRole} created successfully.`,
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
    console.error("Error in createStudentStaff:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
}



export async function createSecurityPersonel(req: Request, res: Response) {
  console.log("create student/Staff route hit");
  try {
    const loggedInUserId = req?.user?.id;
    const loggedInUserRole = req?.user?.role;
    const loggedInUserCampusId = req?.user?.campusId;
    const loggedInUserOrgId = req?.user?.organizationId;


    if (!loggedInUserId || loggedInUserRole !== "campus_admin" || !loggedInUserCampusId || !loggedInUserOrgId) {
      return res.status(403).json({
        success: false,
        message: "Not Authorized! CampusAdmin access required."
      });
    }

    const { username, email, password , role} = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are required."
      });
    }

    if(!["security_personnel", "security_incharge"].includes(role)){
        return res.status(401).json({sucess:"false" , message:"This api can only fucking create securityPersonal bruh"});
    }

    const isUsernameValid = validateUsername(username);
    if (!isUsernameValid.ok) {
      return res.status(400).json({ success: false, message: isUsernameValid.reason });
    }

    const isEmailValid = validateEmail(email);
    if (!isEmailValid.ok) {
      return res.status(400).json({ success: false, message: isEmailValid.reason });
    }

    const userExists = await UserModel.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await encryptPassword(password);
  

    const creationRole = role === "security_incharge" ? "security_incharge" : "security_personnel"
    const allowedClient = creationRole === 'security_incharge'? "web": "mobile";
    const user = await UserModel.create({
      username,
      email,
      password: hashedPassword,
      role: creationRole,
      allowed_client: allowedClient,
      campusId: loggedInUserCampusId,
      organizationId: loggedInUserOrgId,
      status: "active"
      
    });

    return res.status(201).json({
      success: true,
      message: `${creationRole} created successfully.`,
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
    console.error("Error in createSecurityPersonell:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
}

export async function getStudentsStaff(req: Request, res: Response) {
  try {
    const loggedInUserRole = req?.user?.role;
    const loggedInUserCampusId = req?.user?.campusId;

    if (loggedInUserRole !== "campus_admin" || !loggedInUserCampusId) {
      return res.status(403).json({ success: false, message: "Not Authorized" });
    }

    const users = await UserModel.find({
      campusId: loggedInUserCampusId,
      role: { $in: ["student", "staff"] },
      status: { $ne: "suspended" } // optionally hide suspended
    }).select("-password");

    return res.status(200).json({ success: true, data: users });
  } catch (error: any) {
    console.error("Error in getStudentsStaff:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

export async function updateStudent(req: Request, res: Response) {
  try {
    const loggedInUserRole = req?.user?.role;
    const loggedInUserCampusId = req?.user?.campusId;
    const userIdToUpdate = req.params.id;

    if (loggedInUserRole !== "campus_admin" || !loggedInUserCampusId) {
      return res.status(403).json({ success: false, message: "Not Authorized" });
    }

    const { username, email, password, status, rollNumber, universityName, departmentName, program, semester, section, phoneNumber } = req.body;
    
    let updateData: any = { username, email, status, rollNumber, universityName, departmentName, program, semester, section, phoneNumber };
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    if (password) {
       updateData.password = await encryptPassword(password);
    }

    if (email) {
      const isEmailValid = validateEmail(email);
      if (!isEmailValid.ok) return res.status(400).json({ success: false, message: isEmailValid.reason });
      const existingUser = await UserModel.findOne({ email, _id: { $ne: userIdToUpdate } });
      if (existingUser) return res.status(400).json({ success: false, message: "Email is already in use" });
    }

    if (username) {
      const isUsernameValid = validateUsername(username);
      if (!isUsernameValid.ok) return res.status(400).json({ success: false, message: isUsernameValid.reason });
    }

    const user = await UserModel.findOneAndUpdate(
      { _id: userIdToUpdate, campusId: loggedInUserCampusId, role: "student" },
      updateData,
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    return res.status(200).json({ success: true, message: "Student updated successfully", data: user });
  } catch (error: any) {
    console.error("Error in updateStudent:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

export async function deleteStudent(req: Request, res: Response) {
  try {
    const loggedInUserRole = req?.user?.role;
    const loggedInUserCampusId = req?.user?.campusId;
    const userIdToDelete = req.params.id;

    if (loggedInUserRole !== "campus_admin" || !loggedInUserCampusId) {
      return res.status(403).json({ success: false, message: "Not Authorized" });
    }

    const user = await UserModel.findOneAndUpdate(
      { _id: userIdToDelete, campusId: loggedInUserCampusId, role: "student" },
      { status: "suspended" },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    return res.status(200).json({ success: true, message: "Student suspended successfully" });
  } catch (error: any) {
    console.error("Error in deleteStudent:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

export async function updateStaff(req: Request, res: Response) {
  try {
    const loggedInUserRole = req?.user?.role;
    const loggedInUserCampusId = req?.user?.campusId;
    const userIdToUpdate = req.params.id;

    if (loggedInUserRole !== "campus_admin" || !loggedInUserCampusId) {
      return res.status(403).json({ success: false, message: "Not Authorized" });
    }

    const { username, email, password, status, departmentName, phoneNumber } = req.body;
    
    let updateData: any = { username, email, status, departmentName, phoneNumber };
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    if (password) {
       updateData.password = await encryptPassword(password);
    }

    if (email) {
      const isEmailValid = validateEmail(email);
      if (!isEmailValid.ok) return res.status(400).json({ success: false, message: isEmailValid.reason });
      const existingUser = await UserModel.findOne({ email, _id: { $ne: userIdToUpdate } });
      if (existingUser) return res.status(400).json({ success: false, message: "Email is already in use" });
    }

    if (username) {
      const isUsernameValid = validateUsername(username);
      if (!isUsernameValid.ok) return res.status(400).json({ success: false, message: isUsernameValid.reason });
    }

    const user = await UserModel.findOneAndUpdate(
      { _id: userIdToUpdate, campusId: loggedInUserCampusId, role: "staff" },
      updateData,
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "Staff not found" });
    }

    return res.status(200).json({ success: true, message: "Staff updated successfully", data: user });
  } catch (error: any) {
    console.error("Error in updateStaff:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

export async function deleteStaff(req: Request, res: Response) {
  try {
    const loggedInUserRole = req?.user?.role;
    const loggedInUserCampusId = req?.user?.campusId;
    const userIdToDelete = req.params.id;

    if (loggedInUserRole !== "campus_admin" || !loggedInUserCampusId) {
      return res.status(403).json({ success: false, message: "Not Authorized" });
    }

    const user = await UserModel.findOneAndUpdate(
      { _id: userIdToDelete, campusId: loggedInUserCampusId, role: "staff" },
      { status: "suspended" },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "Staff not found" });
    }

    return res.status(200).json({ success: true, message: "Staff suspended successfully" });
  } catch (error: any) {
    console.error("Error in deleteStaff:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

// Security Personnel
export async function getSecurityPersonnel(req: Request, res: Response) {
  try {
    const loggedInUserRole = req?.user?.role;
    const loggedInUserCampusId = req?.user?.campusId;

    if (loggedInUserRole !== "campus_admin" || !loggedInUserCampusId) {
      return res.status(403).json({ success: false, message: "Not Authorized" });
    }

    const users = await UserModel.find({
      campusId: loggedInUserCampusId,
      role: { $in: ["security_personnel", "security_incharge"] },
      status: { $ne: "suspended" }
    }).select("-password");

    return res.status(200).json({ success: true, data: users });
  } catch (error: any) {
    console.error("Error in getSecurityPersonnel:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

export async function updateSecurityPersonnel(req: Request, res: Response) {
  try {
    const loggedInUserRole = req?.user?.role;
    const loggedInUserCampusId = req?.user?.campusId;
    const userIdToUpdate = req.params.id;

    if (loggedInUserRole !== "campus_admin" || !loggedInUserCampusId) {
      return res.status(403).json({ success: false, message: "Not Authorized" });
    }

    const { username, role, status } = req.body;

    const user = await UserModel.findOneAndUpdate(
      { _id: userIdToUpdate, campusId: loggedInUserCampusId, role: { $in: ["security_personnel", "security_incharge"] } },
      { username, role, status },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "Security personnel not found" });
    }

    return res.status(200).json({ success: true, message: "Updated successfully", data: user });
  } catch (error: any) {
    console.error("Error in updateSecurityPersonnel:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

export async function deleteSecurityPersonnel(req: Request, res: Response) {
  try {
    const loggedInUserRole = req?.user?.role;
    const loggedInUserCampusId = req?.user?.campusId;
    const userIdToDelete = req.params.id;

    if (loggedInUserRole !== "campus_admin" || !loggedInUserCampusId) {
      return res.status(403).json({ success: false, message: "Not Authorized" });
    }

    const user = await UserModel.findOneAndUpdate(
      { _id: userIdToDelete, campusId: loggedInUserCampusId, role: { $in: ["security_personnel", "security_incharge"] } },
      { status: "suspended" },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "Security personnel not found" });
    }

    return res.status(200).json({ success: true, message: "Security personnel suspended successfully" });
  } catch (error: any) {
    console.error("Error in deleteSecurityPersonnel:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}
