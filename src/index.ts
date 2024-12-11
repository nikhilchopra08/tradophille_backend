import express, { Request, Response } from 'express';
import cors from "cors"
import { prismaClient } from "./db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authMiddleware } from './middleware';

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const app = express();
app.use(express.json());

app.use(cors());

app.post("/api/auth/register", async (req: Request, res: Response): Promise<any> => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    // Check if user already exists
    const existingUser = await prismaClient.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await prismaClient.user.create({
      data: { name, email, password: hashedPassword },
    });

    res.status(201).json({ message: "User registered successfully.", user: newUser });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

app.post("/api/auth/login", async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    // Find user by email
    const user = await prismaClient.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "10h" });

    res.status(200).json({ message: "Login successful.", token });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

app.get('/api/posts', async (req: Request, res: Response) => {
    try {
      const { verified } = req.query;
  
      let filter = {};
      if (verified === 'true') {
        filter = { verified: true };
      } else if (verified === 'false') {
        filter = { verified: false };
      }
  
      const posts = await prismaClient.blog.findMany({ where: filter });
      res.json(posts);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

app.post('/api/posts', async (req: Request, res: Response) => {
    const { title, excerpt, content, image } = req.body;
  
    try {
      const newPost = await prismaClient.blog.create({
        data: {
          title,
          excerpt,
          content,
          image,
          verified: false, // explicitly setting verified to false
        },
      });
      res.status(201).json(newPost);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  app.patch('/api/posts/:id/verify', authMiddleware , async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;

    try {
        const updatedPost = await prismaClient.blog.update({
            where: { id },
            data: { verified: true },
        });

        if (!updatedPost) {
            return res.status(404).json({ error: 'Blog post not found' });
        }

        res.json(updatedPost);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(3001, () => {
    console.log("Running on localhost 3001");
});