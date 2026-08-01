const session = require('express-session');
const mongostore = require('connect-mongo');


const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: mongostore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie:{
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24
    }
})

module.exports = sessionMiddleware;