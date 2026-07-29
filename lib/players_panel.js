const kSidebarContainerHtml = `
<div class="awbwenhancements-sidebar-outer-container">
  <div id="awbwenhancements-sidebar-container" class="awbwenhancements-sidebar-inner-container">
    <div id="awbwenhancements-sidebar-contents" class="awbwenhancements-sidebar-contents">
      <div id="awbwenhancements-players-panel" class="awbwenhancements-sidebar-entry"></div>
      <div id="awbwenhancements-removed-units"></div>
    </div>
  </div>
</div>
`;

function makeSidebarContainer() {
    let tempNode = document.createElement("div");
    tempNode.innerHTML = kSidebarContainerHtml;
    return tempNode.children[0];
}

class PlayersPanel {
    constructor(replayContainer, baseUrl, profileSettingsReader, players) {
        this.replayContainer = replayContainer;
        this.profileSettingsReader = profileSettingsReader;
        this.players = players;

        this.playersInfoPatchElement = document.getElementById("awbw_enhancements-playersInfo-patch");
        
        // Timer to prevent false charge gains when loading savestates / undoing
        this.ignoreChargeUntil = 0; 
        this.isUndeleting = false;

        profileSettingsReader.addProfileSettingsUpdateListener(() => {
            let portraitsPrefix = profileSettingsReader.getCoPortraitsPrefix();
            for (let countryCode in this.playerPanels) {
                let panel = this.playerPanels[countryCode];
                panel.setCoPortraitsPrefix(portraitsPrefix);
            }
            this.coSelectPanel.setCoPortraitsPrefix(portraitsPrefix);
        });
        let portraitsPrefix = profileSettingsReader.getCoPortraitsPrefix();

        this.day = 1;
        this.turnStartListeners = [];

        this.sidebarContainer = makeSidebarContainer();
        this.replayContainer.appendChild(this.sidebarContainer);

        this.playerInfoContainer = document.getElementById("awbwenhancements-players-panel");
        this.removedUnitsContainer = document.getElementById("awbwenhancements-removed-units");
        this.removedUnitsContainer.appendChild(document.getElementById("planner_removed_units"));

        this.gameInfo = { baseUrl, portraitsPrefix };
        this.coSelectPanel = new CoSelectPanel(this.sidebarContainer, this.gameInfo);

        this.playerPanels = {};
        for (let i = 0; i < this.players.length; i++) {
            let playerInfo = this.players[i];
            let playerPanel = new PlayerPanel(this.playerInfoContainer, this.coSelectPanel, this.gameInfo, playerInfo,
                () => { this.handleTurnEndedFor(i); },
                () => { this.handleCopUpdate(); }
            );
            this.playerPanels[playerInfo.countries_code] = playerPanel;
        }
    }

    addTurnStartListener(listener) {
        this.turnStartListeners.push(listener);
    }

    stateId() {
        return "players_panel";
    }

    assembleSavestateData() {
        let panelStates = [];
        for (let countryCode in this.playerPanels) {
            let playerPanel = this.playerPanels[countryCode];
            panelStates.push({
                country_code: countryCode,
                state: playerPanel.assembleSavestateData(),
            });
        }
        return { day: this.day, panel_states: panelStates };
    }

    applySavestateData(data) {
        // Freeze charge calculations for 500ms so DOM changes from undo don't trigger damage events
        this.ignoreChargeUntil = Date.now() + 500; 

        if (data.day !== undefined) {
            this.day = data.day;
        }

        for (let { country_code, state } of data.panel_states) {
            let playerPanel = this.playerPanels[country_code];
            playerPanel.applySavestateData(state);
        }
        this.injectPlayersInfoPatch();
    }

    async startFirstTurn() {
        let currentPlayer;
        for (let countryCode in this.playerPanels) {
            let panel = this.playerPanels[countryCode];
            if (panel.liveInfo.is_current_turn) {
                currentPlayer = panel.playerInfo.users_username;
            }
        }

        this.updatePowerActivator();

        for (let listener of this.turnStartListeners) {
            listener(this.day, currentPlayer);
        }
    }

