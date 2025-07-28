import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';

import { AuthService } from '../../../application/services/authService.ts';

@injectable()
export class AuthController {
    constructor(@inject(AuthService) private readonly authService: AuthService) {}

    register = async (req: Request, res: Response) => {
        try {
            const user = await this.authService.register(req.body);
            res.status(201).json(user);
        } catch (err) {
            res.status(400).json({ message: 'Registration failed', error: (err as Error).message });
        }
    };

    login = async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;
            const token = await this.authService.login(email, password);
            if (!token) return res.status(401).json({ message: 'Invalid credentials' });

            res.status(200).json({ token });
        } catch (err) {
            res.status(500).json({ message: 'Login failed', error: (err as Error).message });
        }
    };
}
