const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
require('dotenv').config();

const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));


const username = process.env.MONGODB_USERNAME;
const password = process.env.MONGODB_PASSWORD;

const connectWithRetry = () => {
    mongoose.connect(`mongodb+srv://${username}:${password}@cluster0.mvx2new.mongodb.net/done-registration`, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
    })
    .then(() => {
        console.log("Connected to Database");
    })
    .catch((err) => {
        console.error("Error in connecting to Database. Retrying...");
        setTimeout(connectWithRetry, 5000); // Retry after 5 seconds
    });
};

connectWithRetry();

const userSchema = new mongoose.Schema({
    name: String,
    age: Number,
    email: String,
    phno: String,
    gender: String,
    password: String
});

const User = mongoose.model('User', userSchema);

app.post("/sign_up", async (req, res) => {
    try {
        const { name, age, email, phno, gender, password } = req.body;

        // Check if the email already exists in the database
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            // Email already exists, redirect to a page indicating that the account couldn't be created
            return res.redirect('/account_exists.html');
        }

        // Validate Password complexity on the server-side
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        if (!passwordRegex.test(password)) {
            return res.status(400).send("Password must have at least 1 capital letter, 1 small letter, 1 number, and 1 special character.");
        }

        const userData = {
            name,
            age: parseInt(age),
            email,
            phno: phno.toString(),
            gender,
            password: password
        };

        const result = await User.create(userData);

        console.log("Record Inserted Successfully");

        return res.redirect(`/login.html`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const existingUser = await User.findOne({ email });

        if (!existingUser) {
            // User not found, display an alert message on the login form
            return res.send('<script>alert("User not found"); window.location.href = "/login.html";</script>');
        }

        // Compare plain password
        if (password === existingUser.password) {
            // Redirect to home page on successful login
            return res.redirect(`/home.html`);
        } else {
            return res.send('<script>alert("Wrong password"); window.location.href = "/login.html";</script>');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/", (req, res) => {
    res.set({
        "Allow-access-Allow-Origin": '*'
    });
    return res.redirect('index.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
