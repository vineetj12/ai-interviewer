import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { User, Score, QA, Qno, Image } from './model';
import multer from 'multer';
import { AssemblyAI } from 'assemblyai';
import fs from 'fs';

dotenv.config();

const url = process.env.mongourl || '';
const jwtpassword = process.env.jsonpassword || '';
const app = express();
app.use(cors());
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true, limit: '8mb' }));

const genAI: any = new GoogleGenerativeAI(process.env.gemini_key);
// use a currently available model; gemini-1.5-flash is not supported by v1beta
// switching to the base gemini-1.5 (or adjust via env variable if needed)
const model: any = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5' });

// simple JWT verification helper
function verifyjson(token?: string): string | { error: string } {
  if (!token) {
    // do not attempt verify when missing
    return { error: 'Missing token' };
  }
  try {
    const decoded: any = jwt.verify(token, jwtpassword);
    return decoded.username;
  } catch (error: any) {
    console.error('JWT Verification Failed:', error.message || error);
    return { error: 'Invalid token' };
  }
}

// middleware to protect routes expecting authentication
function authenticate(req: any, res: Response, next: () => void) {
  const token = req.header('jwttoken');
  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }
  const verified = verifyjson(token);
  if (typeof verified === 'object' && 'error' in verified) {
    return res.status(401).json({ error: verified.error });
  }
  // attach username for convenience
  req.username = verified;
  next();
}

async function finduser(username: string) {
  return await User.findOne({ username });
}

app.post('/signup', async (req: Request, res: Response) => {
  try {
    const username = req.headers['username'] as string;
    const password = req.headers['password'] as string;
    const existingUser = await finduser(username);

    if (existingUser) return res.json({ mes: false });

    const newUser = new User({ username, password });
    await newUser.save();
    res.json({ mes: true });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ mes: 'Internal server error' });
  }
});

