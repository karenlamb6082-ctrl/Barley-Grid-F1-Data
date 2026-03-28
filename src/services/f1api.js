const API_BASE = "https://api.jolpi.ca/ergast/f1/current";

const TEAM_COLORS = {
  ferrari: "#E8002D",
  red_bull: "#3671C6",
  mclaren: "#FF8000",
  mercedes: "#27F4D2",
  williams: "#00A0ED",
  aston_martin: "#229971",
  alpine: "#FF87BC",
  rb: "#6692FF",
  sauber: "#52E252",
  haas: "#B6BABD"
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
  sauber: 'AUDI',
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
  'Las Vegas Strip Circuit': '拉斯维加斯大道赛道',
  'Lusail International Circuit': '卢赛尔国际赛道',
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

export async function fetchAllData() {
  try {
    const [driversRes, teamsRes, calendarRes, allResultsRes, sprintRes] = await Promise.all([
      fetch(`${API_BASE}/driverStandings.json`),
      fetch(`${API_BASE}/constructorStandings.json`),
      fetch(`${API_BASE}.json`),
      fetch(`${API_BASE}/results.json?limit=100`),
      fetch(`${API_BASE}/sprint.json?limit=100`)
    ]);

    const driversData = await driversRes.json();
    const teamsData = await teamsRes.json();
    const calendarData = await calendarRes.json();
    const allResultsData = await allResultsRes.json();
    const sprintData = await sprintRes.json();

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
        status: raceDate < now ? "completed" : "upcoming"
      };
    });

    const nextRace = schedule.find(r => r.status === "upcoming") || schedule[schedule.length - 1];

    // 4. Recent Results (All completed races this season, reversed so freshest is top)
    const completedRaces = allResultsData.MRData.RaceTable.Races || [];
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
        time: res.position === '1' ? res.Time?.time || "Finished" : res.Time?.time || "Finished"
      })) : []
    })).reverse();

    return {
      driverStandings,
      teamStandings,
      schedule,
      nextRace,
      recentResults,
      allRaces: allResultsData.MRData.RaceTable.Races || [],
      allSprintRaces: sprintData.MRData?.RaceTable?.Races || []
    };
  } catch (error) {
    console.error("F1 API Fetch Failed:", error);
    return null;
  }
}

// 按需获取某轮分站的排位赛和冲刺赛数据
export async function fetchRaceWeekend(round) {
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

    return { qualifying, sprint, sprintQualifying };
  } catch (error) {
    console.error('Failed to fetch race weekend data:', error);
    return { qualifying: null, sprint: null, sprintQualifying: null };
  }
}

// ========== F1 Official LiveTiming 练习赛数据 ==========
// 数据源: https://livetiming.formula1.com/static/
// 通过 Vite 代理 /f1timing 访问，绕过 CORS

