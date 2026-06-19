function isNoCoPower(playerInfo) {
  return playerInfo.players_co_id === 31;
}

function getCoUnitValueCoefficient(playerInfo) {
  let coName = playerInfo.co_name;
  if (coName === "Colin") return 0.8;
  if (coName === "Kanbei") return 1.2;
  if (coName === "Hachi") {
    if (playerInfo.players_co_power_on === "Y" || playerInfo.players_co_power_on === "S") {
      return 0.5;
    }
    return 0.9;
  }
  return 1;
}

function getUnitValue(unit, playerInfo) {
  return unit.unitValue() * getCoUnitValueCoefficient(playerInfo);
}

function getTotalRepairCost(repairingUnits, playerInfo) {
  let maxRepair = playerInfo.co_name === "Rachel" ? 3 : 2;
  let valueCoefficient = getCoUnitValueCoefficient(playerInfo);

  let totalRepairCost = 0;
  for (let unit of repairingUnits) {
    let parsedHp = parseInt(unit.hp);
    if (isNaN(parsedHp)) continue;

    let missingHp = 10 - parsedHp;
    let repairHp = Math.min(missingHp, maxRepair);
    let repairCost = (repairHp / 10) * unit.unitData().cost * valueCoefficient;
    totalRepairCost += repairCost;
  }
  return totalRepairCost;
}

const kPowerHtml = `<div class="cop-on-text co-bar-power-cop" style="visibility: visible;">POWER</div>`;
const kSuperHtml = `<div class="cop-on-text co-bar-power-scop" style="visibility: visible;">SUPER</div>`;

function templatePlayerOverviewCo(gameInfo, playerInfo, liveInfo) {
  let eliminated = liveInfo.eliminated;
  let coName = playerInfo.co_name.toLowerCase().replace(" ", "");
  let clockText = "--:--:--";

  let funds = liveInfo.funds;
  if (liveInfo.is_hidden) {
    funds = "? " + (liveInfo.funds < 0 ? "-" : "+") + " " + Math.abs(liveInfo.funds);
  }

  let expectedRepairs = getTotalRepairCost(liveInfo.repairing_units || [], playerInfo);

  let portraitPrefix = gameInfo.portraitsPrefix;
  if (coName === "sturm" && portraitPrefix.indexOf("ds") !== -1) {
    portraitPrefix = portraitPrefix.replace("ds", "aw2");
  }

  return `
<div class="player-overview-co ${eliminated ? 'player-overview-eliminated-bg' : ''}">
  <span class="player-activity-status"></span>
  <span class="player-co-container co-container">
    <a class="player-co js-player-portrait" target="_blank">
      <img src="${portraitPrefix}${coName}.png" height="28" style="cursor: pointer;">
    </a>
  </span>
  <span>
    <div class="player-overview-timer">
      <img src="terrain/bootaetclock.gif">
      <span class="player-timer ${eliminated ? 'strikethrough italic' : ''}">
        ${clockText}
      </span>
    </div>
    <div class="awbwenhancements-player-funds-container">
      <img style="margin-left: 2px; width: 12px" src="terrain/coin.gif">
      <span class="player-funds ${eliminated ? 'italic' : ''}">${funds}</span>
      <span class="awbwenhancements-player-funds-display hover-text">
        <div style="justify-content: normal;">
          Repairs bill:
          <span style="margin-left: 10px; text-align: left;">
            <img style="margin-right: -2px; width: 12px" src="terrain/coin.gif">
            ${expectedRepairs}
          </span>
        </div>
        <div>(Click funds to edit.)</div>
      </span>
    </div>
  </span>
</div>`;
}

function templatePlayerUnitList(gameInfo, playerInfo, playerUnits) {
  let unitCounts = {};
  for (let unit of playerUnits) {
    if (!(unit.unit in unitCounts)) {
      unitCounts[unit.unit] = 0;
    }
    unitCounts[unit.unit] += 1;
  }

  let unitListHtml = "";
  for (let unitId of kUnitNamesInMenuOrder) {
    if (!(unitId in unitCounts)) {
      continue;
    }

    let url = gameInfo.baseUrl + "/" + playerInfo.countries_code + unitId + ".gif";
    let count = unitCounts[unitId];
    unitListHtml += `
            <div class="unit-count-${unitId}">
              <div>
                <img src="${url}" alt="Unit-count sprite">
              </div>
              <span> x ${count} </span>
            </div>
        `;
  }
  return unitListHtml;
}

