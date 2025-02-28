import express from 'express';
import axios from 'axios';
import env from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

const app = express();
env.config();

const PORT = process.env.PORT || 10000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(helmet());
app.use(cors());
app.use(express.static('public'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 7 
});
app.use(limiter);

const API_KEY = process.env.MY_APIKEY;
const BASE_URL = process.env.MY_APIURL;

const LEAGUES = {
  'Premier League': 'PL',
  'La Liga': 'PD',
  'Bundesliga': 'BL1',
  'Serie A': 'SA',
  'Ligue 1': 'FL1'
};

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const config = {
  headers: { 'X-Auth-Token': API_KEY }
};

app.get('/', async (req, res) => {
  const selectedLeague = req.query.league || 'PL';

  try {
    const [standingsResponse, scorersResponse, matchesResponse] = await Promise.all([
      axios.get(`${BASE_URL}/competitions/${selectedLeague}/standings`, config),
      axios.get(`${BASE_URL}/competitions/${selectedLeague}/scorers`, config),
      axios.get(`${BASE_URL}/competitions/${selectedLeague}/matches?status=SCHEDULED`, config)
    ]);

    res.render('index', {
      standings: standingsResponse.data?.standings?.[0]?.table || [],
      scorers: scorersResponse.data?.scorers || [],
      matches: matchesResponse.data?.matches?.slice(0, 10) || [],
      leagues: LEAGUES,
      selectedLeague
    });
  } catch (error) {
    console.error('Error fetching data:', error.message);
    res.status(500).render('error', { error: 'Failed to fetch football data. Please try again later.' });
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

server.keepAliveTimeout = 120 * 1000; 
server.headersTimeout = 120 * 1000;