// 车号 → 车手信息映射（2026 赛季固定阵容）
const DRIVER_BY_NUMBER = {
  '1': { firstName: 'Max', lastName: 'Verstappen', code: 'VER', team: 'Red Bull Racing', teamColor: '#3671C6' },
  '3': { firstName: 'Daniel', lastName: 'Ricciardo', code: 'RIC', team: 'Cadillac', teamColor: '#1C3D2A' },
  '4': { firstName: 'Lando', lastName: 'Norris', code: 'NOR', team: 'McLaren', teamColor: '#FF8000' },
  '5': { firstName: 'Gabriel', lastName: 'Bortoleto', code: 'BOR', team: 'Audi', teamColor: '#52E252' },
  '6': { firstName: 'Isack', lastName: 'Hadjar', code: 'HAD', team: 'Racing Bulls', teamColor: '#6692FF' },
  '10': { firstName: 'Pierre', lastName: 'Gasly', code: 'GAS', team: 'Alpine', teamColor: '#FF87BC' },
  '11': { firstName: 'Sergio', lastName: 'Perez', code: 'PER', team: 'Red Bull Racing', teamColor: '#3671C6' },
  '12': { firstName: 'Kimi', lastName: 'Antonelli', code: 'ANT', team: 'Mercedes', teamColor: '#27F4D2' },
  '14': { firstName: 'Fernando', lastName: 'Alonso', code: 'ALO', team: 'Aston Martin', teamColor: '#229971' },
  '16': { firstName: 'Charles', lastName: 'Leclerc', code: 'LEC', team: 'Ferrari', teamColor: '#E8002D' },
  '18': { firstName: 'Lance', lastName: 'Stroll', code: 'STR', team: 'Aston Martin', teamColor: '#229971' },
  '23': { firstName: 'Alexander', lastName: 'Albon', code: 'ALB', team: 'Williams', teamColor: '#00A0ED' },
  '27': { firstName: 'Nico', lastName: 'Hulkenberg', code: 'HUL', team: 'Audi', teamColor: '#52E252' },
  '30': { firstName: 'Liam', lastName: 'Lawson', code: 'LAW', team: 'Red Bull Racing', teamColor: '#3671C6' },
  '31': { firstName: 'Esteban', lastName: 'Ocon', code: 'OCO', team: 'Haas', teamColor: '#B6BABD' },
  '41': { firstName: 'Arvid', lastName: 'Lindblad', code: 'LIN', team: 'Racing Bulls', teamColor: '#6692FF' },
  '43': { firstName: 'Franco', lastName: 'Colapinto', code: 'COL', team: 'Alpine', teamColor: '#FF87BC' },
  '44': { firstName: 'Lewis', lastName: 'Hamilton', code: 'HAM', team: 'Ferrari', teamColor: '#E8002D' },
  '55': { firstName: 'Carlos', lastName: 'Sainz', code: 'SAI', team: 'Williams', teamColor: '#00A0ED' },
  '63': { firstName: 'George', lastName: 'Russell', code: 'RUS', team: 'Mercedes', teamColor: '#27F4D2' },
  '77': { firstName: 'Valtteri', lastName: 'Bottas', code: 'BOT', team: 'Cadillac', teamColor: '#1C3D2A' },
  '81': { firstName: 'Oscar', lastName: 'Piastri', code: 'PIA', team: 'McLaren', teamColor: '#FF8000' },
  '87': { firstName: 'Oliver', lastName: 'Bearman', code: 'BEA', team: 'Haas', teamColor: '#B6BABD' },
};

// Ergast 比赛名 → LiveTiming 路径名映射
const RACE_PATH_NAMES = {
  'Australian Grand Prix': 'Australian_Grand_Prix',
  'Chinese Grand Prix': 'Chinese_Grand_Prix',
  'Japanese Grand Prix': 'Japanese_Grand_Prix',
  'Bahrain Grand Prix': 'Bahrain_Grand_Prix',
  'Saudi Arabian Grand Prix': 'Saudi_Arabian_Grand_Prix',
  'Miami Grand Prix': 'Miami_Grand_Prix',
  'Emilia Romagna Grand Prix': 'Emilia_Romagna_Grand_Prix',
  'Monaco Grand Prix': 'Monaco_Grand_Prix',
  'Spanish Grand Prix': 'Spanish_Grand_Prix',
  'Barcelona Grand Prix': 'Barcelona_Grand_Prix',
  'Canadian Grand Prix': 'Canadian_Grand_Prix',
  'Austrian Grand Prix': 'Austrian_Grand_Prix',
  'British Grand Prix': 'British_Grand_Prix',
  'Belgian Grand Prix': 'Belgian_Grand_Prix',
  'Hungarian Grand Prix': 'Hungarian_Grand_Prix',
  'Dutch Grand Prix': 'Dutch_Grand_Prix',
  'Italian Grand Prix': 'Italian_Grand_Prix',
  'Azerbaijan Grand Prix': 'Azerbaijan_Grand_Prix',
  'Singapore Grand Prix': 'Singapore_Grand_Prix',
  'United States Grand Prix': 'United_States_Grand_Prix',
  'Mexico City Grand Prix': 'Mexico_City_Grand_Prix',
  'São Paulo Grand Prix': 'São_Paulo_Grand_Prix',
  'Las Vegas Grand Prix': 'Las_Vegas_Grand_Prix',
  'Qatar Grand Prix': 'Qatar_Grand_Prix',
  'Abu Dhabi Grand Prix': 'Abu_Dhabi_Grand_Prix',
};

// 将比赛名转为路径（优先查映射表，兜底用下划线替换空格）
function getRacePathName(raceName) {
  return RACE_PATH_NAMES[raceName] || raceName.replace(/\s+/g, '_');
}