function templatePlayerUnitValueList(gameInfo, playerInfo, playerUnits) {
  let unitValues = {};
  for (let unit of playerUnits) {
    if (!(unit.unit in unitValues)) {
      unitValues[unit.unit] = 0;
    }
    unitValues[unit.unit] += getUnitValue(unit, playerInfo);
  }

  let unitValueListHtml = "";
  for (let unitId of kUnitNamesInMenuOrder) {
    if (!(unitId in unitValues)) {
      continue;
    }

    let url = gameInfo.baseUrl + "/" + playerInfo.countries_code + unitId + ".gif";
    let value = unitValues[unitId];
    unitValueListHtml += `
            <div class="unit-count-${unitId}" style="margin: 2px;">
              <div>
                <span class="unit-value-icon" style="margin-right: 2px">
                  <img style="margin-right: 2px" src="${url}" alt="Unit-value sprite">
                  <img class="coin" style="margin-right: -1px; bottom: -2px;" src="terrain/coin.gif">
                </span>
              </div>
              <span> ${value / 1000}k </span>
            </div>
        `;
  }
  return unitValueListHtml;
}

function templatePlayerPropertyList(gameInfo, playerInfo, playerProperties) {
  let propertyCounts = {};
  for (let property of playerProperties) {
    if (!(property.tile in propertyCounts)) {
      propertyCounts[property.tile] = 0;
    }
    propertyCounts[property.tile] += 1;
  }

  let country = kCountriesByCode[playerInfo.countries_code];
  let propertyListHtml = "";
  for (let tile of kPropertyNames) {
    if (!(tile in propertyCounts)) {
      continue;
    }

    let url = gameInfo.baseUrl + "/" + country.flatName + tile + ".gif";
    let count = propertyCounts[tile];
    propertyListHtml += `
            <div class="unit-count-${tile}">
              <div>
                <img src="${url}" alt="Property-count sprite">
              </div>
              <span> x ${count} </span>
            </div>
        `;
  }
  return propertyListHtml;
}

function templatePlayerOverviewInfo(gameInfo, playerInfo, liveInfo, playerUnits, playerProperties) {
  let eliminated = liveInfo.eliminated;
  let countryCode = playerInfo.countries_code;

  let unitCount = liveInfo.unit_count;
  let unitValue = liveInfo.unit_value;
  let income = liveInfo.income;

  if (liveInfo.has_hidden_hp) {
    unitValue = "? + " + liveInfo.unit_value;
  }

  let unitListHtml = templatePlayerUnitList(gameInfo, playerInfo, playerUnits);
  let unitValueListHtml = templatePlayerUnitValueList(gameInfo, playerInfo, playerUnits);
  let propertyListHtml = templatePlayerPropertyList(gameInfo, playerInfo, playerProperties);
  return `
<div class="player-overview-info">
  <ul class="awbwenhancements-${countryCode}-player-border">
    <li class="player-overview-unit-count">
      <img src="${gameInfo.baseUrl}/${countryCode}infantry.gif">
      <span class="player-overview-units-total unit-count">
        <span class="unit-count-total ${eliminated ? 'italic' : ''}">${unitCount}</span>
      </span>
      <div class="unit-count-display">
        <div>
          ${unitListHtml}
        </div>
      </div>
    </li>
    <li class="player-overview-unit-count">
      <span class="unit-value-icon">
        <img src="${gameInfo.baseUrl}/${countryCode}infantry.gif">
        <img class="coin" src="terrain/coin.gif">
      </span>
      <span class="unit-value ${eliminated ? 'italic' : ''}">${unitValue}</span>
      <div class="unit-count-display">
        <div>
          ${unitValueListHtml}
        </div>
      </div>
    </li>
    <li class="player-overview-unit-count">
      <img style="margin-left: 3px" src="terrain/capt.gif">
      <span class="player-income ${eliminated ? 'italic' : ''}">${income}</span>
      <div class="unit-count-display">
        <div>
          ${propertyListHtml}
        </div>
      </div>
    </li>
  </ul>
</div>`;
}

