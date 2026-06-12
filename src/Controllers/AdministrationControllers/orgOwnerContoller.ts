import {Request , Response } from "express"
import Organization from "../../Models/organizationModel.js";


export async function getOrganizationbyOrgOwnerId(req: Request , res: Response){
console.log("get orgranization for org owner by his id route hit");
    try{
       
             const loggedInUserId= req?.user?.id;
            const loggedInUserRole = req?.user?.role;
             if(!loggedInUserId){
                res.status(401).json({
                    success: false,
                    message: "User is not logged in"
                })
                return;

             }  

             if(loggedInUserRole !== "organization_owner"){
                res.status(403).json({
                    success : false,
                    message: "LoggedIn user does not have authority to access an organization"
                })
                return;
             }


             const organization = await Organization.findOne({
                ownerUserId:loggedInUserId
             })

             if(!organization){
                res.status(404).json({
                    success : false,
                    message: "organization not found for this owner"
                })
                return;
             }

             
             return res.status(200).json({
                success: true,
                message: "Organization Sucessfully Retreived",
                data: organization
             })
        




       

    
    } catch(error){
        console.error("error in getOrganizationbyorgownerid contoller");
        if(error instanceof Error){
            console.log("Error message" , error.message);
            console.log("Stack Trace" , error.stack);
           
        }
        else{
            console.log("Unknown error" , error)
        }

        return res.status(500).json({
            sucess: false,
            message: "Internal Server Error Bro"
            
        })
    }


}




