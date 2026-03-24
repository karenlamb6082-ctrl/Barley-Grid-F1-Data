export const NEXT_RACE = {
  id: "2026-03",
  round: 3,
  name: "FORMULA 1 LENOVO JAPANESE GRAND PRIX 2026",
  circuit: "Suzuka International Racing Course",
  country: "Japan",
  sessions: {
    fp1: "2026-03-27T02:30:00Z",
    fp2: "2026-03-27T06:00:00Z",
    fp3: "2026-03-28T02:30:00Z",
    qualifying: "2026-03-28T06:00:00Z",
    race: "2026-03-29T05:00:00Z"
  },
  status: "upcoming"
};

export const RECENT_RESULTS = [
  {
    id: "2026-02",
    round: 2,
    name: "FORMULA 1 LENOVO CHINESE GRAND PRIX 2026",
    country: "China",
    date: "2026-03-15T07:00:00Z",
    podium: [
      { position: 1, driverId: "charles_leclerc", name: "C. Leclerc", team: "Ferrari", time: "1:36:22.450" },
      { position: 2, driverId: "max_verstappen", name: "M. Verstappen", team: "Red Bull Racing", time: "+2.110s" },
      { position: 3, driverId: "lando_norris", name: "L. Norris", team: "McLaren", time: "+8.921s" }
    ]
  },
  {
    id: "2026-01",
    round: 1,
    name: "FORMULA 1 ROLEX AUSTRALIAN GRAND PRIX 2026",
    country: "Australia",
    date: "2026-03-08T04:00:00Z",
    podium: [
      { position: 1, driverId: "max_verstappen", name: "M. Verstappen", team: "Red Bull Racing", time: "1:22:46.332" },
      { position: 2, driverId: "oscar_piastri", name: "O. Piastri", team: "McLaren", time: "+12.441s" },
      { position: 3, driverId: "carlos_sainz", name: "C. Sainz", team: "Ferrari", time: "+14.650s" }
    ]
  }
];

export const DRIVER_STANDINGS = [
  { rank: 1, id: "max_verstappen", firstName: "Max", lastName: "Verstappen", code: "VER", number: 1, team: "Red Bull Racing", points: 43, trend: "same", teamColor: "#3671C6" },
  { rank: 2, id: "charles_leclerc", firstName: "Charles", lastName: "Leclerc", code: "LEC", number: 16, team: "Ferrari", points: 37, trend: "up", teamColor: "#E8002D" },
  { rank: 3, id: "lando_norris", firstName: "Lando", lastName: "Norris", code: "NOR", number: 4, team: "McLaren", points: 27, trend: "up", teamColor: "#FF8000" },
  { rank: 4, id: "oscar_piastri", firstName: "Oscar", lastName: "Piastri", code: "PIA", number: 81, team: "McLaren", points: 26, trend: "down", teamColor: "#FF8000" },
  { rank: 5, id: "carlos_sainz", firstName: "Carlos", lastName: "Sainz", code: "SAI", number: 55, team: "Williams", points: 25, trend: "down", teamColor: "#00A0ED" },
  { rank: 6, id: "lewis_hamilton", firstName: "Lewis", lastName: "Hamilton", code: "HAM", number: 44, team: "Ferrari", points: 20, trend: "same", teamColor: "#E8002D" },
  { rank: 7, id: "george_russell", firstName: "George", lastName: "Russell", code: "RUS", number: 63, team: "Mercedes", points: 18, trend: "same", teamColor: "#27F4D2" },
  { rank: 8, id: "fernando_alonso", firstName: "Fernando", lastName: "Alonso", code: "ALO", number: 14, team: "Aston Martin", points: 8, trend: "same", teamColor: "#229971" },
];

export const TEAM_STANDINGS = [
  { rank: 1, id: "ferrari", name: "Ferrari", points: 57, teamColor: "#E8002D", carImage: "/cars/ferrari.png" },
  { rank: 2, id: "red_bull", name: "Red Bull Racing", points: 55, teamColor: "#3671C6", carImage: "/cars/red_bull.png" },
  { rank: 3, id: "mclaren", name: "McLaren", points: 53, teamColor: "#FF8000", carImage: "/cars/mclaren.png" },
  { rank: 4, id: "mercedes", name: "Mercedes", points: 25, teamColor: "#27F4D2", carImage: "/cars/mercedes.png" },
  { rank: 5, id: "williams", name: "Williams", points: 25, teamColor: "#00A0ED", carImage: "/cars/williams.png" }
];

export const FULL_SCHEDULE = [
  {
    id: "2026-01",
    round: 1,
    name: "FORMULA 1 ROLEX AUSTRALIAN GRAND PRIX 2026",
    circuit: "Albert Park Circuit",
    country: "Australia",
    date: "2026-03-08T04:00:00Z",
    status: "completed"
  },
  {
    id: "2026-02",
    round: 2,
    name: "FORMULA 1 LENOVO CHINESE GRAND PRIX 2026",
    circuit: "Shanghai International Circuit",
    country: "China",
    date: "2026-03-15T07:00:00Z",
    status: "completed"
  },
  {
    ...NEXT_RACE
  },
  {
    id: "2026-04",
    round: 4,
    name: "FORMULA 1 GULF AIR BAHRAIN GRAND PRIX 2026",
    circuit: "Bahrain International Circuit",
    country: "Bahrain",
    date: "2026-04-12T15:00:00Z",
    status: "upcoming"
  },
  {
    id: "2026-05",
    round: 5,
    name: "FORMULA 1 STC SAUDI ARABIAN GRAND PRIX 2026",
    circuit: "Jeddah Corniche Circuit",
    country: "Saudi Arabia",
    date: "2026-04-19T17:00:00Z",
    status: "upcoming"
  },
  {
    id: "2026-06",
    round: 6,
    name: "FORMULA 1 CRYPTO.COM MIAMI GRAND PRIX 2026",
    circuit: "Miami International Autodrome",
    country: "USA",
    date: "2026-05-03T20:00:00Z",
    status: "upcoming"
  },
  {
    id: "2026-07",
    round: 7,
    name: "FORMULA 1 AWS GRAND PRIX DU CANADA 2026",
    circuit: "Circuit Gilles-Villeneuve",
    country: "Canada",
    date: "2026-05-24T18:00:00Z",
    status: "upcoming"
  }
];