function templatePlayerOverview(gameInfo, playerInfo, liveInfo, playerUnits, playerProperties) {
  let playerId = playerInfo.players_id;
  let username = playerInfo.users_username;
  let countryCode = playerInfo.countries_code;
  let eliminated = liveInfo.eliminated;
  let overviewCoHtml = templatePlayerOverviewCo(gameInfo, playerInfo, liveInfo);
  let overviewInfoHtml = templatePlayerOverviewInfo(gameInfo, playerInfo, liveInfo, playerUnits, playerProperties);
  return `
<div class="player-overview">
  <div class="player-overview-content">
    <div class="player-overview-main">
      <header class="awbwenhancements-${countryCode}-player-banner">
        <span class="player-username ${eliminated ? 'striked' : ''}">
          <a href="profile.php?username=${username}" target="_blank">${username}</a>
        </span>
        <img src="terrain/aw2/${countryCode}logo.gif" class="player-country-logo">
        ${liveInfo.is_current_turn ?
      '<img src="terrain/yourturn_arrow.gif" class="current-turn-arrow">' : ''}
      </header>
      ${overviewCoHtml}
    </div>
  </div>
  ${overviewInfoHtml}
</div>`;
}

function templateBars(numBars, isSuper) {
  if (numBars <= 0) return "";
  let widthFraction = 100 / numBars;

  let openBarHtml = `
<div class="${isSuper ? 'scop-star' : 'cop-star'} power-star"
     style="width: ${widthFraction}%; border-right: 1px solid #000; height: 100%;">
  <div class="power-star-percent" style="width: 0%; height: 100%; position: absolute; top: 0; left: 0; background-color: #39ff14; pointer-events: none;"></div>
  <div class="power-star-percent-extra" style="width: 0%; height: 100%; position: absolute; top: 0; left: 0; background-color: rgba(57, 255, 20, 0.6); pointer-events: none;"></div>
</div>`;
  let closedBarHtml = `
<div class="${isSuper ? 'scop-star' : 'cop-star'} power-star"
     style="width: ${widthFraction}%; border-right: none; height: 100%;">
  <div class="power-star-percent" style="width: 0%; height: 100%; position: absolute; top: 0; left: 0; background-color: #39ff14; pointer-events: none;"></div>
  <div class="power-star-percent-extra" style="width: 0%; height: 100%; position: absolute; top: 0; left: 0; background-color: rgba(57, 255, 20, 0.6); pointer-events: none;"></div>
</div>`;

  return openBarHtml.repeat(Math.max(0, numBars - 1)) + closedBarHtml;
}

function templatePlayerOverviewBar(gameInfo, playerInfo, liveInfo) {
  if (isNoCoPower(playerInfo)) {
    return "";
  }

  let co = kCosByName[playerInfo.co_name] || { co_max_power: 270000, co_max_spower: 540000 };

  // HTML structure heavily relies on BASE powers to always draw the correct physical number of stars
  let copBars = co.co_max_power / 90000;
  let scopBars = (co.co_max_spower - co.co_max_power) / 90000;

  let isCopActive = liveInfo.co_power === "Y";
  let isScopActive = liveInfo.co_power === "S";
  let isAnyPower = isCopActive || isScopActive;
  let powerHtml = isScopActive ? kSuperHtml : (isCopActive ? kPowerHtml : "");

  // Special handling for Von Bolt
  if (co.co_max_power === co.co_max_spower) {
    scopBars = copBars;
    copBars = 0;
  }

  let copBarsHtml = templateBars(copBars, false);
  let scopBarsHtml = templateBars(scopBars, true);

  return `
<div class="player-overview-bar">
  <div class="main-co-bar co-bar-container">
    ${powerHtml}
    
    <div class="power-bar" data-bar-pid="${playerInfo.players_id}" style="visibility: ${isAnyPower ? 'hidden' : 'visible'};">
      <div class="power-percent-display hover-text">
        <span class="cop-percent-display power-info">
          <span class="percent-hint">
            <span>Loading charge tracking...</span>
          </span>
        </span>
      </div>

      <div class="co-power" style="width: ${100 * (copBars / (copBars + scopBars))}%; border-right: ${copBars > 0 ? '1px solid black' : 'none'};">
        ${copBarsHtml}
      </div>
      <div class="super-co-power" style="width: ${100 * (scopBars / (copBars + scopBars))}%;">
        ${scopBarsHtml}
      </div>
    </div>
  </div>
  
  <div class="power-buttons">
    <div class="hover-text-container">
      <img src="terrain/aw2/redstar.gif" alt="COP Button" class="cop-button" style="display: block;">
      <span class="player-cop-text hover-text">Toggle COP</span>
    </div>
    <div class="hover-text-container">
      <img src="terrain/aw2/bluestar.gif" alt="SCOP Button" class="scop-button" style="display: block;">
      <span class="player-scop-text hover-text">Toggle SCOP</span>
    </div>
  </div>
</div>`;
}

