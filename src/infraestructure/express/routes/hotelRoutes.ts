import express from 'express';

import hotels from '../../database/mock/hotels.json' with { type: 'json' };

const router = express.Router();

router.get('/', (req, res) => {
    res.json(hotels);
});

export default router;
