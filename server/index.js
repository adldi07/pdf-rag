import express from 'express';
import cors from 'cors';
import multer from 'multer';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

const app = express();
app.use(cors());

app.get('/' , (req , res)=>{
    res.send("Hello World");
});

app.post('/upload/pdf' , upload.single('pdf') , (req , res)=>{
    return res.send("File uploaded successfully");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT , ()=>{
    console.log(`Server is running on port ${PORT}`);
});