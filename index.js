import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
import userRoute from "./routes/user.route.js";
import companyRoute from "./routes/company.route.js";
import jobRoute from "./routes/job.route.js";
import applicationRoute from "./routes/application.route.js";
import emailRoute from "./routes/email.js"; 
import newsletterRouter from "./routes/newsletter.route.js";
import adminRoutes from "./routes/adminRoutes.js";

dotenv.config({});

const app = express();

// middleware
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

// Fixed CORS configuration
// const corsOptions = {
//     origin: [
//         'http://localhost:5173',
//         'https://crack-it-frontend-one.vercel.app',
//         'https://crack-it-frontend-hhvziuek8-abhaycoderarmys-projects.vercel.app'
//     ],
//     credentials: true
// }
const allowedOrigins = [
    'http://localhost:5173',
    'https://crack-it-frontend-one.vercel.app',
    'https://crack-it-frontend-git-main-abhaycoderarmys-projects.vercel.app'
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true); // allow non-browser requests like Postman
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS policy does not allow access from origin ${origin}`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
};


app.use(cors(corsOptions));

const PORT = process.env.PORT || 8000;

// api's
app.use("/api/v1/user", userRoute);
app.use("/api/v1/company", companyRoute);
app.use("/api/v1/job", jobRoute);
app.use("/api/v1/application", applicationRoute);
app.use("/api/v1", emailRoute);
app.use("/api/v1/newsletter", newsletterRouter);
app.use('/api/admin', adminRoutes);

app.listen(PORT,()=>{
    connectDB();
    console.log(`Server running at port ${PORT}`);
})