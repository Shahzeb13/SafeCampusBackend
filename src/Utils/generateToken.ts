
import jwt from "jsonwebtoken";

const generateToken = (id: string, role: string) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || "fallbackSecretNoOneShouldKnow", {
        expiresIn: "30d",
    });
};

export default generateToken;
