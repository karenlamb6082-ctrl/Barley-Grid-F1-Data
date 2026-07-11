const API_BASE = "https://api.jolpi.ca/ergast/f1/current";
const ALL_DATA_CACHE_KEY = "barley-grid:f1-data:v3";
const ALL_DATA_CACHE_MAX_AGE = 30 * 60 * 1000;

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getCachedAllData(maxAge = ALL_DATA_CACHE_MAX_AGE) {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(ALL_DATA_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (!cached?.data || !cached?.cachedAt) return null;
    return {
      data: cached.data,
      cachedAt: cached.cachedAt,
      isFresh: Date.now() - cached.cachedAt < maxAge,
    };
  } catch (error) {
    console.warn("Failed to read F1 cache:", error);
    return null;
  }
}

export function setCachedAllData(data) {
  if (!canUseStorage() || !data) return;
  try {
    window.localStorage.setItem(
      ALL_DATA_CACHE_KEY,
      JSON.stringify({ cachedAt: Date.now(), data })
    );
  } catch (error) {
    console.warn("Failed to write F1 cache:", error);
  }
}

async function fetchJson(url, timeout = 12000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

const TEAM_COLORS = {
  ferrari: "#E8002D",
  red_bull: "#3671C6",
  mclaren: "#FF8000",
  mercedes: "#27F4D2",
  williams: "#00A0ED",
  aston_martin: "#229971",
  alpine: "#FF87BC",
  rb: "#6692FF",
  audi: "#52E252",
  haas: "#B6BABD",
  cadillac: "#1C3D2A"
};

export const getTeamColor = (constructorId) => TEAM_COLORS[constructorId] || "#376b6d";

// 车队简称（用于 Logo 徽章）
const TEAM_ABBR = {
  ferrari: 'FER',
  red_bull: 'RBR',
  mclaren: 'MCL',
  mercedes: 'MER',
  williams: 'WIL',
  aston_martin: 'AMR',
  alpine: 'ALP',
  rb: 'RB',
  audi: 'AUDI',
  haas: 'HAAS',
  cadillac: 'CAD',
};

export const getTeamAbbr = (constructorId) => TEAM_ABBR[constructorId] || constructorId?.slice(0, 3).toUpperCase() || '???';

// 大奖赛中文名映射
const RACE_NAMES_CN = {
  'Australian Grand Prix': '澳大利亚大奖赛',
  'Chinese Grand Prix': '中国大奖赛',
  'Japanese Grand Prix': '日本大奖赛',
  'Bahrain Grand Prix': '巴林大奖赛',
  'Saudi Arabian Grand Prix': '沙特阿拉伯大奖赛',
  'Miami Grand Prix': '迈阿密大奖赛',
  'Emilia Romagna Grand Prix': '艾米利亚-罗马涅大奖赛',
  'Monaco Grand Prix': '摩纳哥大奖赛',
  'Spanish Grand Prix': '西班牙大奖赛',
  'Barcelona Grand Prix': '巴塞罗那大奖赛',
  'Canadian Grand Prix': '加拿大大奖赛',
  'Austrian Grand Prix': '奥地利大奖赛',
  'British Grand Prix': '英国大奖赛',
  'Belgian Grand Prix': '比利时大奖赛',
  'Hungarian Grand Prix': '匈牙利大奖赛',
  'Dutch Grand Prix': '荷兰大奖赛',
  'Italian Grand Prix': '意大利大奖赛',
  'Azerbaijan Grand Prix': '阿塞拜疆大奖赛',
  'Singapore Grand Prix': '新加坡大奖赛',
  'United States Grand Prix': '美国大奖赛',
  'Mexico City Grand Prix': '墨西哥城大奖赛',
  'São Paulo Grand Prix': '圣保罗大奖赛',
  'Las Vegas Grand Prix': '拉斯维加斯大奖赛',
  'Qatar Grand Prix': '卡塔尔大奖赛',
  'Abu Dhabi Grand Prix': '阿布扎比大奖赛',
};

export const getRaceNameCN = (englishName) => RACE_NAMES_CN[englishName] || null;

// 国家中文名映射
const COUNTRY_NAMES_CN = {
  'Australia': '澳大利亚', 'China': '中国', 'Japan': '日本', 'Bahrain': '巴林',
  'Saudi Arabia': '沙特阿拉伯', 'USA': '美国', 'Italy': '意大利', 'Monaco': '摩纳哥',
  'Spain': '西班牙', 'Canada': '加拿大', 'Austria': '奥地利', 'UK': '英国',
  'Belgium': '比利时', 'Hungary': '匈牙利', 'Netherlands': '荷兰',
  'Azerbaijan': '阿塞拜疆', 'Singapore': '新加坡', 'Mexico': '墨西哥',
  'Brazil': '巴西', 'Qatar': '卡塔尔', 'UAE': '阿联酋',
  'United States': '美国', 'United Kingdom': '英国',
};

// 赛道中文名映射
const CIRCUIT_NAMES_CN = {
  'Albert Park Grand Prix Circuit': '阿尔伯特公园赛道',
  'Shanghai International Circuit': '上海国际赛车场',
  'Suzuka Circuit': '铃鹿赛道',
  'Bahrain International Circuit': '巴林国际赛道',
  'Jeddah Corniche Circuit': '吉达滨海赛道',
  'Miami International Autodrome': '迈阿密国际赛车场',
  'Autodromo Enzo e Dino Ferrari': '伊莫拉赛道',
  'Circuit de Monaco': '摩纳哥赛道',
  'Circuit de Barcelona-Catalunya': '巴塞罗那-加泰罗尼亚赛道',
  'Circuit Gilles Villeneuve': '吉尔·维伦纽夫赛道',
  'Red Bull Ring': '红牛赛道',
  'Silverstone Circuit': '银石赛道',
  'Circuit de Spa-Francorchamps': '斯帕-弗朗科尔尚赛道',
  'Hungaroring': '匈格罗宁赛道',
  'Circuit Park Zandvoort': '赞德沃特赛道',
  'Autodromo Nazionale di Monza': '蒙扎赛道',
  'Baku City Circuit': '巴库城市赛道',
  'Marina Bay Street Circuit': '滨海湾街道赛道',
  'Circuit of the Americas': '美洲赛道',
  'Autódromo Hermanos Rodríguez': '罗德里格斯兄弟赛道',
  'Autódromo José Carlos Pace': '英特拉格斯赛道',
  'Las Vegas Strip Street Circuit': '拉斯维加斯大道赛道',
  'Losail International Circuit': '卢赛尔国际赛道',
  'Madring': '马德里赛道',
  'Yas Marina Circuit': '亚斯码头赛道',
};

export const getCountryNameCN = (name) => COUNTRY_NAMES_CN[name] || name;
export const getCircuitNameCN = (name) => CIRCUIT_NAMES_CN[name] || name;

// 车手 driverId → 图片文件名映射（public/drivers/ 下）
const DRIVER_IMAGES = {
  max_verstappen: "3VER.png",
  norris: "4NOR.png",
  leclerc: "16LEC.png",
  hamilton: "44HAM.png",
  sainz: "55SAI.png",
  russell: "63RUSSL.png",
  piastri: "81PIA.png",
  alonso: "14ALO.png",
  stroll: "18STR.png",
  gasly: "10GAS.png",
  ocon: "31OCO.png",
  albon: "23ALB.png",
  hulkenberg: "27HUL.png",
  bottas: "77BOT.png",
  perez: "11PER.png",
  lawson: "30LAW.png",
  bearman: "87BEA.png",
  colapinto: "43COL.png",
  hadjar: "6HAD.png",
  antonelli: "12KIMI.png",
  bortoleto: "5BOR.png",
  arvid_lindblad: "41LIN.png",
};

export const getDriverImage = (driverId) => {
  const filename = DRIVER_IMAGES[driverId];
  return filename ? `/drivers/${filename}` : null;
};

const _raceWeekendCache = {};
const RACE_WEEKEND_CACHE_TTL = 10 * 60 * 1000;

// 通用的分页获取与深度合并辅助函数，解决上游 API 强制 limit 为 100 造成的截断问题
async function fetchPagedData(endpoint, limit = 100) {
  let allRaces = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const data = await fetchJson(`${API_BASE}/${endpoint}?limit=${limit}&offset=${offset}`);
    const races = data?.MRData?.RaceTable?.Races || [];
    if (races.length === 0) {
      hasMore = false;
      break;
    }

    races.forEach(race => {
      const existingRace = allRaces.find(r => r.round === race.round);
      if (existingRace) {
        if (race.Results) {
          existingRace.Results = (existingRace.Results || []).concat(race.Results);
        }
        if (race.SprintResults) {
          existingRace.SprintResults = (existingRace.SprintResults || []).concat(race.SprintResults);
        }
      } else {
        allRaces.push({
          ...race,
          Results: race.Results ? [...race.Results] : undefined,
          SprintResults: race.SprintResults ? [...race.SprintResults] : undefined
        });
      }
    });

    const total = parseInt(data?.MRData?.total || "0", 10);
    const count = parseInt(data?.MRData?.limit || "0", 10);
    offset += count;
    if (offset >= total) {
      hasMore = false;
    }
  }

  return allRaces;
}