function templateEndTurnButton(gameInfo, playerInfo, liveInfo) {
  if (!liveInfo.is_current_turn) {
    return "";
  }
  return `
<div class="js-end-turn-btn game-tools-btn"
     style="width: 55px; margin-left: 5px; display: flex;">
  <div class="game-tools-bg">
    <img src="terrain/endturn.gif" style="vertical-align:middle;">
    <b class="small_text" style="vertical-align:middle;">End</b>
  </div>
  <span class="game-tools-btn-text small_text">End Turn</span>
</div>`;
}

function templatePlayerHtml(gameInfo, playerInfo, liveInfo, playerUnits, playerProperties) {
  let playerOverview = templatePlayerOverview(gameInfo, playerInfo, liveInfo, playerUnits, playerProperties);
  let playerBar = templatePlayerOverviewBar(gameInfo, playerInfo, liveInfo);
  let endTurnButton = templateEndTurnButton(gameInfo, playerInfo, liveInfo);

  return `
<div class="awbwenhancements-player-entry">
  <div class="awbwenhancements-player-banner">
    <div class="awbwenhancements-player-status">
      ${playerOverview}
    </div>
    <div class="awbwenhancements-player-controls">
      ${endTurnButton}
    </div>
  </div>
  <div class="awbwenhancements-player-bar">
    ${playerBar}
  </div>
</div>
`;
}

class PlayerPanel {
  constructor(parentPanel, coSelectPanel, gameInfo, playerInfo, endTurnCallback, copUpdateCallback) {
    
    // --- INJECT ROBUST STYLESHEET ---
    if (!document.getElementById("awbw-charge-tracker-fix")) {
      const style = document.createElement("style");
      style.id = "awbw-charge-tracker-fix";
      style.textContent = `
        .awbwenhancements-player-bar {
          width: 100% !important;
        }
        .awbwenhancements-player-bar .player-overview-bar {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          width: 100% !important;
        }
        .awbwenhancements-player-bar .main-co-bar {
          display: flex !important;
          align-items: center !important;
          flex-grow: 1 !important;
          margin-right: 10px !important;
        }
        .awbwenhancements-player-bar .power-bar {
          flex-grow: 1 !important;
          height: 11px !important;
          display: flex !important;
          align-items: center !important;
          border: 1px solid black !important;
          background-color: white !important;
          position: relative !important;
          box-sizing: content-box !important;
        }
        .awbwenhancements-player-bar .power-percent-display {
          position: absolute !important;
          left: 0 !important;
          top: 15px !important;
          width: max-content !important;
          min-width: 180px !important;
          z-index: 1000 !important;
        }
        .awbwenhancements-player-bar .power-info {
          display: block !important;
          width: max-content !important;
          min-width: 180px !important;
        }
        .awbwenhancements-player-bar .percent-hint {
          display: block !important;
          white-space: nowrap !important;
        }
        .awbwenhancements-player-bar .co-power {
          display: flex !important;
          height: 7px !important;
        }
        .awbwenhancements-player-bar .super-co-power {
          display: flex !important;
          height: 100% !important;
        }
        .awbwenhancements-player-bar .power-star {
          position: relative !important;
          box-sizing: border-box !important;
          overflow: hidden !important; 
        }
      `;
      document.head.appendChild(style);
    }
    // --------------------------------

    this.parentPanel = parentPanel;
    this.coSelectPanel = coSelectPanel;
    this.gameInfo = gameInfo;
    this.playerInfo = playerInfo;
    
    let co = kCosByName[playerInfo.co_name] || { co_max_power: 270000, co_max_spower: 540000 };

    // Safely parse max powers to prevent string concatenation if AWBW JSON passes them as strings
    let p_max = parseInt(playerInfo.players_co_max_power);
    let initMax = (!isNaN(p_max) && p_max > 0) ? p_max : (parseInt(playerInfo.co_max_power) || co.co_max_power);

    let p_smax = parseInt(playerInfo.players_co_max_spower);
    let initSmax = (!isNaN(p_smax) && p_smax > 0) ? p_smax : (parseInt(playerInfo.co_max_spower) || co.co_max_spower);

    this.liveInfo = {
      is_current_turn: playerInfo.is_current_turn,
      eliminated: (playerInfo.players_eliminated === "Y"),
      funds: (playerInfo.players_funds !== "?" ? playerInfo.players_funds : 0),
      is_hidden: (playerInfo.players_funds === "?"),
      income: playerInfo.players_income || 0,
      players_co_id: playerInfo.players_co_id,
      co_name: playerInfo.co_name,
      co_power: playerInfo.players_co_power_on,
      unit_count: 12,
      unit_value: 100,
      has_hidden_hp: false,
      
      // Tracking state
      players_co_power: parseInt(playerInfo.players_co_power) || 0,
      players_ex_power: 0,
      players_co_max_power: initMax,
      players_co_max_spower: initSmax,
      myUnitValueChange: 0,
      allUnitValueChanges: 0,
      historicNet: 0
    };
    
    this.playerUnits = [];
    this.playerProperties = [];
    this.pendingBuilds = {};

    this.endTurnCallback = endTurnCallback;
    this.copUpdateCallback = copUpdateCallback;

    this.panel = document.createElement("div");
    this.panel.id = "player" + playerInfo.players_id;
    this.panel.classList.add("player-overview-container");

    this.parentPanel.appendChild(this.panel);
    this.updateHtml();
  }

