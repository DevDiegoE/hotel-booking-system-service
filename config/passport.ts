import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import passport from 'passport';
import { UserModel } from '../src/infrastructure/database/mongoose/userModel.ts';

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET as string,
};

passport.use(
    new JwtStrategy(opts, async (jwt_payload, done) => {
        try {
            const user = await UserModel.findById(jwt_payload.id);
            if (user) return done(null, user);
            else return done(null, false);
        } catch (err) {
            return done(err, false);
        }
    })
);

export default passport;
