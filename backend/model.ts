import mongoose, { Document, Model } from 'mongoose';

interface IUser extends Document {
  username: string;
  password: string;
}

interface IScore extends Document {
  username: string;
  lastscore: string;
}

interface IQA extends Document {
  username: string;
  questionanswer: string;
}

interface IQno extends Document {
  username: string;
  qno: string;
}

interface IImage extends Document {
  username: string;
  image: string;
}

const userSchema = new mongoose.Schema<IUser>({
  username: String,
  password: String,
});

const scoreSchema = new mongoose.Schema<IScore>({
  username: String,
  lastscore: String,
});

const qaSchema = new mongoose.Schema<IQA>({
  username: String,
  questionanswer: String,
});

const qnoSchema = new mongoose.Schema<IQno>({
  username: String,
  qno: String,
});

const imageSchema = new mongoose.Schema<IImage>({
  username: String,
  image: String,
});

const Image = mongoose.model<IImage>('Image', imageSchema);
const User = mongoose.model<IUser>('User', userSchema);
const Score = mongoose.model<IScore>('Score', scoreSchema);
const QA = mongoose.model<IQA>('QA', qaSchema);
const Qno = mongoose.model<IQno>('Qno', qnoSchema);

export { User, Score, QA, Qno, Image };