  assembleSavestateData() {
    return this.liveInfo;
  }

  applySavestateData(data) {
    this.liveInfo.is_current_turn = data.is_current_turn;
    this.liveInfo.funds = data.funds;

    this.liveInfo.players_co_id = data.players_co_id;
    this.liveInfo.co_name = data.co_name;
    this.liveInfo.co_power = data.co_power;
    
    this.liveInfo.players_co_power = data.players_co_power;
    this.liveInfo.players_ex_power = data.players_ex_power;
    this.liveInfo.players_co_max_power = data.players_co_max_power;
    this.liveInfo.players_co_max_spower = data.players_co_max_spower;
    this.liveInfo.myUnitValueChange = data.myUnitValueChange;
    this.liveInfo.allUnitValueChanges = data.allUnitValueChanges;
    this.liveInfo.historicNet = data.historicNet;

    this.playerInfo.players_co_id = data.players_co_id;
    this.playerInfo.co_name = data.co_name;
    this.playerInfo.players_co_power_on = data.co_power;

    this.updateHtml();
  }

  generateHtml() {
    return templatePlayerHtml(this.gameInfo, this.playerInfo, this.liveInfo, this.playerUnits, this.playerProperties);
  }

  updateHtml() {
    this.panel.innerHTML = DOMPurify.sanitize(this.generateHtml());

    let fundsContainer = this.panel.getElementsByClassName("awbwenhancements-player-funds-container");
    if (fundsContainer.length !== 0) {
      fundsContainer[0].addEventListener("click", this.onFundsClick.bind(this));
    }

    let copButton = this.panel.getElementsByClassName("cop-button");
    if (copButton.length !== 0) {
      copButton[0].addEventListener("click", this.onCopButtonClick.bind(this));
    }
    let scopButton = this.panel.getElementsByClassName("scop-button");
    if (scopButton.length !== 0) {
      scopButton[0].addEventListener("click", this.onScopButtonClick.bind(this));
    }
    let endTurnButton = this.panel.getElementsByClassName("js-end-turn-btn");
    if (endTurnButton.length !== 0) {
      endTurnButton[0].addEventListener("click", this.onEndTurnButtonClick.bind(this));
    }

    let playerPortraits = this.panel.getElementsByClassName("js-player-portrait");
    for (let playerPortrait of playerPortraits) {
      playerPortrait.addEventListener("click", (event) => {
        this.onPlayerPortraitClick(playerPortrait, event);
      });
    }
    
    this.updatePowerBarValues();
  }
  
  updatePowerBarValues() {
    let co = kCosByName[this.playerInfo.co_name] || { co_max_power: 270000, co_max_spower: 540000 };

    let copStars = co.co_max_power / 90000;
    let scopStars = (co.co_max_spower - co.co_max_power) / 90000;

    if (co.co_max_power === co.co_max_spower) {
      scopStars = copStars;
      copStars = 0;
    }
    
    let currentCopMax = this.liveInfo.players_co_max_power || co.co_max_power;
    let currentScopMax = this.liveInfo.players_co_max_spower || co.co_max_spower;

    let ratioToCop = (this.liveInfo.players_co_power / currentCopMax);
    let ratioToScop = (this.liveInfo.players_co_power / currentScopMax);
    
    let predictedPower = this.liveInfo.players_co_power + (this.liveInfo.players_ex_power || 0);
    let newRatioToCop = (predictedPower / currentCopMax);
    let newRatioToScop = (predictedPower / currentScopMax);
    
    // Fill COP Meter
    let copMeter = this.panel.getElementsByClassName("co-power");
    if (copMeter.length > 0 && copMeter[0] != null) {
      let currentCopStar = 0;
      let stars = copMeter[0].children;
      while (currentCopStar < stars.length) {
        if(stars[currentCopStar].children.length >= 2) {
          let subRatio = Math.min(1.0, Math.max(0, ratioToCop * copStars - currentCopStar));
          let newChargeRatio = Math.min(1.0, Math.max(0, newRatioToCop * copStars - currentCopStar));
          stars[currentCopStar].children[0].style.width = (subRatio * 100) + "%";
          if (subRatio < 1.0) {
            stars[currentCopStar].children[1].style.width = ((newChargeRatio - subRatio) * 100) + "%";
            stars[currentCopStar].children[1].style.left = (subRatio * 100) + "%";
          } else {
            stars[currentCopStar].children[1].style.width = "0%";
          }
        }
        currentCopStar++;
      }
    }

    // Fill SCOP Meter
    let scopMeter = this.panel.getElementsByClassName("super-co-power");
    if (scopMeter.length > 0 && scopMeter[0] != null) {
      let currentScopStar = 0;
      let stars = scopMeter[0].children;
      while (currentScopStar < stars.length) {
        if(stars[currentScopStar].children.length >= 2) {
          let subRatio = Math.min(1.0, Math.max(0, ratioToScop * (scopStars + copStars) - (copStars + currentScopStar)));
          let newChargeRatio = Math.min(1.0, Math.max(0, newRatioToScop * (scopStars + copStars) - (copStars + currentScopStar)));
          stars[currentScopStar].children[0].style.width = (subRatio * 100) + "%";
          if (subRatio < 1.0) {
            stars[currentScopStar].children[1].style.width = ((newChargeRatio - subRatio) * 100) + "%";
            stars[currentScopStar].children[1].style.left = (subRatio * 100) + "%";
          } else {
            stars[currentScopStar].children[1].style.width = "0%";
          }
        }
        currentScopStar++;
      }
    }

    let percentHints = this.panel.getElementsByClassName("percent-hint");
    if (percentHints.length > 0 && percentHints[0] != null) {
      let percentSpan = percentHints[0];

      let newCOP = predictedPower / 10;
      let maxCop = currentCopMax / 10;
      let maxScop = currentScopMax / 10;
      
      let dmgLost = this.liveInfo.myUnitValueChange || 0;
      let dmgDealt = Math.max(0, (this.liveInfo.allUnitValueChanges || 0) - dmgLost);
      let netDmg = dmgDealt - dmgLost;
      let ntdDmg = (this.liveInfo.historicNet || 0) + netDmg;

      percentSpan.innerHTML = `
        <div style="margin-bottom: 0.5em;">
          CO Power<br>[ ${Math.min(newCOP, maxCop)} / ${maxCop} ]
        </div>
        <div style="margin-bottom: 0.5em;">
          Super CO Power<br>[ ${Math.min(newCOP, maxScop)} / ${maxScop} ]
        </div>
        <div style="margin-bottom: 0.5em; color: rgb(255,109,96);">
          Funds Dmg Lost:<br>${dmgLost}
        </div>
        <div style="margin-bottom: 0.5em; color: rgb(96,255,111);">
          Funds Dmg Dealt:<br>${dmgDealt}
        </div>
        <div style="margin-bottom: 0.5em; color: rgb(106,134,255);">
          Net: ${netDmg}
        </div>
        <div style="color: rgb(206,234,255);">
          NTD: ${ntdDmg}
        </div>
      `;
    }
  }

  onFundsClick() {
    let username = this.playerInfo.users_username;
    let countryCode = this.playerInfo.countries_code;
    let name = username + " (" + kCountriesByCode[countryCode]?.name + ")";

    let newFundsText = prompt("Enter new funds value for " + name, "" + this.liveInfo.funds);
    if (newFundsText == null) return;

    let parsedFunds = parseInt(newFundsText);
    if (isNaN(parsedFunds)) return;

    this.liveInfo.funds = parsedFunds;
    this.updateHtml();
  }