// 构建 LiveTiming URL
// 格式: /f1timing/{year}/{raceDate}_{RaceName}/{sessionDate}_Practice_{N}/TimingData.json
function buildTimingUrl(raceDate, raceName, sessionDate, sessionNumber) {
  const year = raceDate.slice(0, 4);
  const racePathName = getRacePathName(raceName);
  return `/f1timing/${year}/${raceDate}_${racePathName}/${sessionDate}_Practice_${sessionNumber}/TimingData.json`;
}

// 解析 LiveTiming TimingData.json → 排名数组
function parseTimingData(data) {
  if (!data?.Lines) return null;

  const results = Object.entries(data.Lines)
    .filter(([_, d]) => d.BestLapTime?.Value && d.BestLapTime.Value !== '')
    .map(([num, d]) => {
      const driverInfo = DRIVER_BY_NUMBER[num] || {
        firstName: '', lastName: `#${num}`, code: num, team: '未知', teamColor: '#999'
      };
      return {
        position: parseInt(d.Position) || 99,
        driverNumber: parseInt(num),
        firstName: driverInfo.firstName,
        lastName: driverInfo.lastName,
        code: driverInfo.code,
        teamName: driverInfo.team,
        teamColor: driverInfo.teamColor,
        bestLapFormatted: d.BestLapTime.Value,
        gap: d.TimeDiffToFastest || null,
        laps: d.NumberOfLaps || 0,
      };
    })
    .sort((a, b) => a.position - b.position);

  // P1 不需要显示差距
  if (results.length > 0) {
    results[0].gap = null;
  }

  return results.length > 0 ? results : null;
}

// 获取单个练习赛 session 数据
// 返回值: Array（成功）| 'generating'（归档中）| null（无数据）
async function fetchLiveTimingSession(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.status === 403) return 'generating'; // 数据正在归档中
    if (!res.ok) return null;
    const data = await res.json();
    return parseTimingData(data);
  } catch (e) {
    console.warn('LiveTiming 数据获取失败:', url, e.message);
    return null;
  }
}

/**
 * 获取指定分站的练习赛数据（使用 F1 官方 LiveTiming API）
 * @param {string|number} round - 分站轮次
 * @param {Array} schedule - 赛程数据（含 sessions.fp1 等时间信息）
 * @returns {Promise<{fp1: Array|null, fp2: Array|null, fp3: Array|null, error: string|null}>}
 */
export async function fetchPracticeResults(round, schedule) {
  try {
    const raceInfo = schedule?.find(s => String(s.round) === String(round));
    if (!raceInfo) return { fp1: null, fp2: null, fp3: null, error: null };

    const raceName = raceInfo.name;
    const raceDate = raceInfo.sessions?.race?.slice(0, 10); // 'YYYY-MM-DD'
    if (!raceDate) return { fp1: null, fp2: null, fp3: null, error: null };

    const now = new Date();
    const results = { fp1: null, fp2: null, fp3: null, error: null };

    // 构建每个 FP 的 URL 并并行获取
    const fpConfigs = [
      { key: 'fp1', sessionKey: 'fp1', number: 1 },
      { key: 'fp2', sessionKey: 'fp2', number: 2 },
      { key: 'fp3', sessionKey: 'fp3', number: 3 },
    ];

    const fetches = fpConfigs.map(async ({ key, sessionKey, number }) => {
      const sessionTime = raceInfo.sessions?.[sessionKey];
      if (!sessionTime) return; // 冲刺周末可能没有 FP2/FP3

      // session 持续约 60 分钟，结束后立即尝试获取（可能返回 'generating'）
      const sessionDate = new Date(sessionTime);
      const sessionEndEstimate = new Date(sessionDate.getTime() + 60 * 60 * 1000);
      if (sessionEndEstimate > now) return; // session 还在进行中，跳过

      const fpDate = sessionTime.slice(0, 10);
      const url = buildTimingUrl(raceDate, raceName, fpDate, number);
      results[key] = await fetchLiveTimingSession(url);
    });

    await Promise.all(fetches);
    return results;
  } catch (error) {
    console.error('练习赛数据获取失败:', error);
    return { fp1: null, fp2: null, fp3: null, error: 'network' };
  }
}



