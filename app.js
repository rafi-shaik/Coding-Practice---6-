let express = require("express");
let sqlite3 = require("sqlite3");
let { open } = require("sqlite");
let path = require("path");

let app = express();
app.use(express.json());
let db = null;

let dbPath = path.join(__dirname, "covid19India.db");

let initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is runnig at http://localhost:3000");
    });
  } catch (e) {
    console.log(`Db Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

// API 1 GET list of states
app.get("/states/", async (request, response) => {
  const getStatesQuery = ` 
    SELECT
     state_id as stateId,
     state_name as stateName,
     population as population
     FROM
        state
     ORDER BY 
        state_id;`;
  const statesArray = await db.all(getStatesQuery);
  response.send(statesArray);
});

//API 2 GET a state
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = ` 
    SELECT
       state_id as stateId,
       state_name as stateName,
       population
     FROM 
        state
     WHERE 
        state_id = ${stateId};`;
  const state = await db.get(getStateQuery);
  response.send(state);
});

//API 3 add new district
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = ` 
    INSERT INTO 
        district (district_name, state_id, cases, cured, active, deaths)
     VALUES
        ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});`;
  await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

//API 4 GET a district
app.get("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = ` 
    SELECT 
        district_id as districtId,
        district_name as districtName,
        state_id as stateId,
        cases,
        cured,
        active,
        deaths
     FROM
        district
     WHERE 
        district_id = ${districtId};`;
  const district = await db.get(getDistrictQuery);
  response.send(district);
});

// API 5 DELETE a district
app.delete("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = ` 
    DELETE FROM
        district
     WHERE 
        district_id = ${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

// API 6 Update details of a district
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = ` 
    UPDATE
        district
     SET 
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
     WHERE district_id = ${districtId};`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

// API 7 GET stats of a state
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsQuery = ` 
    SELECT 
        SUM(cases) as totalCases,
        SUM(cured) as totalCured,
        SUM(active) as totalActive,
        SUM(deaths) as totalDeaths
     FROM
        district
     WHERE
        state_id = ${stateId};`;
  const stats = await db.get(getStatsQuery);
  response.send(stats);
});

// API 8 GET state_name from district_id
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateFromDistrictId = `
    SELECT
        state_name as stateName
     FROM 
        state INNER JOIN district ON state.state_id = district.state_id
     WHERE district_id = ${districtId};`;
  const reqState = await db.get(getStateFromDistrictId);
  response.send(reqState);
});

module.exports = app;