  onCopButtonClick() {
    let co = kCosByName[this.playerInfo.co_name] || { co_max_power: 270000, co_max_spower: 540000 };
    let baseCop = co.co_max_power;
    let baseScop = co.co_max_spower;

    if (this.liveInfo.co_power === "Y") {
      this.liveInfo.co_power = "N";
      // Revert charge and cost modifiers (Additive)
      this.liveInfo.players_co_max_power = Math.max(baseCop, this.liveInfo.players_co_max_power - (baseCop * 0.2));
      this.liveInfo.players_co_max_spower = Math.max(baseScop, this.liveInfo.players_co_max_spower - (baseScop * 0.2));
      this.liveInfo.players_co_power += this.liveInfo.players_co_max_power; // Refund the cost
    } else {
      this.liveInfo.co_power = "Y";
      // Apply charge reduction and +20% cost scaling (Additive), capping at 9 uses (2.8x base)
      this.liveInfo.players_co_power -= this.liveInfo.players_co_max_power;
      if (this.liveInfo.players_co_power < 0) this.liveInfo.players_co_power = 0;
      this.liveInfo.players_co_max_power = Math.min(baseCop * 2.8, this.liveInfo.players_co_max_power + (baseCop * 0.2));
      this.liveInfo.players_co_max_spower = Math.min(baseScop * 2.8, this.liveInfo.players_co_max_spower + (baseScop * 0.2));
    }
    this.playerInfo.players_co_power_on = this.liveInfo.co_power;
    this.updateHtml();
    this.copUpdateCallback();
  }

  onScopButtonClick() {
    let co = kCosByName[this.playerInfo.co_name] || { co_max_power: 270000, co_max_spower: 540000 };
    let baseCop = co.co_max_power;
    let baseScop = co.co_max_spower;

    if (this.liveInfo.co_power === "S") {
      this.liveInfo.co_power = "N";
      // Revert charge and cost modifiers (Additive)
      this.liveInfo.players_co_max_power = Math.max(baseCop, this.liveInfo.players_co_max_power - (baseCop * 0.2));
      this.liveInfo.players_co_max_spower = Math.max(baseScop, this.liveInfo.players_co_max_spower - (baseScop * 0.2));
      this.liveInfo.players_co_power += this.liveInfo.players_co_max_spower; // Refund the cost
    } else {
      this.liveInfo.co_power = "S";
      // Apply charge reduction and +20% cost scaling (Additive), capping at 9 uses (2.8x base)
      this.liveInfo.players_co_power -= this.liveInfo.players_co_max_spower;
      if (this.liveInfo.players_co_power < 0) this.liveInfo.players_co_power = 0;
      this.liveInfo.players_co_max_power = Math.min(baseCop * 2.8, this.liveInfo.players_co_max_power + (baseCop * 0.2));
      this.liveInfo.players_co_max_spower = Math.min(baseScop * 2.8, this.liveInfo.players_co_max_spower + (baseScop * 0.2));
    }
    this.playerInfo.players_co_power_on = this.liveInfo.co_power;
    this.updateHtml();
    this.copUpdateCallback();
  }

  onEndTurnButtonClick() {
    this.endTurnCallback();
  }

  onPlayerPortraitClick(playerPortrait, event) {
    if (this.coSelectPanel.hidden) {
      let rect = playerPortrait.getBoundingClientRect();
      this.coSelectPanel.openPanel(rect, (coName) => {
        let co = kCosByName[coName];
        if (co !== undefined) {
          let baseIncome = this.liveInfo.income / this.getCoFundsPerProperty();

          this.liveInfo.players_co_id = co.players_co_id;
          this.liveInfo.co_name = co.name;

          this.playerInfo.players_co_id = this.liveInfo.players_co_id;
          this.playerInfo.co_name = this.liveInfo.co_name;

          this.liveInfo.income = baseIncome * this.getCoFundsPerProperty();

          this.liveInfo.players_co_max_power = co.co_max_power;
          this.liveInfo.players_co_max_spower = co.co_max_spower;

          this.updateHtml();
          this.copUpdateCallback();
        }
      });
    } else {
      this.coSelectPanel.hidePanel();
    }
  }

  getCoFundsPerProperty() {
    let coName = this.playerInfo.co_name;
    if (coName === "Sasha") {
      return fundsPerProperty + 100;
    }
    return fundsPerProperty;
  }

  setCoPortraitsPrefix(portraitsPrefix) {
    this.gameInfo.portraitsPrefix = portraitsPrefix;
    this.updateHtml();
  }