app.post('/signin', async (req: Request, res: Response) => {
  try {
    const username = req.headers['username'] as string;
    const password = req.headers['password'] as string;
    const existingUser = await User.findOne({ username, password });

    if (existingUser) {
      const token = jwt.sign({ username }, jwtpassword, { expiresIn: '1h' });
      return res.json({ mes: 'true', jwttoken: token });
    }
    return res.json({ mes: 'false' });
  } catch (error) {
    console.error('Signin Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/score', async (req: Request, res: Response) => {
  try {
    const username = req.headers['username'] as string;
    if (!username) return res.status(400).json({ error: 'Username is required' });

    let lastscore = await Score.findOne({ username });
    if (!lastscore) {
      lastscore = new Score({ username, lastscore: '' });
      await lastscore.save();
    }

    let q = await QA.findOne({ username }).select('questionanswer');
    if (!q) return res.status(404).json({ error: 'No interview responses found for the user' });

    const questionAnswer = q.questionanswer;

    const feedbackPrompt = `Analyze the following interview responses: ${questionAnswer}\nProvide a structured JSON object with the following format: ... Only return valid JSON. Do not add commentary.`;

    const result: any = await model.generateContent(feedbackPrompt);

    let feedbackJson: string = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (feedbackJson.startsWith('```json')) {
      feedbackJson = feedbackJson.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    }

    let parsed: any;
    try {
      parsed = JSON.parse(feedbackJson);
    } catch (e) {
      console.error('Failed JSON:\n', feedbackJson);
      throw new Error('Failed to parse model output as JSON.');
    }

    const numericScore = parsed.overall_score?.match(/\d+/)?.[0] || '0';
    lastscore.lastscore += lastscore.lastscore ? `_${numericScore}` : numericScore;
    await lastscore.save();

    // Clear previous Q&A
    q.questionanswer = '';
    await q.save();

    // Reset question number
    let qnoRecord = await Qno.findOne({ username }).select('qno');
    if (qnoRecord) {
      qnoRecord.qno = '1';
      await qnoRecord.save();
    }

    res.json(parsed);
  } catch (error: any) {
    console.error('Error Details:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

app.post('/interview', async (req: Request, res: Response) => {
  try {
    const username = req.header('username') as string;
    const { domain, numberofquestion } = req.body as any;

    if (!domain) return res.status(400).json({ error: 'Domain is required' });

    let qaRecord = await QA.findOne({ username });
    if (!qaRecord) {
      qaRecord = new QA({ username, questionanswer: '' });
      await qaRecord.save();
    }

    let qnoRecord = await Qno.findOne({ username });
    if (!qnoRecord) {
      qnoRecord = new Qno({ username, qno: '0' });
      await qnoRecord.save();
    }

    let i = parseInt(qnoRecord.qno, 10);

    let prompt1: string;
    if (i === 0) {
      prompt1 = `Generate a professional interview question in the domain of "${domain}".`;
    } else {
      prompt1 = `Based on this previous Q&A history, generate a relevant follow-up interview question in the domain of "${domain}":\n${qaRecord.questionanswer}Only output the question itself. Do not include analysis, explanation, or commentary.`;
    }

    const result1: any = await model.generateContent(prompt1);
    const question: string = await result1.response.text();

    qaRecord.questionanswer += `\nQ${i + 1}: ${question}`;
    await qaRecord.save();

    qnoRecord.qno = (i + 1).toString();
    await qnoRecord.save();

    res.json({ qno: i + 1, question });
  } catch (error) {
    console.error('Interview generation error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/addanswer', async (req: Request, res: Response) => {
  try {
    const username = req.header('username') as string;
    const answer = (req.body as any).answer as string;

    let qaRecord = await QA.findOne({ username });
    if (!qaRecord) {
      qaRecord = new QA({ username, questionanswer: '' });
      await qaRecord.save();
    }

    let qnoRecord = await Qno.findOne({ username });
    if (!qnoRecord) return res.status(400).json({ error: 'No question found for the user' });

    let i = parseInt(qnoRecord.qno, 10);
    qaRecord.questionanswer += `\nA${i}: ${answer}`;
    await qaRecord.save();

    res.json({ mes: 'Added the answer to the database' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/home', async (req: Request, res: Response) => {
  try {
    const username = req.header('username') as string;

    await QA.deleteOne({ username });
    await Qno.deleteOne({ username });

    res.json({ message: 'true' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/checkscore', authenticate, async (req: any, res: Response) => {
  const username = req.username;

  const userScore = await Score.findOne({ username });
  if (!userScore) return res.json({ validUser: true, array: [], suggestion: 'No score history found.' });

  const lastScores = userScore.lastscore.split('_').filter((s: string) => s !== '').map(Number);
  const lastFiveScores = lastScores.slice(-5);

  if (lastFiveScores.length >= 5) {
    const prompt2 = `Analyze the progress of the user's last 5 scores out of 10 in 70 words: ${lastFiveScores}`;
    let suggestionText = '';
    try {
      const r2: any = await model.generateContent(prompt2);
      suggestionText = await r2.response.text();
    } catch (modelErr: any) {
      console.error('Model generation error:', modelErr.message || modelErr);
      suggestionText = 'Unable to generate suggestion at this time.';
    }
    return res.json({ validUser: true, array: lastFiveScores, suggestion: suggestionText });
  }

  return res.json({ validUser: true, array: lastFiveScores, suggestion: 'Not enough scores to analyze.' });
});

app.post('/checkresume', authenticate, async (req: any, res: Response) => {
  try {
    const username = req.username;
    const { resume, profile } = req.body as any;
    if (!resume || !profile) return res.status(400).json({ error: 'Resume and profile are required' });

    const prompt1 = `${resume} This is my resume. I am focusing on the job for ${profile}. First, just only give the score of my resume out of 10.and never give the line like The formatting is also inconsistent and contains errors.`;
    const prompt2 = `${resume} This is my resume. I am focusing on the job for ${profile}. What are the good things about my resume? Give them in bullet form in 50-70 words.`;
    const prompt3 = `${resume} This is my resume. I am focusing on the job for ${profile}. What are the things I have to improve? These things should not be in the resume or need to be added/learned to make more impact.  Give them in bullet form in 50-70 words.`;

    const [scoreResult, goodResult, improveResult] = await Promise.all([
      model.generateContent(prompt1),
      model.generateContent(prompt2),
      model.generateContent(prompt3),
    ]);

    const scoreText = scoreResult.response?.candidates?.[0]?.content?.parts?.[0]?.text || 'No score generated';
    const goodText = goodResult.response?.candidates?.[0]?.content?.parts?.[0]?.text || 'No good points generated';
    const improveText = improveResult.response?.candidates?.[0]?.content?.parts?.[0]?.text || 'No improvement points generated';

    res.json({ score: scoreText, goodPoints: goodText, improvementPoints: improveText });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/getimage', async (req: Request, res: Response) => {
  const { username } = req.headers as any;
  if (!username) return res.status(400).json({ error: 'Username is required' });

  try {
    const userImage = await Image.findOne({ username });
    if (userImage) {
      res.json({ image: userImage.image });
    } else {
      res.json({ image: null });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/addimage', async (req: Request, res: Response) => {
  const { username, image } = req.body as any;

  if (!username || !image) return res.status(400).json({ error: 'Username and image are required' });

  try {
    const existing = await Image.findOne({ username });
    if (existing) {
      existing.image = image;
      await existing.save();
      return res.json({ message: 'Image updated' });
    } else {
      const newImage = new Image({ username, image });
      await newImage.save();
      return res.json({ message: 'Image added' });
    }
  } catch (error) {
    console.error('Error saving image:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

const upload = multer({ storage: multer.memoryStorage() });

const client = new AssemblyAI({ apiKey: process.env.apiKey });

app.post('/transcribe', upload.single('audio'), async (req: any, res: Response) => {
  try {
    const buffer = req.file.buffer;
    const transcript: any = await client.transcripts.transcribe({ audio: buffer });
    res.json({ text: transcript.text });
  } catch (err: any) {
    console.error('Transcription error:', err);
    res.status(500).send({ error: err.message });
  }
});

app.use(express.static('public'));

mongoose
  .connect(url)
  .then(() => {
    console.log('Connected to MongoDB!');
    app.listen(3000, () => {
      console.log('Server is running on port 3000');
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });
