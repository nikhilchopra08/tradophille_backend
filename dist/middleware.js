"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("./config");
function authMiddleware(req, res, next) {
    console.log("middleware");
    const token = req.headers.authorization;
    if (!token) {
        res.status(403).json({ message: "Authorization token missing" });
        console.log("token nhi mila");
        return;
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, config_1.JWT_PASSWORD);
        if (payload) {
            req.id = payload.id;
            next(); // Continue to the next middleware
            console.log("sahi hai");
        }
        else {
            res.status(403).json({ message: "Invalid token" });
        }
    }
    catch (error) {
        res.status(403).json({ message: "You are not logged in" });
    }
}
exports.authMiddleware = authMiddleware;