export async function fetchAllData() {
  try {
    const [driversData, teamsData, calendarData, allResults, allSprintRaces] = await Promise.all([
      fetchJson(`${API_BASE}/driverStandings.json`),
      fetchJson(`${API_BASE}/constructorStandings.json`),
      fetchJson(`${API_BASE}.json`),
      fetchPagedData('results.json'),
      fetchPagedData('sprint.json')
    ]);

    // 1. Driver Standings
    const rawDrivers = driversData.MRData.StandingsTable.StandingsLists[0]?.DriverStandings || [];
    const driverStandings = rawDrivers.map(d => ({
      rank: parseInt(d.position),
      id: d.Driver.driverId,
      firstName: d.Driver.givenName,
      lastName: d.Driver.familyName,
      code: d.Driver.code,
      number: d.Driver.permanentNumber,
      team: d.Constructors[0]?.name || "Unknown",
      constructorId: d.Constructors[0]?.constructorId || "unknown",
      points: parseFloat(d.points),
      teamColor: getTeamColor(d.Constructors[0]?.constructorId)
    }));

    // 2. Team Standings
    const rawTeams = teamsData.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings || [];
    const teamStandings = rawTeams.map(t => ({
      rank: parseInt(t.position),
      id: t.Constructor.constructorId,
      name: t.Constructor.name,
      points: parseFloat(t.points),
      teamColor: getTeamColor(t.Constructor.constructorId)
    }));

    // 3. Schedule & Next Race（包含所有 Session 时间）
    const rawRaces = calendarData.MRData.RaceTable.Races || [];
    const now = new Date();
    const parseSessionTime = (session) => {
      if (!session?.date) return null;
      return new Date(`${session.date}T${session.time || '15:00:00Z'}`).toISOString();
    };
    const schedule = rawRaces.map(r => {
      const raceDate = new Date(`${r.date}T${r.time || '15:00:00Z'}`);
      const isSprint = !!r.Sprint; // 冲刺周末标识
      return {
        id: r.round,
        round: r.round,
        name: r.raceName,
        circuit: r.Circuit.circuitName,
        country: r.Circuit.Location.country,
        date: raceDate.toISOString(),
        isSprint,
        sessions: {
          fp1: parseSessionTime(r.FirstPractice),
          fp2: parseSessionTime(r.SecondPractice),
          fp3: parseSessionTime(r.ThirdPractice),
          sprintQualifying: parseSessionTime(r.SprintQualifying),
          sprint: parseSessionTime(r.Sprint),
          qualifying: parseSessionTime(r.Qualifying),
          race: raceDate.toISOString(),
        },
        // 正赛持续约 2 小时，结束后才标记为 completed
        status: new Date(raceDate.getTime() + 2 * 60 * 60 * 1000) < now ? "completed" : "upcoming"
      };
    });

    const nextRace = schedule.find(r => r.status === "upcoming") || schedule[schedule.length - 1];

    // 4. Recent Results (All completed races this season, reversed so freshest is top)
    const completedRaces = allResults || [];

    // 补全由于上游 API 数据缺失导致的车手正赛成绩（如加拿大站仅有 12 人）
    completedRaces.forEach(raceItem => {
      if (raceItem.Results && raceItem.Results.length > 0 && raceItem.Results.length < driverStandings.length) {
        const finishedDriverIds = new Set(raceItem.Results.map(res => res.Driver?.driverId).filter(Boolean));
        driverStandings.forEach(dsDriver => {
          if (!finishedDriverIds.has(dsDriver.id)) {
            const nextPosition = raceItem.Results.length + 1;
            raceItem.Results.push({
              position: String(nextPosition),
              positionText: "R",
              points: "0",
              Driver: {
                driverId: dsDriver.id,
                permanentNumber: String(dsDriver.number || ""),
                code: dsDriver.code || "",
                givenName: dsDriver.firstName,
                familyName: dsDriver.lastName,
              },
              Constructor: {
                constructorId: dsDriver.constructorId,
                name: dsDriver.team,
              },
              grid: "—",
              laps: "—",
              status: "Retirement"
            });
          }
        });
      }
    });

    const recentResults = completedRaces.map(raceItem => ({
      id: raceItem.round,
      round: raceItem.round,
      name: raceItem.raceName,
      country: raceItem.Circuit.Location.country,
      date: `${raceItem.date}T${raceItem.time || '15:00:00Z'}`,
      podium: raceItem.Results ? raceItem.Results.slice(0, 3).map(res => ({
        position: parseInt(res.position),
        driverId: res.Driver.driverId,
        name: `${res.Driver.givenName[0]}. ${res.Driver.familyName}`,
        team: res.Constructor.name,
        teamColor: getTeamColor(res.Constructor.constructorId),
        time: res.Time?.time || "Finished"
      })) : []
    })).reverse();

    const data = {
      driverStandings,
      teamStandings,
      schedule,
      nextRace,
      recentResults,
      allRaces: allResults,
      allSprintRaces: allSprintRaces
    };
    setCachedAllData(data);
    return data;
  } catch (error) {
    console.error("F1 API Fetch Failed:", error);
    return getCachedAllData(Infinity)?.data || null;
  }
}

// 按需获取某轮分站的排位赛和冲刺赛数据
export async function fetchRaceWeekend(round) {
  const cacheKey = String(round);
  const cached = _raceWeekendCache[cacheKey];
  if (cached && Date.now() - cached.time < RACE_WEEKEND_CACHE_TTL) return cached.data;

  try {
    const [qualRes, sprintRes] = await Promise.allSettled([
      fetch(`${API_BASE}/${round}/qualifying.json`),
      fetch(`${API_BASE}/${round}/sprint.json`),
    ]);

    let qualifying = null;
    let sprint = null;
    let sprintQualifying = null;

    // 排位赛结果
    if (qualRes.status === 'fulfilled' && qualRes.value.ok) {
      const data = await qualRes.value.json();
      const race = data.MRData?.RaceTable?.Races?.[0];
      if (race?.QualifyingResults?.length > 0) {
        qualifying = race.QualifyingResults.map(r => ({
          position: parseInt(r.position),
          driverId: r.Driver.driverId,
          code: r.Driver.code,
          firstName: r.Driver.givenName,
          lastName: r.Driver.familyName,
          constructorId: r.Constructor.constructorId,
          constructorName: r.Constructor.name,
          q1: r.Q1 || null,
          q2: r.Q2 || null,
          q3: r.Q3 || null,
        }));
      }
    }

    // 冲刺赛结果
    if (sprintRes.status === 'fulfilled' && sprintRes.value.ok) {
      const data = await sprintRes.value.json();
      const race = data.MRData?.RaceTable?.Races?.[0];
      if (race?.SprintResults?.length > 0) {
        sprint = race.SprintResults.map(r => ({
          position: parseInt(r.position),
          positionText: r.positionText,
          driverId: r.Driver.driverId,
          code: r.Driver.code,
          firstName: r.Driver.givenName,
          lastName: r.Driver.familyName,
          constructorId: r.Constructor.constructorId,
          constructorName: r.Constructor.name,
          grid: parseInt(r.grid),
          laps: parseInt(r.laps),
          status: r.status,
          time: r.Time?.time || null,
          points: parseFloat(r.points) || 0,
        }));

        // 从冲刺赛 grid 推算冲刺排位赛结果
        sprintQualifying = [...sprint]
          .sort((a, b) => a.grid - b.grid)
          .map((r, idx) => ({
            position: idx + 1,
            driverId: r.driverId,
            code: r.code,
            firstName: r.firstName,
            lastName: r.lastName,
            constructorId: r.constructorId,
            constructorName: r.constructorName,
          }));
      }
    }

    const data = { qualifying, sprint, sprintQualifying };
    _raceWeekendCache[cacheKey] = { time: Date.now(), data };
    return data;
  } catch (error) {
    console.error('Failed to fetch race weekend data:', error);
    return { qualifying: null, sprint: null, sprintQualifying: null };
  }
}


// ========== F1 LiveTiming API 练习赛数据 ==========
// 本地通过 Vite 代理，生产通过 Vercel Serverless Function 代理
const DRIVER_BY_NUMBER = {
  '1': { firstName: 'Lando', lastName: 'Norris', team: 'McLaren', teamColor: '#FF8000' },
  '3': { firstName: 'Max', lastName: 'Verstappen', team: 'Red Bull', teamColor: '#3671C6' },
  '5': { firstName: 'Gabriel', lastName: 'Bortoleto', team: 'Audi', teamColor: '#52E252' },
  '6': { firstName: 'Isack', lastName: 'Hadjar', team: 'Red Bull', teamColor: '#3671C6' },
  '10': { firstName: 'Pierre', lastName: 'Gasly', team: 'Alpine', teamColor: '#FF87BC' },
  '11': { firstName: 'Sergio', lastName: 'Perez', team: 'Cadillac', teamColor: '#1C3D2A' },
  '12': { firstName: 'Kimi', lastName: 'Antonelli', team: 'Mercedes', teamColor: '#27F4D2' },
  '14': { firstName: 'Fernando', lastName: 'Alonso', team: 'Aston Martin', teamColor: '#229971' },
  '16': { firstName: 'Charles', lastName: 'Leclerc', team: 'Ferrari', teamColor: '#E8002D' },
  '18': { firstName: 'Lance', lastName: 'Stroll', team: 'Aston Martin', teamColor: '#229971' },
  '23': { firstName: 'Alexander', lastName: 'Albon', team: 'Williams', teamColor: '#00A0ED' },
  '27': { firstName: 'Nico', lastName: 'Hulkenberg', team: 'Audi', teamColor: '#52E252' },
  '30': { firstName: 'Liam', lastName: 'Lawson', team: 'RB F1 Team', teamColor: '#6692FF' },
  '31': { firstName: 'Esteban', lastName: 'Ocon', team: 'Haas', teamColor: '#B6BABD' },
  '41': { firstName: 'Arvid', lastName: 'Lindblad', team: 'RB F1 Team', teamColor: '#6692FF' },
  '43': { firstName: 'Franco', lastName: 'Colapinto', team: 'Alpine', teamColor: '#FF87BC' },
  '44': { firstName: 'Lewis', lastName: 'Hamilton', team: 'Ferrari', teamColor: '#E8002D' },
  '55': { firstName: 'Carlos', lastName: 'Sainz', team: 'Williams', teamColor: '#00A0ED' },
  '63': { firstName: 'George', lastName: 'Russell', team: 'Mercedes', teamColor: '#27F4D2' },
  '77': { firstName: 'Valtteri', lastName: 'Bottas', team: 'Cadillac', teamColor: '#1C3D2A' },
  '81': { firstName: 'Oscar', lastName: 'Piastri', team: 'McLaren', teamColor: '#FF8000' },
  '87': { firstName: 'Oliver', lastName: 'Bearman', team: 'Haas', teamColor: '#B6BABD' },
};

// 构建 LiveTiming 请求 URL（本地走 Vite 代理，线上走 Vercel API route）
function buildTimingUrl(path) {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return `/f1timing/${path}`;
  }
  return `/api/f1proxy?path=${encodeURIComponent(path)}`;
}

let _indexCache = null;
let _indexCacheTime = 0;

async function getLiveTimingIndex() {
  if (_indexCache && (Date.now() - _indexCacheTime) < 30 * 60 * 1000) return _indexCache;
  try {
    const c = new AbortController();
    const timer = setTimeout(() => c.abort(), 8000);
    try {
      const res = await fetch(buildTimingUrl('2026/Index.json'), { signal: c.signal });
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      _indexCache = data;
      _indexCacheTime = Date.now();
      return data;
    } finally {
      clearTimeout(timer);
    }
  } catch (e) {
    console.warn('LiveTiming Index 获取失败:', e.message);
    return null;
  }
}

function findPracticeSessionPaths(indexData, raceName) {
  if (!indexData?.Meetings) return {};
  const meeting = indexData.Meetings.find(m =>
    m.Name === raceName || m.OfficialName?.includes(raceName.replace(' Grand Prix', '').toUpperCase())
  );
  if (!meeting?.Sessions) return {};
  const paths = {};
  meeting.Sessions.forEach(s => {
    if (s.Type === 'Practice' && s.Name?.startsWith('Practice') && s.Path) {
      if (s.Number >= 1 && s.Number <= 3) paths[`fp${s.Number}`] = s.Path;
    }
  });
  return paths;
}

