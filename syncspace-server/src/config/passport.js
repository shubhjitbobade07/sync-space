const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  // This callback runs AFTER Google has already verified the user and
  // handed us their profile — accessToken/refreshToken here are GOOGLE's
  // tokens (for calling Google APIs), which we don't need and won't store.
  try {
    const email = profile.emails[0].value;

    let user = await User.findOne({ email });

    if (!user) {
      // First time this Google account has logged in — create a local User record.
      // No password needed, since they'll only ever auth via Google.
      user = await User.create({
        name: profile.displayName,
        email,
        password: null,      // see note below on schema change
        authProvider: 'google'
      });
    }

    done(null, user); // hands the user off to the route handler
  } catch (err) {
    done(err, null);
  }
}));

module.exports = passport;