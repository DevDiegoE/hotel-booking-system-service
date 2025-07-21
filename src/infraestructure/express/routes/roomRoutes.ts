import express from 'express';

import rooms from '../../database/mock/rooms.json' with { type: 'json' };

const router = express.Router();

router.get('/', (req, res) => {
    res.json(rooms);
});

export default router;
