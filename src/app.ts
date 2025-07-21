import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import { swaggerDocs } from '../config/swagger.ts';
import hotelRoutes from './infraestructure/express/routes/hotelRoutes.ts';
import roomRoutes from './infraestructure/express/routes/roomRoutes.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({ origin: '*' }));

app.get('/', (req, res) => {
    res.send('Welcome to the Hotel Booking System!');
});

app.use('/hotels', hotelRoutes);
app.use('/rooms', roomRoutes);

swaggerDocs(app);
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