    async handleTurnEndedFor(endedIndex) {
        let nextIndex = (endedIndex + 1) % this.players.length;
        if (nextIndex == 0) {
            this.day += 1;
        }

        // Update historic net for all players before advancing
        for (let code in this.playerPanels) {
            let panel = this.playerPanels[code];
            let myLost = panel.liveInfo.myUnitValueChange;
            let othersLost = panel.liveInfo.allUnitValueChanges;
            
            let netThisTurn = Math.max(0, othersLost - myLost) - myLost;
            panel.liveInfo.historicNet += netThisTurn;
            
            panel.liveInfo.myUnitValueChange = 0;
            panel.liveInfo.allUnitValueChanges = 0;
            panel.updatePowerBarValues();
        }

        let endedPlayer = this.players[endedIndex];
        let endedPanel = this.playerPanels[endedPlayer.countries_code];
        endedPanel.endTurn();
        document.getElementById(endedPlayer.countries_code + "-logo").click();
        document.getElementById("unwait-all").click();

        let nextPlayer = this.players[nextIndex];
        let nextPanel = this.playerPanels[nextPlayer.countries_code];
        let repairCount = nextPanel.liveInfo.repairing_units?.length || 0;
        this.ignoreChargeUntil = Date.now() + (repairCount * 150) + 500;
        await nextPanel.startTurn(true); 
        document.getElementById(nextPlayer.countries_code + "-logo").click();

        this.updatePowerActivator();

        for (let listener of this.turnStartListeners) {
            listener(this.day, nextPlayer.users_username);
        }
    }

    handleCopUpdate() {
        this.ignoreChargeUntil = Date.now() + 500;
        this.injectPlayersInfoPatch();
        this.updatePowerActivator();
    }

    injectPlayersInfoPatch() {
        let patches = [];
        for (let country in this.playerPanels) {
            let panel = this.playerPanels[country];
            patches.push({
                id: "" + panel.playerInfo.players_id,
                data: {
                    "players_co_power_on": panel.liveInfo.co_power,
                    "towers": panel.liveInfo.towers,
                    "players_co_id": panel.playerInfo.players_co_id,
                    "co_name": panel.playerInfo.co_name,
                }
            });
        }

        this.playersInfoPatchElement.setAttribute("data", JSON.stringify({ patches }));
        this.playersInfoPatchElement.click();
    }

    triggerChargeEvent(fundsLost, defenderCode) {
        // AWBW Base Math: 9,000 funds = 1 Star. Internally, 1 Star = 90,000 charge. So charge = funds * 10.
        let chargeAmount = fundsLost * 10;
        let attackerCharge = chargeAmount / 2;

        for (let code in this.playerPanels) {
            let panel = this.playerPanels[code];
            let isDefender = (code === defenderCode);

            if (isDefender) {
                // Defender gains 100% of damage taken
                if (panel.liveInfo.co_power === "N") {
                    panel.liveInfo.players_co_power += chargeAmount;
                    if (panel.liveInfo.players_co_power > panel.liveInfo.players_co_max_spower) {
                        panel.liveInfo.players_co_power = panel.liveInfo.players_co_max_spower;
                    }
                    if (panel.liveInfo.players_co_power < 0) {
                        panel.liveInfo.players_co_power = 0;
                    }
                }
                panel.liveInfo.myUnitValueChange += fundsLost;
            } else {
                // Other players involved gain 50% of damage dealt
                if (panel.liveInfo.co_power === "N") {
                    panel.liveInfo.players_co_power += attackerCharge;
                    if (panel.liveInfo.players_co_power > panel.liveInfo.players_co_max_spower) {
                        panel.liveInfo.players_co_power = panel.liveInfo.players_co_max_spower;
                    }
                    if (panel.liveInfo.players_co_power < 0) {
                        panel.liveInfo.players_co_power = 0;
                    }
                }
                panel.liveInfo.allUnitValueChanges += fundsLost;
            }
            panel.updatePowerBarValues();
        }
    }

    handleUpdate(mapEntities) {
        let propertiesByCountry = partitionBy(mapEntities.properties, (property) => property.country.code);
        let unitsByCountry = partitionBy(mapEntities.units, (unit) => unit.country.code);

        // Record old unit values and counts before updating state
        let previousValues = {};
        let previousCounts = {};
        for (let countryCode in this.playerPanels) {
            previousValues[countryCode] = this.playerPanels[countryCode].liveInfo.unit_value;
            previousCounts[countryCode] = this.playerPanels[countryCode].liveInfo.unit_count;
        }

        let needsUpdate = false;
        for (let playerId in this.playerPanels) {
            let playerPanel = this.playerPanels[playerId];
            let countryCode = playerPanel.playerInfo.countries_code;

            let properties = propertiesByCountry[countryCode] || [];
            let units = unitsByCountry[countryCode] || [];
            needsUpdate |= playerPanel.setMapInfo(properties, units);
        }

        // Calculate and distribute charge (skipping if we are currently loading a savestate)
        if (Date.now() > this.ignoreChargeUntil) {
            for (let countryCode in this.playerPanels) {
                let prevValue = previousValues[countryCode];
                let newValue = this.playerPanels[countryCode].liveInfo.unit_value;
                let prevCount = previousCounts[countryCode];
                let newCount = this.playerPanels[countryCode].liveInfo.unit_count;
                
                console.log("AWBW Enhancements - Player Update:", {
                    countryCode: countryCode,
                    prevValue: prevValue,
                    newValue: newValue,
                    prevCount: prevCount,
                    newCount: newCount,
                    fundsLost: (prevValue !== undefined && newValue !== undefined) ? (prevValue - newValue) : null
                });
                
                if (prevValue !== undefined && newValue !== undefined) {
                    let fundsLost = prevValue - newValue;
                    let countIncreased = (newCount > prevCount);
                    if (fundsLost > 0 || (fundsLost < 0 && (!countIncreased || this.isUndeleting))) {
                        this.triggerChargeEvent(fundsLost, countryCode);
                    }
                }
            }
        }

        if (needsUpdate) {
            this.injectPlayersInfoPatch();
        }
    }

    async handleUnitBuilt(property, builtUnitName) {
        let playerPanel = this.playerPanels[property.country.code];
        await playerPanel.handleUnitBuilt(property, builtUnitName);
    }

    updatePowerActivator() {
        let activePanel = null;
        for (let countryCode in this.playerPanels) {
            let panel = this.playerPanels[countryCode];
            if (panel.liveInfo.is_current_turn) {
                activePanel = panel;
                break;
            }
        }
        if (!activePanel) return;

        let countryCode = activePanel.playerInfo.countries_code;
        let coName = activePanel.playerInfo.co_name;

        // 1. Click the country logo in the AWBW CO Power Activator
        let logoEl = document.getElementById(countryCode + "-logo");
        if (logoEl) {
            logoEl.click();
        }

        setTimeout(() => {
            let coSelect = document.getElementById("co-powers");
            if (coSelect && coName) {
                function getCoSlugForSelector(name) {
                    let cleanName = name.toLowerCase().trim();
                    if (cleanName === "von bolt") return "vb";
                    return cleanName.replace(/\s+/g, "");
                }
                
                let coSlug = getCoSlugForSelector(coName);
                let cleanCoName = coName.toLowerCase().replace(/[^a-z0-9]/g, "");
                
                let bestOption = null;
                let isScopMatch = false;
                
                for (let option of coSelect.options) {
                    let valClean = option.value.toLowerCase().replace(/[^a-z0-9]/g, "");
                    let textClean = option.text.toLowerCase().replace(/[^a-z0-9]/g, "");
                    
                    if (valClean.includes(coSlug) || textClean.includes(coSlug) ||
                        valClean.includes(cleanCoName) || textClean.includes(cleanCoName)) {
                        
                        let isSuper = valClean.includes("scop") || valClean.includes("super") || 
                                      textClean.includes("scop") || textClean.includes("super");
                        
                        if (isSuper) {
                            bestOption = option;
                            isScopMatch = true;
                        } else if (!isScopMatch) {
                            bestOption = option;
                        }
                    }
                }
                
                if (bestOption) {
                    coSelect.value = bestOption.value;
                    coSelect.dispatchEvent(new Event("change"));
                }
            }
        }, 50);
    }
}