function parseTimingData(data) {
  if (!data?.Lines) return null;
  const results = Object.entries(data.Lines)
    .filter(([, d]) => d.BestLapTime?.Value && d.BestLapTime.Value !== '')
    .map(([num, d]) => {
      const info = DRIVER_BY_NUMBER[num] || { firstName: '', lastName: `#${num}`, team: 'Unknown', teamColor: '#999' };
      return {
        position: parseInt(d.Position) || 99,
        driverNumber: parseInt(num),
        firstName: info.firstName,
        lastName: info.lastName,
        teamName: info.team,
        teamColor: info.teamColor,
        bestLapFormatted: d.BestLapTime.Value,
        gap: d.TimeDiffToFastest || null,
        laps: d.NumberOfLaps || 0,
      };
    })
    .sort((a, b) => a.position - b.position);
  if (results.length > 0) results[0].gap = null;
  return results.length > 0 ? results : null;
}

const _fpCache = {};

async function fetchLiveTimingSession(sessionPath) {
  if (_fpCache[sessionPath]) return _fpCache[sessionPath];
  try {
    const c = new AbortController();
    const timer = setTimeout(() => c.abort(), 8000);
    try {
      const res = await fetch(buildTimingUrl(`${sessionPath}TimingData.json`), { signal: c.signal });
      if (!res.ok) return null;
      const parsed = parseTimingData(await res.json());
      if (parsed) _fpCache[sessionPath] = parsed;
      return parsed;
    } finally {
      clearTimeout(timer);
    }
  } catch (e) {
    console.warn('FP session 获取失败:', e.message);
    return null;
  }
}

export async function fetchPracticeResults(round, schedule) {
  try {
    const raceInfo = schedule?.find(s => String(s.round) === String(round));
    if (!raceInfo) return { fp1: null, fp2: null, fp3: null, error: null };
    const now = new Date();
    const results = { fp1: null, fp2: null, fp3: null, error: null };
    const indexData = await getLiveTimingIndex();
    const paths = indexData ? findPracticeSessionPaths(indexData, raceInfo.name) : {};
    const fetches = ['fp1', 'fp2', 'fp3'].map(async key => {
      const t = raceInfo.sessions?.[key];
      if (!t) return;
      if (new Date(new Date(t).getTime() + 3600000) > now) return;
      if (paths[key]) results[key] = await fetchLiveTimingSession(paths[key]);
    });
    await Promise.all(fetches);
    return results;
  } catch (error) {
    console.error('练习赛数据获取失败', error);
    return { fp1: null, fp2: null, fp3: null, error: 'network' };
  }
}

// ========== 热点追踪 (F1 Pulse) ==========
const HOT_TOPICS_CACHE_KEY = 'barley-grid:hot-topics:v1';
const HOT_TOPICS_CACHE_MAX_AGE = 3 * 60 * 1000;

export function getCachedHotTopics() {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(HOT_TOPICS_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (!cached?.topics || Date.now() - cached.cachedAt > HOT_TOPICS_CACHE_MAX_AGE) return null;
    return cached;
  } catch {
    return null;
  }
}

function setCachedHotTopics(data) {
  if (!canUseStorage() || !data) return;
  try {
    window.localStorage.setItem(HOT_TOPICS_CACHE_KEY, JSON.stringify({
      ...data,
      cachedAt: Date.now(),
    }));
  } catch {
    // quota exceeded, ignore
  }
}

export async function fetchHotTopics() {
  try {
    const res = await fetch('/api/hot-topics');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (data?.topics) {
      setCachedHotTopics(data);
    }
    return data;
  } catch (error) {
    console.warn('Hot topics fetch failed:', error);
    return getCachedHotTopics();
  }
}
