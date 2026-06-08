import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '../../../domain/entities/user.ts';

export interface UserDocument extends Omit<User, '_id'>, Document {
    comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<UserDocument>(
    {
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: { type: String, enum: ['user', 'admin'], default: 'user' },
    },
    { timestamps: true, versionKey: false }
);

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.comparePassword = async function (password: string) {
    return bcrypt.compare(password, this.password);
};

export const UserModel = model<UserDocument>('User', userSchema);
