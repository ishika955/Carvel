const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://carvel.onrender.com/auth/google/callback",
      passReqToCallback: true
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const selectedRole =
          req.query.state === "family" ? "family" : "caretaker";

        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          user.role = selectedRole;
          user.profilePic = profile.photos?.[0]?.value || user.profilePic;
          await user.save();
          return done(null, user);
        }

        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          user.googleId = profile.id;
          user.profilePic = profile.photos?.[0]?.value || user.profilePic;
          user.role = selectedRole;
          await user.save();
          return done(null, user);
        }

        user = await User.create({
          username: profile.displayName + "_" + profile.id.slice(0, 6),
          email: profile.emails[0].value,
          googleId: profile.id,
          profilePic: profile.photos?.[0]?.value || "",
          role: selectedRole
        });

        return done(null, user);
      } catch (err) {
        console.error("GOOGLE AUTH ERROR:", err);
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user._id));

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;