  setMapInfo(properties, units) {
    this.playerUnits = units;
    this.playerProperties = properties;

    let incomeProperties = properties.filter((p) => p.producesIncome()).length;
    let income = incomeProperties * this.getCoFundsPerProperty();

    let towers = properties.filter((p) => p.isTower()).length;

    let propertiesByCoordId = toDict(properties, (prop) => prop.coords.x + "," + prop.coords.y);

    let unitCount = units.length;
    let unitValue = 0;
    let hasHiddenHp = false;
    let repairingUnits = [];
    for (let unit of units) {
      let value = getUnitValue(unit, this.playerInfo);
      if (!isNaN(value)) {
        unitValue += value;
      } else {
        hasHiddenHp = true;
      }

      let parsedHp = parseInt(unit.hp);
      if (!isNaN(parsedHp) && parsedHp < 10) {
        let repairTileTypes = lookupRepairTileTypesForUnit(unit.unit);
        let unitCoordId = unit.coords.x + "," + unit.coords.y;
        let unitProperty = propertiesByCoordId[unitCoordId];
        if (unitProperty !== undefined && repairTileTypes.includes(unitProperty.tile)) {
          repairingUnits.push(unit);
        }
      }
    }

    let needsUpdate = (this.liveInfo.towers !== towers);

    this.liveInfo.income = income;
    this.liveInfo.towers = towers;
    this.liveInfo.unit_count = unitCount;
    this.liveInfo.unit_value = unitValue;
    this.liveInfo.has_hidden_hp = hasHiddenHp;
    this.liveInfo.repairing_units = repairingUnits;

    this.updateHtml();

    return needsUpdate;
  }

  async startTurn(performRepairs = false) {
    let totalRepairCost = getTotalRepairCost(this.liveInfo.repairing_units || [], this.playerInfo);
    this.liveInfo.funds -= totalRepairCost;
    this.liveInfo.funds += this.liveInfo.income;

    if (performRepairs && this.liveInfo.repairing_units) {
      for (let unit of this.liveInfo.repairing_units) {
        await this.repairUnit(unit);
      }
    }

    this.liveInfo.players_co_power += (this.liveInfo.players_ex_power || 0);
    this.liveInfo.players_ex_power = 0;

    this.liveInfo.is_current_turn = true;
    this.liveInfo.co_power = "N";
    this.playerInfo.players_co_power_on = this.liveInfo.co_power;
    this.updateHtml();
    this.copUpdateCallback();
  }

  async repairUnit(unit) {
    let clickTarget = unit.element.querySelector("img") || unit.element;
    clickTarget.click();
    await new Promise(resolve => setTimeout(resolve, 50));

    let currentHp = parseInt(unit.hp);
    let maxRepair = this.playerInfo.co_name === "Rachel" ? 3 : 2;
    let newHp = Math.min(currentHp + maxRepair, 10);

    let hpInput = document.getElementById("hp");
    if (hpInput) {
      hpInput.value = newHp;
      hpInput.dispatchEvent(new Event('input', { bubbles: true }));
      hpInput.dispatchEvent(new Event('change', { bubbles: true }));

      let setHpItem = document.getElementById("set-hp");
      if (setHpItem) {
        setHpItem.click();
      }
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  endTurn() {
    this.liveInfo.is_current_turn = false;
    this.updateHtml();
  }

  async handleUnitBuilt(property, builtUnitName) {
    let unitData = lookupUnitDataByBuildMenuName(builtUnitName);
    let cost = unitData.cost * getCoUnitValueCoefficient(this.playerInfo);

    let unitExistsBefore = this.unitExistsAtCoords(property.coords);
    let coordKey = property.coords.x + "," + property.coords.y;
    let buildId = Date.now() + Math.random();
    this.pendingBuilds[coordKey] = buildId;

    let unitExistsAfter = unitExistsBefore;
    let attempts = 0;
    const maxAttempts = 50; 

    while (!unitExistsAfter && attempts < maxAttempts) {
      if (this.pendingBuilds[coordKey] !== buildId) {
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
      unitExistsAfter = this.unitExistsAtCoords(property.coords);
      attempts++;
    }

    if (this.pendingBuilds[coordKey] !== buildId) {
      return;
    }

    if (unitExistsAfter) {
      this.liveInfo.funds -= cost;
      this.updateHtml();
      delete this.pendingBuilds[coordKey];
    }
  }

  unitExistsAtCoords(coords) {
    let gamemap = document.getElementById("gamemap");
    if (!gamemap) return false;

    let units = gamemap.querySelectorAll(`span[id^='unit_']`);

    for (let unitElement of units) {
      let left = parseInt(unitElement.style.left);
      let top = parseInt(unitElement.style.top);

      let unitX = Math.round(left / 16);
      let unitY = Math.round(top / 16);

      if (unitX === coords.x && unitY === coords.y) {
        return true;
      }
    }

    return false;
  }
}