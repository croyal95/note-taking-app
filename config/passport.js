 // config/passport.js
 const LocalStrategy = require('passport-local').Strategy;
 const bcrypt = require('bcryptjs');
 const User = require('../models/user');
 const { logger } = require('../utils/logger');
 module.exports = function(passport) {

passport.use(new LocalStrategy(
 {
  usernameField: 'email',
  passwordField: 'password'
 },
 
 async (email, password, done) => {
    try {
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            logger.warn('Authentication failed: User not found', { email });
            return done(null, false, { message: 'Invalid email or password' });
         }

   const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        logger.warn('Authentication failed: Invalid password', { email });
        return done(null, false, { message: 'Invalid email or password' });
      }
    
   user.password = undefined;
   return done(null, user);
   } catch (err) {
    logger.error('Authentication error:', err);
    return done(err);
    }
   }
  ));

 passport.serializeUser((user, done) => {
    done(null, user.id);
 });

 passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
   } catch (err) {
   done(err);
   }
  });
 };       