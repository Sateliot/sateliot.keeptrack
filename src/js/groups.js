/**
 * @prettier
 */

/*! /////////////////////////////////////////////////////////////////////////////

Copyright (C) 2016-2020 Theodore Kruczek
Copyright (C) 2020 Heather Kruczek

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU General Public License as published by the Free Software
Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

///////////////////////////////////////////////////////////////////////////// */

import { ColorScheme } from '@app/js/color-scheme.js';
import { orbitManager } from '@app/js/orbitManager.js';
import { satSet } from '@app/js/satSet.js';
import { settingsManager } from '@app/js/keeptrack-head.js';

('use strict');
var groups = {};
groups.selectedGroup = null;

class SatGroup {
  constructor(groupType, data) {
    var satId;
    var i = 0;
    this.sats = [];
    if (groupType === 'all') {
      data = satSet.getSatData();
      for (i = 0; i < data.length; i++) {
        if (this.sats.length > settingsManager.maxOribtsDisplayed) break;
        if (typeof data[i].SCC_NUM == 'undefined') continue;
        this.sats.push({
          satId: data[i].id,
          isIntlDes: true,
        });
      }
    }
    if (groupType === 'year') {
      data = satSet.searchYear(data);
      for (i = 0; i < data.length; i++) {
        if (this.sats.length > settingsManager.maxOribtsDisplayed) continue;
        this.sats.push({
          satId: data[i],
        });
      }
    } else if (groupType === 'yearOrLess') {
      data = satSet.searchYearOrLess(data);
      for (i = 0; i < data.length; i++) {
        if (this.sats.length > settingsManager.maxOribtsDisplayed) continue;
        this.sats.push({
          satId: data[i],
        });
      }
    } else if (groupType === 'intlDes') {
      for (i = 0; i < data.length; i++) {
        if (this.sats.length > settingsManager.maxOribtsDisplayed) continue;
        var theSatId = satSet.getIdFromIntlDes(data[i]);
        if (theSatId === null) continue;
        this.sats.push({
          satId: theSatId,
          isIntlDes: true,
        });
      }
    } else if (groupType === 'nameRegex') {
      data = satSet.searchNameRegex(data);
      for (i = 0; i < data.length; i++) {
        if (this.sats.length > settingsManager.maxOribtsDisplayed) continue;
        this.sats.push({
          satId: data[i],
        });
      }
    } else if (groupType === 'countryRegex') {
      data = satSet.searchCountryRegex(data);
      for (i = 0; i < data.length; i++) {
        if (this.sats.length > settingsManager.maxOribtsDisplayed) continue;
        this.sats.push({
          satId: data[i],
        });
      }
    } else if (groupType === 'objNum') {
      for (i = 0; i < data.length; i++) {
        satId = satSet.getIdFromObjNum(data[i]);
        if (this.sats.length > settingsManager.maxOribtsDisplayed) continue;
        if (satId === null) continue;
        this.sats.push({
          satId: satId,
          isObjnum: true,
        });
      }
    } else if (groupType === 'idList') {
      for (i = 0; i < data.length; i++) {
        if (this.sats.length > settingsManager.maxOribtsDisplayed) continue;
        this.sats.push({
          satId: data[i],
        });
      }
    }

    this.hasSat = (id) => {
      var len = this.sats.length;
      for (var i = 0; i < len; i++) {
        if (this.sats[i].satId === id) return true;
      }
      return false;
    };
    this.updateOrbits = () => {
      // What calls the orbit buffer when selected a group from the menu.
      for (var i = 0; i < this.sats.length; i++) {
        if (this.sats[i].missile) {
          orbitManager.updateOrbitBuffer(this.sats[i].id, null, null, null, true, this.sats[i].latList, this.sats[i].lonList, this.sats[i].altList, this.sats[i].startTime);
        } else {
          orbitManager.updateOrbitBuffer(this.sats[i].satId);
        }
      }
    };
    this.forEach = (callback) => {
      for (var i = 0; i < this.sats.length; i++) {
        callback(this.sats[i].satId);
      }
    };
  }
}

// Make this available to other functions without renamming it
groups.SatGroup = SatGroup;

groups.selectGroup = function (group) {
  if (group === null || typeof group === 'undefined') {
    return;
  }
  groups.updateIsInGroup(groups.selectedGroup, group);
  groups.selectedGroup = group;
  group.updateOrbits();
  settingsManager.setCurrentColorScheme(ColorScheme.group);
};

groups.selectGroupNoOverlay = function (group) {
  if (group === null || typeof group === 'undefined') {
    return;
  }
  groups.updateIsInGroup(groups.selectedGroup, group);
  groups.selectedGroup = group;
  settingsManager.isGroupOverlayDisabled = true;
  settingsManager.setCurrentColorScheme(ColorScheme.group);
};

groups.updateIsInGroup = function (oldgroup, newgroup) {
  var sat;
  let i;
  if (oldgroup !== null && typeof oldgroup !== 'undefined') {
    for (i = 0; i < oldgroup.sats.length; i++) {
      sat = satSet.getSatExtraOnly(oldgroup.sats[i].satId);
      sat.isInGroup = false;
    }
  }

  if (newgroup === null || typeof newgroup === 'undefined') {
    return;
  }

  for (i = 0; i < newgroup.sats.length; i++) {
    sat = satSet.getSatExtraOnly(newgroup.sats[i].satId);
    sat.isInGroup = true;
  }
};
groups.clearSelect = function () {
  groups.updateIsInGroup(groups.selectedGroup, null);
  groups.selectedGroup = null;
  settingsManager.isGroupOverlayDisabled = false;
};
groups.init = function () {
  // Might not be needed anymore
};

export { groups };