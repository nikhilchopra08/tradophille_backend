"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const db_1 = require("./db");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const middleware_1 = require("./middleware");
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.post("/api/auth/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: "All fields are required." });
    }
    try {
        // Check if user already exists
        const existingUser = yield db_1.prismaClient.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: "User already exists." });
        }
        // Hash password
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        // Create new user
        const newUser = yield db_1.prismaClient.user.create({
            data: { name, email, password: hashedPassword },
        });
        res.status(201).json({ message: "User registered successfully.", user: newUser });
    }
    catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ message: "Internal server error." });
    }
}));
app.post("/api/auth/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }
    try {
        // Find user by email
        const user = yield db_1.prismaClient.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password." });
        }
        // Compare passwords
        const isPasswordValid = yield bcrypt_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password." });
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "10h" });
        res.status(200).json({ message: "Login successful.", token });
    }
    catch (error) {
        console.error("Error logging in:", error);
        res.status(500).json({ message: "Internal server error." });
    }
}));
app.get('/api/posts', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { verified } = req.query;
        let filter = {};
        if (verified === 'true') {
            filter = { verified: true };
        }
        else if (verified === 'false') {
            filter = { verified: false };
        }
        const posts = yield db_1.prismaClient.blog.findMany({ where: filter });
        res.json(posts);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}));
app.post('/api/posts', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, excerpt, content, image } = req.body;
    try {
        const newPost = yield db_1.prismaClient.blog.create({
            data: {
                title,
                excerpt,
                content,
                image,
                verified: false, // explicitly setting verified to false
            },
        });
        res.status(201).json(newPost);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}));
app.patch('/api/posts/:id/verify', middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const updatedPost = yield db_1.prismaClient.blog.update({
            where: { id },
            data: { verified: true },
        });
        if (!updatedPost) {
            return res.status(404).json({ error: 'Blog post not found' });
        }
        res.json(updatedPost);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}));
app.listen(3001, () => {
    console.log("Running on localhost 3001");
});
